"""
Authentication endpoints for the API.

These are the only auth endpoints the *React admin* talks to over HTTP.
The teacher/student frontend still uses the mock auth slice (autolearn.*
localStorage keys); the admin uses a separate token store under the
`admin.*` keys. The two are intentionally independent — see the plan.

Endpoints:
    POST /api/v1/auth/login/    email + password  -> { access, refresh, user }
    POST /api/v1/auth/refresh/  refresh token     -> { access, refresh? }
    GET  /api/v1/auth/me/       Authorization     -> user
    POST /api/v1/auth/logout/   refresh token     -> 204 (blacklists refresh)
"""
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserSerializer


def _issue_tokens(user):
    """Build a fresh access+refresh pair for a user."""
    refresh = RefreshToken.for_user(user)
    # Embed a few useful claims so the client can read role/institution
    # without an extra round-trip on every page load. The server always
    # re-validates from the DB on /me/, so these are convenience only.
    refresh["role"] = user.role
    refresh["email"] = user.email
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


class LoginView(APIView):
    """
    Email + password -> JWT pair + user payload.

    Accepts the body as either JSON or form-encoded (DRF handles both).
    Returns 401 with a generic message on bad credentials — never reveals
    whether the email exists.
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

        # normalize_email is idempotent; authenticate() matches on
        # USERNAME_FIELD which is "email" here.
        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response(
                {"error": {"detail": "Invalid email or password.", "status_code": 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {"error": {"detail": "This account has been deactivated.", "status_code": 403}},
                status=status.HTTP_403_FORBIDDEN,
            )

        tokens = _issue_tokens(user)
        return Response(
            {
                **tokens,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class RefreshView(APIView):
    """Exchange a refresh token for a new access token (rotation on)."""

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
            token = RefreshToken(raw)
            access = str(token.access_token)
            # If rotation is enabled in SIMPLE_JWT, mint a new refresh as
            # well so the client can keep a valid chain.
            new_refresh = str(token) if token.get("rotated") is False else None
        except TokenError as e:
            return Response(
                {"error": {"detail": str(e) or "Invalid refresh token.", "status_code": 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        payload = {"access": access}
        if new_refresh:
            payload["refresh"] = new_refresh
        return Response(payload, status=status.HTTP_200_OK)


class MeView(APIView):
    """Return the currently authenticated user. Requires a valid access token."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Blacklist the caller's refresh token so it can't be reused.

    Access tokens are stateless and remain valid until they expire (30 min
    by default). For the minimum admin slice, that's acceptable — the
    client discards the access token on logout. If we want hard
    invalidation of access tokens later, we add a denylist middleware.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw = request.data.get("refresh") or ""
        if raw:
            try:
                RefreshToken(raw).blacklist()
            except TokenError:
                # Token already invalid/expired/blacklisted — treat as
                # success. Logout should be idempotent.
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)


# Keep a reference so `from .views import User` in any future test file
# doesn't break. (Some codebases re-export the model this way.)
_ = User