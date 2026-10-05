"""
Chat serializers.

Field names are chosen to match the existing frontend contract in
`features/chat/*` so the UI needs minimal changes when we rewire
`chatApi.js` from the mock slice to the real backend.

Key points:

  - `initials` is derived per-thread:
      * Group threads -> from the group title
      * DM threads    -> from the OTHER member's full_name

  - `presence` returns a stable `{is_online: False}` stub in V1. Real
    presence is out of Chat V1 scope -- it lives in the accounts
    presence WebSocket.

  - `class_id` is the exposed name for the model's `class_course_id`
    FK, matching what the frontend reads.

  - `is_self` requires the request in context; the viewset supplies it.
"""
from rest_framework import serializers

from accounts.models import User

from .models import Message, Thread, ThreadMember


def _initials(full_name: str) -> str:
    """Return up to two uppercase initials from a name. 'Anita Iyer' -> 'AI'."""
    parts = [p for p in (full_name or "").split() if p]
    if not parts:
        return "?"
    return "".join(p[0] for p in parts[:2]).upper()


class ChatUserBriefSerializer(serializers.ModelSerializer):
    """Compact user payload embedded in members and messages."""

    full_name = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "initials", "role"]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_initials(self, obj):
        return _initials(obj.get_full_name())


class ThreadReadSerializer(serializers.ModelSerializer):
    """
    A thread row as the frontend expects it.

    Computed fields:
        initials           -- derived per-thread (see module docstring)
        participant_count  -- number of memberships
        class_id           -- the class_course FK, or None for DMs
        last_message_at    -- most recent non-deleted message timestamp
    """

    initials = serializers.SerializerMethodField()
    participant_count = serializers.SerializerMethodField()
    class_id = serializers.UUIDField(source="class_course_id", read_only=True)
    last_message_at = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = [
            "id",
            "kind",
            "title",
            "initials",
            "participant_count",
            "class_id",
            "last_message_at",
            "created_at",
        ]
        read_only_fields = fields

    def _self_id(self):
        request = self.context.get("request")
        return getattr(getattr(request, "user", None), "id", None)

    def get_initials(self, obj):
        if obj.kind == Thread.KIND_GROUP:
            return _initials(obj.title or "Group")

        self_id = self._self_id()
        other_member = (
            obj.memberships.exclude(user_id=self_id)
            .select_related("user")
            .first()
        )
        if other_member is None:
            return "?"
        return _initials(other_member.user.get_full_name())

    def get_participant_count(self, obj):
        # Uses the reverse FK. The viewset can .annotate() this for
        # list endpoints to avoid N+1.
        return obj.memberships.count()

    def get_last_message_at(self, obj):
        last = (
            obj.messages.filter(deleted_at__isnull=True)
            .order_by("-created_at")
            .first()
        )
        return last.created_at.isoformat() if last else None


class ThreadMemberReadSerializer(serializers.ModelSerializer):
    """
    A member row inside a thread.

    Frontend reads:
        { id, full_name, initials, role, is_self, presence }
    """

    id = serializers.UUIDField(source="user.id", read_only=True)
    full_name = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()
    role = serializers.CharField(source="user.role", read_only=True)
    is_self = serializers.SerializerMethodField()
    presence = serializers.SerializerMethodField()

    class Meta:
        model = ThreadMember
        fields = ["id", "full_name", "initials", "role", "is_self", "presence"]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.user.get_full_name()

    def get_initials(self, obj):
        return _initials(obj.user.get_full_name())

    def get_is_self(self, obj):
        request = self.context.get("request")
        self_id = getattr(getattr(request, "user", None), "id", None)
        return obj.user_id == self_id

    def get_presence(self, obj):
        # V1 stub. Real presence is delivered by the accounts presence
        # WebSocket and is out of Chat V1 scope.
        return {"is_online": False}


class MessageReadSerializer(serializers.ModelSerializer):
    """
    A message row.

    Frontend reads:
        { id, sender_id, body, created_at, edited_at, deleted_at, is_deleted }
    """

    sender_id = serializers.UUIDField(read_only=True)
    is_deleted = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "sender_id",
            "body",
            "created_at",
            "edited_at",
            "deleted_at",
            "is_deleted",
        ]
        read_only_fields = fields

    def get_is_deleted(self, obj):
        return obj.deleted_at is not None


class MessageWriteSerializer(serializers.Serializer):
    """POST /chat/threads/{id}/messages/ payload."""

    body = serializers.CharField(
        allow_blank=False,
        trim_whitespace=True,
        max_length=4000,
    )


class ThreadCreateSerializer(serializers.Serializer):
    """
    POST /chat/threads/ payload.

    Two shapes:
        kind=dm    -> { kind, participant_id }
        kind=group -> { kind, class_id, title }
    """

    kind = serializers.ChoiceField(choices=[Thread.KIND_DM, Thread.KIND_GROUP])
    participant_id = serializers.UUIDField(required=False)
    class_id = serializers.UUIDField(required=False)
    title = serializers.CharField(required=False, allow_blank=True, max_length=200)

    def validate(self, attrs):
        kind = attrs["kind"]
        if kind == Thread.KIND_DM:
            if not attrs.get("participant_id"):
                raise serializers.ValidationError(
                    {"participant_id": "Required for direct messages."}
                )
        elif kind == Thread.KIND_GROUP:
            if not attrs.get("class_id"):
                raise serializers.ValidationError(
                    {"class_id": "Required for group threads."}
                )
        return attrs

# ============================================================================
# Reactions
# ============================================================================

class ReactionSummarySerializer(serializers.Serializer):
    """
    Aggregated reactions for one emoji on one message.

    {
        "emoji": "👍",
        "count": 3,
        "users": [ {id, full_name, initials}, ... ],
        "reacted_by_me": true
    }
    """

    emoji = serializers.CharField()
    count = serializers.IntegerField()
    users = ChatUserBriefSerializer(many=True)
    reacted_by_me = serializers.BooleanField()


def build_reaction_summaries(message, current_user_id):
    """
    Compute reaction summaries for a single Message.

    Groups reactions by emoji, counts them, includes the list of users,
    and flags whether `current_user_id` has reacted with that emoji.

    Returns a list sorted by emoji (stable ordering for the UI).
    """
    buckets = {}
    for reaction in message.reactions.select_related("user").all():
        bucket = buckets.setdefault(
            reaction.emoji,
            {"emoji": reaction.emoji, "count": 0, "users": [], "reacted_by_me": False},
        )
        bucket["count"] += 1
        bucket["users"].append(reaction.user)
        if current_user_id and reaction.user_id == current_user_id:
            bucket["reacted_by_me"] = True

    summaries = []
    for emoji in sorted(buckets.keys()):
        b = buckets[emoji]
        summaries.append(
            {
                "emoji": b["emoji"],
                "count": b["count"],
                "users": ChatUserBriefSerializer(b["users"], many=True).data,
                "reacted_by_me": b["reacted_by_me"],
            }
        )
    return summaries


class ChatMessageReadSerializer(serializers.ModelSerializer):
    """
    Message serializer for chat UIs.

    Extends MessageReadSerializer with:
      - sender     (full user brief: id, email, full_name, initials, role)
      - reactions  (aggregated per-emoji summaries)

    Requires `context["request"]` so `reacted_by_me` can be computed.
    """

    sender = ChatUserBriefSerializer(read_only=True)
    is_deleted = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "body",
            "created_at",
            "edited_at",
            "deleted_at",
            "is_deleted",
            "reactions",
        ]
        read_only_fields = fields

    def get_is_deleted(self, obj):
        return obj.deleted_at is not None

    def get_reactions(self, obj):
        request = self.context.get("request")
        user_id = getattr(getattr(request, "user", None), "id", None)
        return build_reaction_summaries(obj, user_id)


class ReactionToggleSerializer(serializers.Serializer):
    """POST body for /chat/messages/<id>/react/"""

    emoji = serializers.CharField(max_length=16, allow_blank=False, trim_whitespace=True)


# ============================================================================
# Teacher group (institution-level broadcast thread)
# ============================================================================

class TeacherGroupThreadSerializer(serializers.ModelSerializer):
    """
    Shape of the "Eduvi Platform Teachers Group" thread returned to
    both the admin and teacher UIs.

    {
        id, kind, title, participant_count, last_message_at, created_at,
        can_post (bool — true only for admins)
    }
    """

    participant_count = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()
    can_post = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = [
            "id",
            "kind",
            "title",
            "participant_count",
            "last_message_at",
            "created_at",
            "can_post",
        ]
        read_only_fields = fields

    def get_participant_count(self, obj):
        return obj.memberships.count()

    def get_last_message_at(self, obj):
        last = (
            obj.messages.filter(deleted_at__isnull=True)
            .order_by("-created_at")
            .first()
        )
        return last.created_at.isoformat() if last else None

    def get_can_post(self, obj):
        """
        Institution-level group threads (kind='group' and class_course is
        NULL) are admin-only broadcast channels. Class-scoped group threads
        allow all members to post.
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if obj.kind == Thread.KIND_GROUP and obj.class_course_id is None:
            return user.role == "admin"
        return obj.memberships.filter(user=user).exists()
