"""
Authentication endpoints.

These are the endpoints the React admin (and, later, the teacher/student
apps once they migrate off the mock auth) talk to over HTTP.

Endpoints:
    POST /api/v1/auth/login/            email + password -> access + refresh
    POST /api/v1/auth/refresh/          rotate refresh -> new pair
    GET  /api/v1/auth/me/               Authorization -> user
    POST /api/v1/auth/logout/           revoke the supplied refresh token
    POST /api/v1/auth/ws-ticket/        mint a single-use WebSocket ticket

Refresh tokens are stateful (see accounts/token_service.py). Access
tokens are JWTs, validated by accounts/jwt_auth.py which also enforces
`tokens_valid_after`.
"""
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.audit import log_audit

from .models import User
from .serializers import UserSerializer
from .token_service import (
    RefreshTokenError,
    issue_access_token,
    issue_refresh_token,
    revoke_one,
    rotate_refresh_token,
)
from .ws_tickets import mint_ticket


def _client_ip(request):
    return request.META.get("REMOTE_ADDR") or None


def _user_agent(request):
    return request.META.get("HTTP_USER_AGENT", "") or ""


class LoginView(APIView):
    """
    Email + password -> JWT access + opaque stateful refresh.

    On success:
      - user.last_login is updated
      - a RefreshToken row is created (new family)
      - an audit event is written
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        if not email or not password:
            return Response(
                {"error": {"detail": "Email and password are required.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=email, password=password)

        if user is None:
            log_audit(
                action="auth.login.failed",
                actor=None,
                actor_type="anonymous",
                metadata={"email": email},
                request=request,
            )
            return Response(
                {"error": {"detail": "Invalid email or password.", "status_code": 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            log_audit(
                action="auth.login.blocked",
                actor=user,
                institution=user.institution,
                metadata={"reason": "account_inactive"},
                request=request,
            )
            return Response(
                {"error": {"detail": "This account has been deactivated.", "status_code": 403}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Update last_login (Django's built-in field).
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        # Issue our own stateful refresh token (new family).
        raw_refresh, _row = issue_refresh_token(
            user,
            ip_address=_client_ip(request),
            user_agent=_user_agent(request),
        )
        access = issue_access_token(user)

        log_audit(
            action="auth.login.success",
            actor=user,
            institution=user.institution,
            request=request,
        )

        return Response(
            {
                "access": access,
                "refresh": raw_refresh,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class RefreshView(APIView):
    """
    Exchange a refresh token for a new pair. Rotation is atomic (row lock
    in token_service.rotate_refresh_token). Reuse of a rotated token kills
    the whole family and returns 401.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw = request.data.get("refresh") or ""
        if not raw:
            return Response(
                {"error": {"detail": "refresh is required.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_raw, new_access, user = rotate_refresh_token(
                raw,
                ip_address=_client_ip(request),
                user_agent=_user_agent(request),
            )
        except RefreshTokenError as e:
            if e.reason == "reuse_detected":
                log_audit(
                    action="auth.refresh.reuse_detected",
                    actor=e.user,
                    institution=e.user.institution if e.user else None,
                    request=request,
                )
            return Response(
                {"error": {"detail": "Invalid or expired refresh token.", "status_code": 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {"access": new_access, "refresh": new_raw},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """Return the currently authenticated user. Requires a valid access token."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Revoke the supplied refresh token. Idempotent. Access tokens issued
    before logout remain valid until their natural expiry — see the
    architecture doc for the reasoning.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw = request.data.get("refresh") or ""
        if raw:
            revoke_one(raw, reason="logout")

        log_audit(
            action="auth.logout",
            actor=request.user,
            institution=request.user.institution,
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class WsTicketView(APIView):
    """
    Mint a short-lived, single-use ticket for opening a WebSocket.

    The client presents its access JWT in the Authorization header (as
    with any authenticated request). The response body contains an opaque
    ticket string that is valid for 30 seconds and can be consumed once.

    This avoids putting the long-lived access JWT in the WebSocket URL,
    which would leak it into proxy and server logs.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ticket = mint_ticket(request.user)
        log_audit(
            action="auth.ws_ticket.issued",
            actor=request.user,
            institution=request.user.institution,
            request=request,
        )
        return Response({"ticket": ticket}, status=status.HTTP_200_OK)


# Keep a reference so `from .views import User` doesn't break.
_ = User