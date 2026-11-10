# backend/chat/group_views.py
"""
Admin-managed chat groups.

Endpoints (mounted at /api/v1/chat/):

  GET   groups/                  -> groups the caller can see
                                    admins: all institution groups
                                    teachers: groups they belong to
  POST  groups/                  -> admin creates a group with teachers and/or students
  GET   groups/<uuid>/messages/  -> messages (members and admins)
  POST  groups/<uuid>/messages/  -> post a message
                                    institution group: admins only
                                    custom group: any member, or an admin

Members are managed with the existing endpoints:
  GET    threads/<uuid>/members/          (list)
  DELETE threads/<uuid>/members/<uuid>/   (remove)
  DELETE threads/<uuid>/                  (delete a custom group, admin only)
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from .models import Message, Thread, ThreadMember
from .serializers import (
    ChatUserBriefSerializer,
    MessageWriteSerializer,
    build_reaction_summaries,
)
from .views import _ensure_member, _get_or_create_teacher_group, _post_system_message

MAX_PAGE = 200
MANAGEABLE_ROLES = (User.ROLE_TEACHER, User.ROLE_STUDENT)


# ─────────────────────────────────────────────────────────
# Access helpers
# ─────────────────────────────────────────────────────────

def _load_group(user, thread_id):
    """Return (thread, None), or (None, error_response) when access is refused."""
    thread = Thread.objects.filter(
        pk=thread_id,
        kind=Thread.KIND_GROUP,
        class_course__isnull=True,
    ).first()
    if thread is None:
        return None, Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

    if not user.is_superuser and thread.institution_id != user.institution_id:
        return None, Response({"detail": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

    if user.role != "admin" and not ThreadMember.objects.filter(thread=thread, user=user).exists():
        return None, Response(
            {"detail": "You are not a member of this group."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return thread, None


def _can_post(user, thread):
    if user.role == "admin" or user.is_superuser:
        return True
    if thread.is_institution_group:
        return False
    return ThreadMember.objects.filter(thread=thread, user=user).exists()


def _broadcast(thread_id, message, request):
    try:
        layer = get_channel_layer()
        if layer is None:
            return
        payload = GroupMessageSerializer(message, context={"request": request}).data
        async_to_sync(layer.group_send)(
            f"chat_thread_{thread_id}",
            {"type": "chat.message", "message": payload},
        )
    except Exception:
        pass


# ─────────────────────────────────────────────────────────
# Serializers
# ─────────────────────────────────────────────────────────

class ChatGroupCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )


class ChatGroupSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    can_post = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = [
            "id",
            "title",
            "is_institution_group",
            "member_count",
            "can_post",
            "last_message_at",
            "created_at",
        ]
        read_only_fields = fields

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_can_post(self, obj):
        return _can_post(self.context["request"].user, obj)

    def get_last_message_at(self, obj):
        last = obj.messages.filter(deleted_at__isnull=True).order_by("-created_at").first()
        return last.created_at.isoformat() if last else None


class GroupMessageSerializer(serializers.ModelSerializer):
    sender = ChatUserBriefSerializer(read_only=True)
    reactions = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "kind",
            "body",
            "created_at",
            "edited_at",
            "deleted_at",
            "reactions",
        ]
        read_only_fields = fields

    def get_reactions(self, obj):
        request = self.context.get("request")
        return build_reaction_summaries(obj, getattr(request.user, "id", None))


# ─────────────────────────────────────────────────────────
# Views
# ─────────────────────────────────────────────────────────

class ChatGroupListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in {"admin", "teacher"} or not user.institution_id:
            return Response(
                {"detail": "Only staff can view groups."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Make sure the institution group exists before listing.
        teachers_group, _ = _get_or_create_teacher_group(
            user.institution,
            created_by=user if user.role == "admin" else None,
        )
        _ensure_member(teachers_group, user)

        qs = Thread.objects.filter(
            institution=user.institution,
            kind=Thread.KIND_GROUP,
            class_course__isnull=True,
        )
        if user.role != "admin":
            qs = qs.filter(memberships__user=user)

        qs = qs.order_by("-is_institution_group", "-created_at").distinct()
        data = ChatGroupSerializer(qs, many=True, context={"request": request}).data
        return Response({"count": len(data), "results": data})

    def post(self, request):
        user = request.user
        if user.role != "admin" or not user.institution_id:
            return Response(
                {"detail": "Only admins can create groups."},
                status=status.HTTP_403_FORBIDDEN,
            )

        ser = ChatGroupCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        title = ser.validated_data["title"].strip()
        if not title:
            return Response({"title": ["Give the group a name."]}, status=status.HTTP_400_BAD_REQUEST)

        wanted = set(ser.validated_data["member_ids"])
        wanted.discard(user.id)  # the creator is always added

        members = list(
            User.objects.filter(
                pk__in=wanted,
                institution=user.institution,
                role__in=MANAGEABLE_ROLES,
            )
        )
        if len(members) != len(wanted):
            return Response(
                {"member_ids": ["Some people are not teachers or students in your institution."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not members:
            return Response(
                {"member_ids": ["Pick at least one teacher or student."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            thread = Thread.objects.create(
                institution=user.institution,
                kind=Thread.KIND_GROUP,
                class_course=None,
                title=title,
                created_by=user,
                is_institution_group=False,
            )
            ThreadMember.objects.bulk_create(
                [ThreadMember(thread=thread, user=user)]
                + [ThreadMember(thread=thread, user=m) for m in members],
                ignore_conflicts=True,
            )

        actor_name = user.get_full_name() or user.email
        _post_system_message(thread, f"{actor_name} created the group.")

        return Response(
            ChatGroupSerializer(thread, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ChatGroupMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, thread_id):
        thread, err = _load_group(request.user, thread_id)
        if err:
            return err

        base = Message.objects.filter(thread=thread, deleted_at__isnull=True)
        after = request.query_params.get("after")
        if after:
            qs = base.filter(created_at__gt=after).select_related("sender").order_by("created_at")
        else:
            ids = list(base.order_by("-created_at").values_list("id", flat=True)[:MAX_PAGE])
            qs = (
                Message.objects.filter(id__in=ids)
                .select_related("sender")
                .order_by("created_at")
            )

        data = GroupMessageSerializer(qs, many=True, context={"request": request}).data
        return Response({"count": len(data), "results": data})

    def post(self, request, thread_id):
        thread, err = _load_group(request.user, thread_id)
        if err:
            return err

        if not _can_post(request.user, thread):
            detail = (
                "Only admins can post in the teachers group."
                if thread.is_institution_group
                else "You can't post in this group."
            )
            return Response({"detail": detail}, status=status.HTTP_403_FORBIDDEN)

        write = MessageWriteSerializer(data=request.data)
        write.is_valid(raise_exception=True)

        message = Message.objects.create(
            thread=thread,
            sender=request.user,
            body=write.validated_data["body"],
        )
        _broadcast(thread.id, message, request)

        return Response(
            GroupMessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )