import json
import logging
from datetime import datetime, timezone as dt_timezone

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache
from django.utils import timezone

from .models import User
from .services import touch_student_attendance, touch_teacher_attendance


logger = logging.getLogger("accounts.consumers")


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PRESENCE_TTL_SECONDS = 90           # 3x heartbeat interval
HEARTBEAT_INTERVAL_HINT_SECONDS = 30
LAST_SEEN_THROTTLE_SECONDS = 60     # DB write throttle for user.last_seen_at
SNAPSHOT_LIMIT = 200                # cap how many users we return in a snapshot


# ---------------------------------------------------------------------------
# Redis helpers
# ---------------------------------------------------------------------------

def _user_key(user_id):
    return f"presence:user:{user_id}"


def _institution_set_key(institution_id):
    return f"presence:institution:{institution_id}"


def _group_name(institution_id):
    return f"presence.institution.{institution_id}"


def _last_seen_throttle_key(user_id):
    return f"last_seen_throttle:{user_id}"


# ---------------------------------------------------------------------------
# Sync DB helpers
# ---------------------------------------------------------------------------

@database_sync_to_async
def _persist_last_seen(user_id):

    User.objects.filter(pk=user_id).update(last_seen_at=timezone.now())

    try:
        user = User.objects.filter(pk=user_id).only("id", "role").first()
        if user is None:
            return
        if user.role == User.ROLE_TEACHER:
            touch_teacher_attendance(user.id)
        elif user.role == User.ROLE_STUDENT:
            touch_student_attendance(user.id)
    except Exception:
        logger.exception("attendance.touch_failed", extra={"user_id": str(user_id)})


@database_sync_to_async
def _load_users_by_id(user_ids):
    """Bulk-load users for the presence snapshot."""
    qs = User.objects.filter(pk__in=user_ids, is_active=True).only(
        "id", "email", "first_name", "last_name", "role", "institution_id"
    )
    return list(qs)


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

def _user_brief(user):
    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "institution_id": str(user.institution_id) if user.institution_id else None,
    }


# ---------------------------------------------------------------------------
# PresenceConsumer
# ---------------------------------------------------------------------------

class PresenceConsumer(AsyncWebsocketConsumer):
    """
    User presence. Every authenticated user connects here once per open
    browser tab (multiple tabs allowed — the Redis presence set stores
    one entry per user, updated on every connect and refresh).

    On connect:
      - reject if unauthenticated (close code 4401)
      - record presence in Redis with TTL
      - add to institution set
      - broadcast join event to institution group
      - respond with {"type": "presence.welcome"}

    On heartbeat:
      - refresh TTL
      - throttled DB write of last_seen_at
      - respond with {"type": "pong"}

    On disconnect:
      - remove from institution set
      - broadcast leave event
    """

    async def connect(self):
        user = self.scope.get("user")
        if user is None or not user.is_authenticated:
            await self.close(code=4401)
            return

        self.user = user
        self.user_id = str(user.id)
        self.institution_id = str(user.institution_id) if user.institution_id else None

        if self.institution_id is None:
            # Presence is meaningless without an institution scope. Close.
            await self.close(code=4401)
            return

        self.group_name = _group_name(self.institution_id)

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Redis: individual key with TTL, and set membership.
        payload = {
            "institution_id": self.institution_id,
            "connected_at": datetime.now(dt_timezone.utc).isoformat(),
        }
        cache.set(_user_key(self.user_id), json.dumps(payload), timeout=PRESENCE_TTL_SECONDS)

        # `cache.add` on a Redis set is not directly available via Django's
        # cache API. Use a small helper: store the set as a serialized
        # list under a key with a longer TTL than any single user's, and
        # reconcile on the sweep job.
        try:
            current = cache.get(_institution_set_key(self.institution_id)) or []
            if not isinstance(current, list):
                current = []
            if self.user_id not in current:
                current.append(self.user_id)
            cache.set(
                _institution_set_key(self.institution_id),
                current,
                timeout=PRESENCE_TTL_SECONDS * 4,
            )
        except Exception:
            # Presence bookkeeping must not break the connection.
            pass

        # Throttled last_seen DB write on connect.
        await self._maybe_persist_last_seen()

        # Broadcast join.
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "presence.event",
                "event": "joined",
                "user": _user_brief(user),
            },
        )

        # Welcome message.
        await self.send(text_data=json.dumps({"type": "presence.welcome"}))

    async def disconnect(self, close_code):
        if not hasattr(self, "user_id") or not getattr(self, "institution_id", None):
            return

        # Remove from set.
        try:
            current = cache.get(_institution_set_key(self.institution_id)) or []
            if isinstance(current, list) and self.user_id in current:
                current = [u for u in current if u != self.user_id]
                cache.set(
                    _institution_set_key(self.institution_id),
                    current,
                    timeout=PRESENCE_TTL_SECONDS * 4,
                )
        except Exception:
            pass

        # Delete individual key.
        try:
            cache.delete(_user_key(self.user_id))
        except Exception:
            pass

        # Broadcast leave.
        try:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "presence.event",
                    "event": "left",
                    "user": {"id": self.user_id},
                },
            )
        except Exception:
            pass

        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        try:
            msg = json.loads(text_data)
        except (ValueError, TypeError):
            return

        msg_type = msg.get("type")

        if msg_type == "heartbeat":
            # Refresh TTL.
            try:
                payload = {
                    "institution_id": self.institution_id,
                    "connected_at": datetime.now(dt_timezone.utc).isoformat(),
                }
                cache.set(_user_key(self.user_id), json.dumps(payload), timeout=PRESENCE_TTL_SECONDS)
            except Exception:
                pass

            await self._maybe_persist_last_seen()
            await self.send(text_data=json.dumps({"type": "pong"}))
            return

        # Unknown message types are ignored.

    async def _maybe_persist_last_seen(self):
        """
        Write last_seen_at to the DB at most once per 60 seconds per user.
        Uses `cache.add` (SETNX semantics) as the throttle marker.
        """
        try:
            allowed = cache.add(_last_seen_throttle_key(self.user_id), True, timeout=LAST_SEEN_THROTTLE_SECONDS)
        except Exception:
            allowed = False

        if allowed:
            try:
                await _persist_last_seen(self.user_id)
            except Exception:
                pass

    async def presence_event(self, event):
        """Handler for group messages named `presence.event`."""
        await self.send(text_data=json.dumps({
            "type": "presence.event",
            "event": event["event"],
            "user": event["user"],
        }))


# ---------------------------------------------------------------------------
# AdminPresenceConsumer
# ---------------------------------------------------------------------------

class AdminPresenceConsumer(AsyncWebsocketConsumer):
    """
    Admin subscription to presence events for the admin's own institution.

    On connect:
      - reject if unauthenticated (close 4401)
      - reject if role is not admin (close 4401)
      - join the institution's presence group
      - send the current online-user snapshot for the institution

    On message:
      - accepts {"type": "refresh"} to re-request the snapshot

    Never receives events for other institutions — the group is chosen
    from scope["user"].institution_id, not from any client input.
    """

    async def connect(self):
        user = self.scope.get("user")
        if user is None or not user.is_authenticated:
            await self.close(code=4401)
            return

        if user.role != "admin" and not getattr(user, "is_superuser", False):
            await self.close(code=4401)
            return

        if user.institution_id is None and not getattr(user, "is_superuser", False):
            # An institution admin must be attached to an institution.
            # A superuser has no institution and would need a different
            # subscription model — not supported in Phase 3a.
            await self.close(code=4401)
            return

        self.user = user
        self.institution_id = str(user.institution_id) if user.institution_id else None

        if self.institution_id is None:
            # Superuser without institution — close for now. A future
            # phase may allow a platform-wide subscription.
            await self.close(code=4401)
            return

        self.group_name = _group_name(self.institution_id)

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self._send_snapshot()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            try:
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
            except Exception:
                pass

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        try:
            msg = json.loads(text_data)
        except (ValueError, TypeError):
            return

        if msg.get("type") == "refresh":
            await self._send_snapshot()

    async def presence_event(self, event):
        """Forward join/leave events to the admin."""
        await self.send(text_data=json.dumps({
            "type": "presence.event",
            "event": event["event"],
            "user": event["user"],
        }))

    async def _send_snapshot(self):
        try:
            user_ids = cache.get(_institution_set_key(self.institution_id)) or []
        except Exception:
            user_ids = []

        if not isinstance(user_ids, list):
            user_ids = []

        # Only include users whose individual presence key still exists —
        # the set may lag behind the TTL-expired keys.
        live_ids = []
        for uid in user_ids[:SNAPSHOT_LIMIT]:
            try:
                if cache.get(_user_key(uid)) is not None:
                    live_ids.append(uid)
            except Exception:
                continue

        users = await _load_users_by_id(live_ids)
        snapshot = [_user_brief(u) for u in users]

        await self.send(text_data=json.dumps({
            "type": "presence.snapshot",
            "users": snapshot,
        }))