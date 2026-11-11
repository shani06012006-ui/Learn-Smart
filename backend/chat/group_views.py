# backend/chat/group_views.py
"""
Group chats (institution-wide and custom).

Endpoints (mounted at /api/v1/chat/):

  GET     groups/                          list groups the caller can see
  POST    groups/                          create a group (admins and teachers)
  GET     groups/<uuid>/                   read a group with its members
  PATCH   groups/<uuid>/                   rename (manager only)
  DELETE  groups/<uuid>/                   delete (manager only)
  POST    groups/<uuid>/members/           add people (manager only)
  DELETE  groups/<uuid>/members/<uuid>/    remove a person (manager only)
  POST    groups/<uuid>/leave/             leave (custom groups, not the creator)
  GET     groups/<uuid>/messages/          read messages (members and admins)
  POST    groups/<uuid>/messages/          post (institution group: admins only)

Managers of a custom group: admins, and the teacher who created it.
The institution Teachers Group can't be renamed, deleted, left, or changed.

Who can be added:
  admins:   any teacher or student in the institution
  teachers: teachers in the institution, and students in active classes they teach
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from classes.models import StudentEnrollment
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
# Helpers
# ─────────────────────────────────────────────────────────

def _name(user):
    return user.get_full_name() or user.email


def _load_group(user, thread_id):
    """Return (thread, None), or (None, error_response)."""
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


def _is_manager(user, thread):
    """Admins and the creator can change a custom group. The Teachers Group is never managed here."""
    if thread.is_institution_group:
        return False
    if user.role == "admin" or user.is_superuser:
        return True
    return thread.created_by_id == user.id


def _can_post(user, thread):
    if user.role == "admin" or user.is_superuser:
        return True
    if thread.is_institution_group:
        return False
    return ThreadMember.objects.filter(thread=thread, user=user).exists()


def _can_add(actor, target):
    if target.institution_id != actor.institution_id or target.role not in MANAGEABLE_ROLES:
        return False
    if actor.role == "admin" or actor.is_superuser:
        return True
    if actor.role != "teacher":
        return False
    if target.role == User.ROLE_TEACHER:
        return True
    return StudentEnrollment.objects.filter(
        student=target,
        status=StudentEnrollment.STATUS_ACTIVE,
        class_course__teacher=actor,
    ).exists()


def _resolve_people(actor, raw_ids):
    """Return (users, None) or (None, error message). The actor is never returned."""
    ids = {str(i) for i in raw_ids}
    ids.discard(str(actor.id))
    if not ids:
        return [], None

    users = list(User.objects.filter(pk__in=ids))
    if len(users) != len(ids):
        return None, "Some people could not be found."
    for u in users:
        if not _can_add(actor, u):
            return None, (
                "Some people can't be added. Admins can add any teacher or student. "
                "Teachers can add colleagues and students in their classes."
            )
    return users, None


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

class GroupCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    member_ids = serializers.ListField(child=serializers.UUIDField(), required=False, default=list)


class GroupRenameSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)


class GroupMembersInputSerializer(serializers.Serializer):
    user_ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)


class ChatGroupSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    can_post = serializers.SerializerMethodField()
    can_manage = serializers.SerializerMethodField()
    can_leave = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = [
            "id",
            "title",
            "is_institution_group",
            "created_by_id",
            "member_count",
            "can_post",
            "can_manage",
            "can_leave",
            "last_message_at",
            "created_at",
        ]
        read_only_fields = fields

    def _user(self):
        return self.context["request"].user

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_can_post(self, obj):
        return _can_post(self._user(), obj)

    def get_can_manage(self, obj):
        return _is_manager(self._user(), obj)

    def get_can_leave(self, obj):
        user = self._user()
        return (
            not obj.is_institution_group
            and not obj.class_course_id
            and obj.created_by_id != user.id
            and ThreadMember.objects.filter(thread=obj, user=user).exists()
        )

    def get_last_message_at(self, obj):
        last = obj.messages.filter(deleted_at__isnull=True).order_by("-created_at").first()
        return last.created_at.isoformat() if last else None


class ChatGroupDetailSerializer(ChatGroupSerializer):
    members = serializers.SerializerMethodField()

    class Meta(ChatGroupSerializer.Meta):
        fields = ChatGroupSerializer.Meta.fields + ["members"]
        read_only_fields = fields

    def get_members(self, obj):
        users = [
            m.user
            for m in obj.memberships.select_related("user").order_by("user__role", "user__first_name")
        ]
        return ChatUserBriefSerializer(users, many=True).data


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
# Group list + create
# ─────────────────────────────────────────────────────────

class ChatGroupListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in {"admin", "teacher"} or not user.institution_id:
            return Response({"detail": "Only staff can view groups."}, status=status.HTTP_403_FORBIDDEN)

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
        if user.role not in {"admin", "teacher"} or not user.institution_id:
            return Response(
                {"detail": "Only admins and teachers can create groups."},
                status=status.HTTP_403_FORBIDDEN,
            )

        ser = GroupCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        title = ser.validated_data["title"].strip()
        if not title:
            return Response({"title": ["Give the group a name."]}, status=status.HTTP_400_BAD_REQUEST)

        people, error = _resolve_people(user, ser.validated_data["member_ids"])
        if error:
            return Response({"member_ids": [error]}, status=status.HTTP_400_BAD_REQUEST)
        if not people:
            return Response({"member_ids": ["Pick at least one person."]}, status=status.HTTP_400_BAD_REQUEST)

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
                + [ThreadMember(thread=thread, user=p) for p in people],
                ignore_conflicts=True,
            )

        _post_system_message(thread, f"{_name(user)} created the group.")
        return Response(
            ChatGroupDetailSerializer(thread, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────
# Group read, rename, delete
# ─────────────────────────────────────────────────────────

class ChatGroupDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, thread_id):
        thread, err = _load_group(request.user, thread_id)
        if err:
            return err
        return Response(ChatGroupDetailSerializer(thread, context={"request": request}).data)

    def patch(self, request, thread_id):
        thread, err = _load_group(request.user, thread_id)
        if err:
            return err
        if thread.is_institution_group:
            return Response({"detail": "The Teachers Group can't be renamed."}, status=status.HTTP_403_FORBIDDEN)
        if not _is_manager(request.user, thread):
            return Response({"detail": "Only the creator or an admin can rename this group."}, status=status.HTTP_403_FORBIDDEN)

        ser = GroupRenameSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        new_title = ser.validated_data["title"].strip()
        if not new_title:
            return Response({"title": ["Give the group a name."]}, status=status.HTTP_400_BAD_REQUEST)

        old_title = thread.title
        if new_title != old_title:
            thread.title = new_title
            thread.save(update_fields=["title", "updated_at"])
            _post_system_message(thread, f"{_name(request.user)} renamed the group to {new_title}.")

        return Response(ChatGroupDetailSerializer(thread, context={"request": request}).data)

    def delete(self, request, thread_id):
        thread, err = _load_group(request.user, thread_id)
        if err:
            return err
        if thread.is_institution_group:
            return Response({"detail": "The Teachers Group can't be deleted."}, status=status.HTTP_403_FORBIDDEN)
        if not _is_manager(request.user, thread):
            return Response({"detail": "Only the creator or an admin can delete this group."}, status=status.HTTP_403_FORBIDDEN)

        thread.delete()  # cascades to messages and memberships
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────
# Members
# ─────────────────────────────────────────────────────────

class ChatGroupMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, thread_id):
        thread, err = _load_group(request.user, thread_id)
        if err:
            return err
        if not _is_manager(request.user, thread):
            return Response({"detail": "Only the creator or an admin can add people."}, status=status.HTTP_403_FORBIDDEN)

        ser = GroupMembersInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        people, error = _resolve_people(request.user, ser.validated_data["user_ids"])
        if error:
            return Response({"user_ids": [error]}, status=status.HTTP_400_BAD_REQUEST)

        added = []
        for person in people:
            _, created = ThreadMember.objects.get_or_create(thread=thread, user=person)
            if created:
                added.append(_name(person))
        if added:
            _post_system_message(thread, f"{_name(request.user)} added {', '.join(added)}.")

        return Response(ChatGroupDetailSerializer(thread, context={"request": request}).data)


class ChatGroupMemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, thread_id, user_id):
        thread, err = _load_group(request.user, thread_id)
        if err:
            return err
        if not _is_manager(request.user, thread):
            return Response({"detail": "Only the creator or an admin can remove people."}, status=status.HTTP_403_FORBIDDEN)
        if thread.created_by_id == user_id:
            return Response({"detail": "The creator can't be removed."}, status=status.HTTP_400_BAD_REQUEST)

        target = User.objects.filter(pk=user_id).first()
        deleted, _ = ThreadMember.objects.filter(thread=thread, user_id=user_id).delete()
        if deleted and target is not None:
            _post_system_message(thread, f"{_name(request.user)} removed {_name(target)}.")
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatGroupLeaveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, thread_id):
        thread, err = _load_group(request.user, thread_id)
        if err:
            return err
        if thread.is_institution_group or thread.class_course_id:
            return Response({"detail": "You can't leave this group."}, status=status.HTTP_403_FORBIDDEN)
        if thread.created_by_id == request.user.id:
            return Response(
                {"detail": "The creator can't leave. Delete the group instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ThreadMember.objects.filter(thread=thread, user=request.user).delete()
        _post_system_message(thread, f"{_name(request.user)} left the group.")
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────
# Messages
# ─────────────────────────────────────────────────────────

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
            qs = Message.objects.filter(id__in=ids).select_related("sender").order_by("created_at")

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