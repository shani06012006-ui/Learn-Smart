"""
Public endpoints of the student activation flow (see accounts/activation.py).

    POST /api/v1/auth/activation/validate/   { token }
    POST /api/v1/auth/activation/complete/   { token, new_password, confirm_password }
    POST /api/v1/auth/activation/request/    { email }

None of them needs a login (the student has no password yet). Failures are 400 or
403 - never 401 - so the frontend's token-refresh logic is not triggered.
"""
import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .activation import (
    ActivationError,
    ActivationRequestThrottle,
    ActivationThrottle,
    CompleteSerializer,
    RequestLinkSerializer,
    TokenSerializer,
    check_activation_token,
    complete_activation,
    mask_email,
    request_new_link,
)
from .serializers import UserSerializer
from .token_service import issue_access_token, issue_refresh_token
from .views import _client_ip, _user_agent

logger = logging.getLogger(__name__)


def _error(detail, http_status, code=None):
    body = {"detail": detail, "status_code": http_status}
    if code:
        body["code"] = code
    return Response({"error": body}, status=http_status)


def _activation_error_response(exc: ActivationError):
    return _error(exc.detail, exc.http_status, exc.code)


class _ActivationBase(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ActivationThrottle]


class ActivationValidateView(_ActivationBase):
    """
    Step "System validates the activation token".

    200 -> { valid: true, first_name, email_hint, expires_at }   (token is NOT used up)
    400/403 -> { error: { detail, code } } with code one of
               invalid_token | token_expired | token_used | already_activated | account_inactive
    """

    def post(self, request):
        serializer = TokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            row = check_activation_token(serializer.validated_data["token"])
        except ActivationError as exc:
            return _activation_error_response(exc)

        user = row.user
        return Response(
            {
                "valid": True,
                "first_name": user.first_name,
                "email_hint": mask_email(user.email),
                "expires_at": row.expires_at,
            },
            status=status.HTTP_200_OK,
        )


class ActivationCompleteView(_ActivationBase):
    """
    Step "Student enters new + confirm password -> save -> invalidate token -> dashboard".

    200 -> { access, refresh, user, remember_me }   (same shape as /auth/login/)
    400 -> passwords differ / password too weak (the link stays valid, the student retries)
    400/403 -> the link is bad (same codes as validate)
    """

    def post(self, request):
        serializer = CompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user = complete_activation(data["token"], data["new_password"])
        except ActivationError as exc:
            return _activation_error_response(exc)

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
            status=status.HTTP_200_OK,
        )


class ActivationRequestView(_ActivationBase):
    """
    "Request a new link". Always 200 with the same text, whether or not the e-mail
    belongs to a student who is waiting to activate (no account enumeration).
    """

    throttle_classes = [ActivationRequestThrottle]

    def post(self, request):
        serializer = RequestLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            request_new_link(serializer.validated_data["email"])
        except Exception:  # noqa: BLE001 - the answer must not depend on what went wrong
            logger.exception("activation.request_failed")

        return Response(
            {
                "detail": (
                    "If that e-mail belongs to an account that is waiting to be set up, "
                    "we've sent a new activation link to it."
                )
            },
            status=status.HTTP_200_OK,
        )
