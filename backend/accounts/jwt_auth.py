"""
Custom DRF authentication class.

Wraps SimpleJWT's JWTAuthentication and adds one check: if the user's
`tokens_valid_after` is set and the JWT's `iat` claim is earlier than
that timestamp, the token is rejected even if it has not otherwise
expired.

This closes the "access JWTs outlive their refresh tokens" gap: revoking
a refresh token stops new refreshes, but already-issued access JWTs
remain valid until their natural expiry (30 minutes). Setting
`tokens_valid_after = now()` on a user makes every outstanding access
JWT for that user dead on its next use.

The check costs nothing extra: Django's auth machinery already loads
`User` for every authenticated request.

It also refuses accounts with `must_set_password` (a student whose activation
link has not been used yet) - see accounts/activation.py.
"""
from datetime import datetime, timezone as dt_timezone

from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


class TokensValidAfterJWTAuthentication(JWTAuthentication):
    """JWTAuthentication with a `tokens_valid_after` epoch check."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, validated_token = result

        tva = getattr(user, "tokens_valid_after", None)
        if tva is not None:
            iat = validated_token.get("iat")
            if iat is not None:
                issued_at = datetime.fromtimestamp(iat, tz=dt_timezone.utc)
                if issued_at < tva:
                    raise AuthenticationFailed(
                        "Session has been revoked.",
                        code="session_revoked",
                    )

        # Student activation: an account that has not chosen its password yet gets no
        # API access, whatever token it presents. 403 (not 401) on purpose: a 401
        # would make the frontend try to refresh the session and loop.
        if getattr(user, "must_set_password", False):
            raise PermissionDenied(
                "Finish setting up your account with the activation link first.",
                code="password_setup_required",
            )

        return user, validated_token