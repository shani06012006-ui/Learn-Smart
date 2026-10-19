# backend/accounts/middleware.py
import logging
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from channels.sessions import CookieMiddleware, SessionMiddleware
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_user_from_token(token):
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        from accounts.models import User

        access = AccessToken(token)
        user_id = access.get("user_id")
        if not user_id:
            return AnonymousUser()
        return User.objects.get(id=user_id)
    except Exception as exc:
        logger.warning("JWT auth failed: %s", exc)
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # 1. Try query string ?token=
        query_string = parse_qs(scope["query_string"].decode())
        token = query_string.get("token", [None])[0]

        # 2. Fallback to Authorization header
        if not token:
            headers = dict(scope.get("headers", []))
            auth_header = headers.get(b"authorization", b"").decode()
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]

        if token:
            scope["user"] = await get_user_from_token(token)
            scope["auth_error"] = None
        else:
            scope["user"] = AnonymousUser()
            scope["auth_error"] = "no_token"

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return CookieMiddleware(SessionMiddleware(JWTAuthMiddleware(inner)))