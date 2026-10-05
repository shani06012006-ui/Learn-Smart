"""
Chat WebSocket consumer.

One consumer class:

  ThreadChatConsumer   -- one instance per (user, thread) WebSocket connection.

Protocol:
  WS URL:  /ws/chat/thread/<uuid:thread_id>/
  Auth:    handled by JWTTicketAuthMiddlewareStack (scope["user"]).

  Inbound (server -> client) events:
    { "type": "chat.ready",   "thread_id": "...", "user": {...} }
    { "type": "chat.message", "message": { ...ChatMessageReadSerializer... } }
    { "type": "chat.error",   "detail": "..." }

  The client does NOT send chat messages over the socket in V1 —
  sending happens via REST POST so we can reuse the exact same
  validation/serialization path. The socket is a one-way push channel.

Groups:
  Each thread has a Channels group named "chat_thread_<thread_id>".
  REST views broadcast into that group when a message or reaction
  changes, and every connected client receives the update.
"""
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class ThreadChatConsumer(AsyncWebsocketConsumer):
    """
    Per-thread subscription socket. Read-only in V1:
    the socket only pushes, it never accepts chat messages.
    """

    async def connect(self):
        self.user = self.scope.get("user")
        self.auth_error = self.scope.get("auth_error")
        self.thread_id = self.scope["url_route"]["kwargs"]["thread_id"]
        self.group_name = f"chat_thread_{self.thread_id}"

        # ── Auth gate ──────────────────────────────────────
        if self.user is None or not self.user.is_authenticated:
            await self.accept()
            await self.send(json.dumps({
                "type": "chat.error",
                "detail": self.auth_error or "unauthenticated",
            }))
            await self.close(code=4001)
            return

        # ── Membership gate ────────────────────────────────
        allowed = await self._is_member_or_admin()
        if not allowed:
            await self.accept()
            await self.send(json.dumps({
                "type": "chat.error",
                "detail": "forbidden",
            }))
            await self.close(code=4003)
            return

        # ── Join group ─────────────────────────────────────
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send(json.dumps({
            "type": "chat.ready",
            "thread_id": str(self.thread_id),
            "user": {
                "id": str(self.user.id),
                "full_name": self.user.get_full_name(),
                "role": self.user.role,
            },
        }))

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # V1: client doesn't send anything meaningful; ignore politely.
        pass

    # ─────────────────────────────────────────────────────
    # Group event handler
    # ─────────────────────────────────────────────────────
    async def chat_message(self, event):
        """
        Fired by REST views via group_send({"type": "chat.message", ...}).
        `event["message"]` is a pre-serialized ChatMessageReadSerializer dict.
        """
        await self.send(json.dumps({
            "type": "chat.message",
            "message": event.get("message"),
        }))

    # ─────────────────────────────────────────────────────
    # DB helpers
    # ─────────────────────────────────────────────────────
    @database_sync_to_async
    def _is_member_or_admin(self):
        from .models import Thread, ThreadMember

        try:
            thread = Thread.objects.get(pk=self.thread_id)
        except Thread.DoesNotExist:
            return False

        # Institution scoping
        if not self.user.is_superuser and thread.institution_id != self.user.institution_id:
            return False

        # Admins are always allowed
        if self.user.role == "admin":
            return True

        # Otherwise must be a member
        return ThreadMember.objects.filter(thread=thread, user=self.user).exists()