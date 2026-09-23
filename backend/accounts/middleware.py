"""
WebSocket authentication middleware.

Reads a single-use opaque ticket from the WebSocket URL query string
(`?ticket=...`), consumes it against Redis, and loads the user from the
database. The ticket itself is deleted on consumption, so it cannot be
replayed.

Design:

  - The browser first obtains a ticket via `POST /api/v1/auth/ws-ticket/`
    (authenticated with the access JWT in the Authorization header).
  - The ticket is opaque, single-use, and expires in 30 seconds.
  - On WebSocket connect, this middleware consumes the ticket, extracts
    `user_id` from the stored payload, and loads the user from the DB.
  - The consumer never trusts any client-supplied identity — only the
    server-side ticket payload.

On any failure, `scope["user"]` is set to None and `scope["auth_error"]`
is set to a short reason string. The consumer decides how to close the
connection.

Known limitation: institution-state check is not implemented because the
Institution model has no `state` field yet. When it does, add:

    if user.institution_id and user.institution.state != "active":
        scope["auth_error"] = "institution_inactive"
        return await super().__call__(scope, receive, send)
"""
from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model

from .ws_tickets import consume_ticket


def _extract_query_param(query_string: str, name: str):
    """Pull one query-string parameter from a raw query string."""
    if not query_string:
        return None
    for item in query_string.split("&"):
        if "=" not in item:
            continue
        key, value = item.split("=", 1)
        if key == name:
            return value
    return None


@database_sync_to_async
def _load_user(user_id):
    User = get_user_model()
    try:
        return User.objects.select_related("institution").get(pk=user_id)
    except User.DoesNotExist:
        return None


class JWTTicketAuthMiddleware(BaseMiddleware):
    """
    Middleware that authenticates a WebSocket connection using a
    single-use ticket. Populates `scope["user"]` (None on failure) and
    `scope["auth_error"]` (None on success).
    """

    async def __call__(self, scope, receive, send):
        scope["user"] = None
        scope["auth_error"] = None

        query_string = scope.get("query_string", b"").decode()
        ticket = _extract_query_param(query_string, "ticket")

        if not ticket:
            scope["auth_error"] = "missing_ticket"
            return await super().__call__(scope, receive, send)

        # Consume the ticket. Single-use: subsequent attempts fail.
        payload = consume_ticket(ticket)
        if payload is None:
            scope["auth_error"] = "invalid_or_used_ticket"
            return await super().__call__(scope, receive, send)

        # Load the user from the ticket's server-side payload. We never
        # trust anything from the client beyond the opaque ticket itself.
        user = await _load_user(payload.get("user_id"))
        if user is None:
            scope["auth_error"] = "user_not_found"
            return await super().__call__(scope, receive, send)

        if not user.is_active:
            scope["auth_error"] = "user_inactive"
            return await super().__call__(scope, receive, send)

        # NOTE: no institution-state check yet — the model has no state
        # field. Add it when the field exists.

        scope["user"] = user
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Kept under the original name so `config/asgi.py` doesn't need to
    change when the middleware implementation changes.
    """
    return JWTTicketAuthMiddleware(AuthMiddlewareStack(inner))