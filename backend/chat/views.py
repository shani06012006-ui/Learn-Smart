"""
Chat REST views.

Endpoints (mounted at /api/v1/chat/):

  GET     teacher-group/                    -> fetch/create institution group thread
  GET     teacher-group/messages/           -> list messages (incremental via ?after=)
  POST    teacher-group/messages/           -> send message (admin only)
  GET     teacher-group/members/            -> list members (admin + teacher)
  POST    messages/<uuid:msg_id>/react/     -> toggle reaction
  DELETE  messages/<uuid:msg_id>/react/     -> remove my reaction

Rules:
  - Institution-level group threads (kind='group' AND class_course IS NULL)
    are admin-only broadcast channels. Only admins may POST messages.
  - All users in the institution may GET messages and react.
  - All queries are institution-scoped: request.user.institution.
"""
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Message, MessageReaction, Thread, ThreadMember
from .serializers import (
    ChatMessageReadSerializer,
    MessageWriteSerializer,
    ReactionToggleSerializer,
    TeacherGroupThreadSerializer,
    ThreadMemberReadSerializer,
)

# ─────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────

# NOTE: This set uses real Unicode codepoints.
#   U+1F44D  👍  thumbs up
#   U+2764 U+FE0F  ❤️  red heart with VS16
#   U+2705   ✅  check mark
#   U+1F389  🎉  party popper
#   U+1F440  👀  eyes
ALLOWED_REACTIONS = {
    "\U0001F44D",          # thumbs up
    "\u2764\uFE0F",        # red heart + variation selector
    "\u2705",              # check mark
    "\U0001F389",          # party popper
    "\U0001F440",          # eyes
}



def _require_institution(user):
    """Every chat endpoint requires the caller to belong to an institution."""
    return user.institution_id is not None


def _get_or_create_teacher_group(institution, created_by=None):
    """
    Return the institution's "teachers group" thread, creating it if needed.

    Identifier: kind='group' AND class_course IS NULL AND institution=institution.
    Title:      "<Institution name> — Teachers Group"
                fallback "Eduvi Platform Teachers Group"
    """
    thread = (
        Thread.objects
        .filter(
            institution=institution,
            kind=Thread.KIND_GROUP,
            class_course__isnull=True,
        )
        .first()
    )
    if thread:
        return thread, False

    title = (
        f"{institution.name} \u2014 Teachers Group"
        if institution and institution.name
        else "Eduvi Platform Teachers Group"
    )
    with transaction.atomic():
        thread = Thread.objects.create(
            institution=institution,
            kind=Thread.KIND_GROUP,
            class_course=None,
            title=title,
            created_by=created_by,
        )
        member_ids = (
            institution.users
            .filter(role__in=["admin", "teacher"])
            .values_list("id", flat=True)
        )
        ThreadMember.objects.bulk_create(
            [ThreadMember(thread=thread, user_id=uid) for uid in member_ids],
            ignore_conflicts=True,
        )
    return thread, True


def _ensure_member(thread, user):
    """Make sure a user has a ThreadMember row. Cheap idempotent get_or_create."""
    ThreadMember.objects.get_or_create(thread=thread, user=user)


# ─────────────────────────────────────────────────────────
# Teacher group thread
# ─────────────────────────────────────────────────────────

class TeacherGroupThreadView(APIView):
    """
    GET /api/v1/chat/teacher-group/

    Returns the institution's teacher-group thread. Auto-creates it on first
    access by any admin or teacher of that institution.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _require_institution(request.user):
            return Response(
                {"detail": "You are not associated with an institution."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if request.user.role not in {"admin", "teacher"}:
            return Response(
                {"detail": "Only admins and teachers can access this group."},
                status=status.HTTP_403_FORBIDDEN,
            )

        thread, _ = _get_or_create_teacher_group(
            request.user.institution,
            created_by=request.user if request.user.role == "admin" else None,
        )
        _ensure_member(thread, request.user)

        serializer = TeacherGroupThreadSerializer(thread, context={"request": request})
        return Response(serializer.data)


# ─────────────────────────────────────────────────────────
# Messages
# ─────────────────────────────────────────────────────────

class TeacherGroupMessagesView(APIView):
    """
    GET  /api/v1/chat/teacher-group/messages/?after=<iso>
    POST /api/v1/chat/teacher-group/messages/   (admin only)
    """
    permission_classes = [IsAuthenticated]

    MAX_PAGE = 200

    def _thread(self, user):
        if not _require_institution(user):
            return None
        if user.role not in {"admin", "teacher"}:
            return None
        thread, _ = _get_or_create_teacher_group(
            user.institution,
            created_by=user if user.role == "admin" else None,
        )
        _ensure_member(thread, user)
        return thread

    def get(self, request):
        thread = self._thread(request.user)
        if thread is None:
            return Response(
                {"detail": "Not permitted for this account."},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = (
            Message.objects
            .filter(thread=thread, deleted_at__isnull=True)
            .select_related("sender")
            .order_by("created_at")
        )

        after = request.query_params.get("after")
        if after:
            qs = qs.filter(created_at__gt=after)
        else:
            ids = list(
                qs.order_by("-created_at")
                .values_list("id", flat=True)[: self.MAX_PAGE]
            )
            qs = (
                Message.objects
                .filter(id__in=ids)
                .select_related("sender")
                .order_by("created_at")
            )

        serializer = ChatMessageReadSerializer(qs, many=True, context={"request": request})
        return Response({"results": serializer.data})

    def post(self, request):
        if not (request.user.is_authenticated and request.user.role == "admin"):
            return Response(
                {"detail": "Only admins can post in this group."},
                status=status.HTTP_403_FORBIDDEN,
            )

        thread = self._thread(request.user)
        if thread is None:
            return Response(
                {"detail": "Not permitted for this account."},
                status=status.HTTP_403_FORBIDDEN,
            )

        write = MessageWriteSerializer(data=request.data)
        write.is_valid(raise_exception=True)

        message = Message.objects.create(
            thread=thread,
            sender=request.user,
            body=write.validated_data["body"],
        )

        self._broadcast(message, request)

        return Response(
            ChatMessageReadSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _broadcast(message, request):
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            layer = get_channel_layer()
            if layer is not None:
                payload = ChatMessageReadSerializer(
                    message, context={"request": request}
                ).data
                async_to_sync(layer.group_send)(
                    f"chat_thread_{message.thread_id}",
                    {"type": "chat.message", "message": payload},
                )
        except Exception:
            pass


# ─────────────────────────────────────────────────────────
# Members
# ─────────────────────────────────────────────────────────

class TeacherGroupMembersView(APIView):
    """
    GET /api/v1/chat/teacher-group/members/

    Returns the list of people in the institution's teacher group,
    sorted: admins first (alphabetically by first name), then teachers
    (alphabetically by first name).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _require_institution(request.user):
            return Response(
                {"detail": "You are not associated with an institution."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if request.user.role not in {"admin", "teacher"}:
            return Response(
                {"detail": "Only admins and teachers can access this group."},
                status=status.HTTP_403_FORBIDDEN,
            )

        thread, _ = _get_or_create_teacher_group(
            request.user.institution,
            created_by=request.user if request.user.role == "admin" else None,
        )
        _ensure_member(thread, request.user)

        memberships = (
            thread.memberships
            .select_related("user")
            .order_by("-user__role", "user__first_name", "user__last_name")
        )

        serializer = ThreadMemberReadSerializer(
            memberships, many=True, context={"request": request}
        )
        return Response({
            "count": memberships.count(),
            "results": serializer.data,
        })


# ─────────────────────────────────────────────────────────
# Reactions
# ─────────────────────────────────────────────────────────

class MessageReactionView(APIView):
    """
    POST   /api/v1/chat/messages/<uuid:msg_id>/react/   body: {"emoji": "<one emoji>"}
    DELETE /api/v1/chat/messages/<uuid:msg_id>/react/   (removes my reaction)

    POST is a toggle: tapping the same emoji you already reacted with
    removes your reaction; tapping a different one replaces it.
    """
    permission_classes = [IsAuthenticated]

    def _get_message(self, request, msg_id):
        qs = Message.objects.select_related("thread", "sender")
        if not request.user.is_superuser:
            qs = qs.filter(thread__institution_id=request.user.institution_id)
        return get_object_or_404(qs, pk=msg_id)

    def post(self, request, msg_id):
        message = self._get_message(request, msg_id)

        ser = ReactionToggleSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        emoji = ser.validated_data["emoji"]

        if emoji not in ALLOWED_REACTIONS:
            return Response(
                {
                    "detail": "Unsupported emoji.",
                    "allowed": sorted(ALLOWED_REACTIONS),
                    "received_codepoints": [hex(ord(c)) for c in emoji],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = MessageReaction.objects.filter(message=message, user=request.user).first()
        if existing and existing.emoji == emoji:
            existing.delete()
            action = "removed"
        elif existing:
            existing.emoji = emoji
            existing.save(update_fields=["emoji", "updated_at"])
            action = "replaced"
        else:
            MessageReaction.objects.create(message=message, user=request.user, emoji=emoji)
            action = "added"

        self._broadcast(message, request)

        return Response(
            {
                "action": action,
                "message": ChatMessageReadSerializer(message, context={"request": request}).data,
            }
        )

    def delete(self, request, msg_id):
        message = self._get_message(request, msg_id)
        MessageReaction.objects.filter(message=message, user=request.user).delete()
        self._broadcast(message, request)
        return Response(
            ChatMessageReadSerializer(message, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def _broadcast(message, request):
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            layer = get_channel_layer()
            if layer is not None:
                payload = ChatMessageReadSerializer(
                    message, context={"request": request}
                ).data
                async_to_sync(layer.group_send)(
                    f"chat_thread_{message.thread_id}",
                    {"type": "chat.message", "message": payload},
                )
        except Exception:
            pass
