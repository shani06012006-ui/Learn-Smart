from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PendingRegistration, User
from .registration import (
    CODE_TTL,
    MAX_ATTEMPTS,
    RESEND_COOLDOWN,
    RegisterSerializer,
    RegistrationEmailError,
    RegistrationThrottle,
    ResendSerializer,
    VerifySerializer,
    begin_registration,
    code_matches,
    create_user_from_pending,
    resend_code,
    seconds_until_resend,
    token_matches,
)
from .serializers import UserSerializer
from .token_service import issue_access_token, issue_refresh_token
from .views import _client_ip, _user_agent


def _error(detail, http_status, code=None, **extra):
    body = {"detail": detail, "status_code": http_status}
    if code:
        body["code"] = code
    body.update(extra)
    return Response({"error": body}, status=http_status)


_START_AGAIN = (
    "We couldn't find this sign-up. It may have expired, so please start again."
)
_EMAIL_FAILED = "We couldn't send the verification email. Please try again in a moment."


class _RegistrationBase(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [RegistrationThrottle]


class RegisterView(_RegistrationBase):
    """
    POST /api/v1/auth/register/
    body: { first_name, last_name, email, password, password_confirm, role? }

    Starts a TEACHER sign-up: validates the details, parks them (password
    hashed) and e-mails a 6-digit code. No account exists yet.

    202 -> { email, detail, registration_token, expires_in, resend_after }
           Keep `registration_token` in the browser; verify/resend need it.
    """

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        email = data["email"]

        # A code was sent a moment ago: don't overwrite that sign-up or send another mail.
        existing = PendingRegistration.objects.filter(email=email).first()
        if existing is not None:
            wait = seconds_until_resend(existing)
            if wait > 0:
                return _error(
                    f"We just sent a code to {email}. Check your inbox, "
                    f"or try again in {wait} seconds.",
                    status.HTTP_429_TOO_MANY_REQUESTS,
                    "code_recently_sent",
                    retry_after=wait,
                )

        try:
            _pending, token = begin_registration(
                email=email,
                first_name=data["first_name"].strip(),
                last_name=data["last_name"].strip(),
                password=data["password"],
            )
        except RegistrationEmailError:
            return _error(_EMAIL_FAILED, status.HTTP_503_SERVICE_UNAVAILABLE, "email_failed")

        return Response(
            {
                "email": email,
                "detail": f"We sent a 6-digit code to {email}.",
                "registration_token": token,
                "expires_in": int(CODE_TTL.total_seconds()),
                "resend_after": int(RESEND_COOLDOWN.total_seconds()),
            },
            status=status.HTTP_202_ACCEPTED,
        )


class RegisterVerifyView(_RegistrationBase):
    """
    POST /api/v1/auth/register/verify/
    body: { email, code, registration_token }

    Confirms the code, creates the teacher account and signs the user in.
    201 -> { access, refresh, user, remember_me }   (same shape as /auth/login/)
    """

    def post(self, request):
        serializer = VerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]
        token = serializer.validated_data["registration_token"]

        with transaction.atomic():
            pending = PendingRegistration.objects.select_for_update().filter(email=email).first()

            # Wrong/unknown token: answer exactly like "no sign-up" and do NOT touch
            # the attempt counter, so a stranger cannot burn someone else's tries.
            if pending is None or not token_matches(pending, token):
                return _error(_START_AGAIN, status.HTTP_400_BAD_REQUEST, "no_pending_registration")

            if pending.is_expired():
                pending.delete()
                return _error(
                    "This code has expired. Please start again.",
                    status.HTTP_400_BAD_REQUEST,
                    "code_expired",
                )

            if not code_matches(pending, code):
                pending.attempts += 1
                if pending.attempts >= MAX_ATTEMPTS:
                    pending.delete()
                    return _error(
                        "Too many incorrect codes. Please start again.",
                        status.HTTP_400_BAD_REQUEST,
                        "too_many_attempts",
                    )
                pending.save(update_fields=["attempts"])
                left = MAX_ATTEMPTS - pending.attempts
                return _error(
                    {"code": [f"That code isn't right. {left} {'try' if left == 1 else 'tries'} left."]},
                    status.HTTP_400_BAD_REQUEST,
                    "wrong_code",
                    attempts_left=left,
                )

            # Code and token are both right. Someone may have created this account since.
            if User.objects.filter(email__iexact=email).exists():
                pending.delete()
                return _error(
                    "An account with this email already exists. Try logging in instead.",
                    status.HTTP_400_BAD_REQUEST,
                    "email_taken",
                )

            user = create_user_from_pending(pending)
            pending.delete()

        raw_refresh, _row = issue_refresh_token(
            user, ip_address=_client_ip(request), user_agent=_user_agent(request)
        )
        return Response(
            {
                "access": issue_access_token(user),
                "refresh": raw_refresh,
                "user": UserSerializer(user).data,
                "remember_me": False,
            },
            status=status.HTTP_201_CREATED,
        )


class RegisterResendView(_RegistrationBase):
    """
    POST /api/v1/auth/register/resend/
    body: { email, registration_token }

    Sends a fresh code (and resets the attempt counter). One per minute.
    """

    def post(self, request):
        serializer = ResendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        token = serializer.validated_data["registration_token"]

        pending = PendingRegistration.objects.filter(email=email).first()
        if pending is None or not token_matches(pending, token):
            return _error(_START_AGAIN, status.HTTP_400_BAD_REQUEST, "no_pending_registration")

        wait = seconds_until_resend(pending)
        if wait > 0:
            return _error(
                f"Please wait {wait} seconds before asking for another code.",
                status.HTTP_429_TOO_MANY_REQUESTS,
                "resend_too_soon",
                retry_after=wait,
            )

        try:
            resend_code(pending)
        except RegistrationEmailError:
            return _error(_EMAIL_FAILED, status.HTTP_503_SERVICE_UNAVAILABLE, "email_failed")

        return Response(
            {
                "email": email,
                "detail": f"We sent a new code to {email}.",
                "expires_in": int(CODE_TTL.total_seconds()),
                "resend_after": int(RESEND_COOLDOWN.total_seconds()),
            },
            status=status.HTTP_200_OK,
        )
