"""
WebSocket consumer for real-time leave notifications.

One connection per user. The consumer joins:

  - `leaves_admin_<institution_id>` if the user is an admin
  - `leaves_user_<user_id>`        for all users

Events pushed:

  leave.created    -> admins     (new request submitted)
  leave.updated    -> the owner  (approved / rejected)
  leave.cancelled  -> admins     (owner cancelled)
"""
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class LeavesConsumer(AsyncWebsocketConsumer):
    """
    Single socket per user. Joins the user-specific group plus (for
    admins) the institution-wide admin group.
    """

    async def connect(self):
        self.user = self.scope.get("user")
        self.auth_error = self.scope.get("auth_error")
        self.groups_joined = []

        if self.user is None or not self.user.is_authenticated:
            await self.accept()
            await self.send(json.dumps({
                "type": "leave.error",
                "detail": self.auth_error or "unauthenticated",
            }))
            await self.close(code=4001)
            return

        # Personal channel
        self.user_group = f"leaves_user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        self.groups_joined.append(self.user_group)

        # Admin channel (only for admins of an institution)
        if self.user.role == "admin" and self.user.institution_id:
            self.admin_group = f"leaves_admin_{self.user.institution_id}"
            await self.channel_layer.group_add(self.admin_group, self.channel_name)
            self.groups_joined.append(self.admin_group)
        else:
            self.admin_group = None

        await self.accept()

        await self.send(json.dumps({
            "type": "leave.ready",
            "user": {
                "id": str(self.user.id),
                "role": self.user.role,
            },
            "channels": self.groups_joined,
        }))

    async def disconnect(self, code):
        for g in getattr(self, "groups_joined", []):
            try:
                await self.channel_layer.group_discard(g, self.channel_name)
            except Exception:
                pass

    async def receive(self, text_data=None, bytes_data=None):
        # One-way push only
        pass

    # ── Group event handlers ──────────────────────────────

    async def leave_created(self, event):
        await self.send(json.dumps({
            "type": "leave.created",
            "leave": event.get("leave"),
        }))

    async def leave_updated(self, event):
        await self.send(json.dumps({
            "type": "leave.updated",
            "leave": event.get("leave"),
        }))

    async def leave_cancelled(self, event):
        await self.send(json.dumps({
            "type": "leave.cancelled",
            "leave_id": event.get("leave_id"),
        }))
