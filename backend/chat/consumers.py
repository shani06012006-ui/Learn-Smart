"""
Chat + Notification WebSocket consumers.
"""
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class ThreadChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        self.auth_error = self.scope.get("auth_error")
        self.thread_id = self.scope["url_route"]["kwargs"]["thread_id"]
        self.group_name = f"chat_thread_{self.thread_id}"

        if self.user is None or not self.user.is_authenticated:
            await self.accept()
            await self.send(json.dumps({"type": "chat.error", "detail": self.auth_error or "unauthenticated"}))
            await self.close(code=4001)
            return

        allowed = await self._is_member_or_admin()
        if not allowed:
            await self.accept()
            await self.send(json.dumps({"type": "chat.error", "detail": "forbidden"}))
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send(json.dumps({
            "type": "chat.ready",
            "thread_id": str(self.thread_id),
            "user": {"id": str(self.user.id), "full_name": self.user.get_full_name(), "role": self.user.role},
        }))

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        """Handle incoming WS messages (e.g., typing indicators)."""
        if not text_data:
            return
        
        try:
            data = json.loads(text_data)
            msg_type = data.get("type")

            if msg_type == "typing":
                # Broadcast to everyone else in the thread
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "chat.typing",
                        "user_id": str(self.user.id),
                        "user_name": self.user.get_full_name() or self.user.email,
                        "is_typing": data.get("is_typing", False),
                    }
                )
        except Exception as exc:
            pass

    async def chat_typing(self, event):
        """Send typing event to the client."""
        await self.send(json.dumps({
            "type": "chat.typing",
            "user_id": event.get("user_id"),
            "user_name": event.get("user_name"),
            "is_typing": event.get("is_typing"),
        }))

    async def chat_message(self, event):
        await self.send(json.dumps({"type": "chat.message", "message": event.get("message")}))

    @database_sync_to_async
    def _is_member_or_admin(self):
        from .models import Thread, ThreadMember
        try:
            thread = Thread.objects.get(pk=self.thread_id)
        except Thread.DoesNotExist:
            return False
        if not self.user.is_superuser and thread.institution_id != self.user.institution_id:
            return False
        if self.user.role == "admin":
            return True
        return ThreadMember.objects.filter(thread=thread, user=self.user).exists()


# 👇 NEW CONSUMER FOR LIVE NOTIFICATIONS
class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        if self.user is None or not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        # Send unread count immediately on connect
        await self.send(json.dumps({
            "type": "unread_sync",
            "count": await self._unread_count()
        }))

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            "type": "notification",
            "notification": event.get("notification")
        }))

    @database_sync_to_async
    def _unread_count(self):
        from notifications.models import Notification
        return Notification.objects.filter(recipient=self.user, is_read=False).count()