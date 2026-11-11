# backend/chat/crud_views.py
"""
Teacher chat CRUD.

Rooms (direct messages and groups) the teacher belongs to:

  GET     rooms/                       list my rooms
  POST    rooms/                       create a DM (kind=dm) or a group (kind=group)
  PATCH   rooms/<id>/                  rename a custom group I created
  DELETE  rooms/<id>/                  delete a custom group I created
  POST    rooms/<id>/leave/            leave a DM or custom group
  POST    rooms/<id>/members/          add people to a custom group I created
  DELETE  rooms/<id>/members/<uid>/    remove a person from a custom group I created
  GET     rooms/<id>/messages/         read messages
  POST    rooms/<id>/messages/         send a message

Messages:
  PATCH   messages/<id>/               edit my own message
  DELETE  messages/<id>/               delete my own message (admins may delete any)

Who a teacher can chat with: other teachers in the same institution, and
students enrolled in an active class the teacher teaches.

The Teachers Group and class chats can't be renamed, left, or deleted by teachers.
"""
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from classes.models import StudentEnrollment
from .group_views import GroupMessageSerializer, _broadcast, _can_post
from .models import Message, Thread, ThreadMember
from .serializers import MessageWriteSerializer
from .views import _post_system_message


# ─────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────

def _err(detail, code=status.HTTP_400_BAD_REQUEST):
    return Response({"detail": detail}, status=code)


def _teacher_only(user):
    if getattr(user, "role", None) != User.ROLE_TEACHER:
        return _err("Only teachers can use this.", status.HTTP_403_FORBIDDEN)
    return None


def _user_by_id(value):
    try:
        return User.objects.filter(pk=value).first()
    except (ValueError, DjangoValidationError):
        return None


def _load_room(user, room_id):
    room = Thread.objects.filter(pk=room_id).select_related("class_course").first()
    if room is None or (not user.is_superuser and room.institution_id != user.institution_id):
        return None, _err("Chat not found.", status.HTTP_404_NOT_FOUND)
    if not ThreadMember.objects.filter(thread=room, user=user).exists():
        return None, _err("You are not in this chat.", status.HTTP_403_FORBIDDEN)
    return room, None


def _can_manage(user, room):
    """Only custom groups the teacher created can be renamed, deleted, or changed."""
    if room.kind != Thread.KIND_GROUP or room.class_course_id or room.is_institution_group:
        return False
    return room.created_by_id == user.id


def _can_leave(room):
    return not room.is_institution_group and not room.class_course_id


def _can_chat_with(teacher, target):
    if target.institution_id != teacher.institution_id:
        return False
    if target.role == User.ROLE_TEACHER:
        return True
    if target.role == User.ROLE_STUDENT:
        return StudentEnrollment.objects.filter(
            student=target,
            status=StudentEnrollment.STATUS_ACTIVE,
            class_course__teacher=teacher,
        ).exists()
    return False


def _title_for(room, user):
    if room.kind == Thread.KIND_DM:
        other = room.memberships.exclude(user=user).select_related("user").first()
        if other is None:
            return "Direct message"
        return other.user.get_full_name() or other.user.email
    if room.class_course_id:
        return room.class_course.name
    return room.title or "Group"


def _room_payload(room, user):
    last = (
        room.messages.filter(deleted_at__isnull=True)
        .select_related("sender")
        .order_by("-created_at")
        .first()
    )
    last_payload = None
    if last is not None:
        sender = last.sender
        last_payload = {
            "body": last.body,
            "sender_name": (sender.get_full_name() or sender.email) if sender else "",
            "created_at": last.created_at.isoformat(),
        }
    return {
        "id": str(room.id),
        "kind": room.kind,
        "title": _title_for(room, user),
        "is_institution_group": room.is_institution_group,
        "class_id": str(room.class_course_id) if room.class_course_id else None,
        "created_by_id": str(room.created_by_id) if room.created_by_id else None,
        "member_count": room.memberships.count(),
        "can_post": _can_post(user, room),
        "can_manage": _can_manage(user, room),
        "can_leave": _can_leave(room),
        "last_message": last_payload,
    }


def _system(room, text):
    _post_system_message(room, text)


# ─────────────────────────────────────────────────────────
# Rooms: list + create
# ─────────────────────────────────────────────────────────

class RoomListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = _teacher_only(request.user)
        if denied is not None:
            return denied
        rooms = (
            Thread.objects.filter(memberships__user=request.user)
            .select_related("class_course")
            .order_by("-updated_at", "-created_at")
            .distinct()
        )
        data = [_room_payload(r, request.user) for r in rooms]
        return Response({"count": len(data), "results": data})

    def post(self, request):
        denied = _teacher_only(request.user)
        if denied is not None:
            return denied
        kind = request.data.get("kind")
        if kind == "dm":
            return self._create_dm(request)
        if kind == "group":
            return self._create_group(request)
        return _err("kind must be 'dm' or 'group'.")

    def _create_dm(self, request):
        user = request.user
        target = _user_by_id(request.data.get("participant_id"))
        if target is None or not _can_chat_with(user, target):
            return _err("You can only message teachers in your school or students in your classes.")

        existing = (
            Thread.objects.filter(kind=Thread.KIND_DM, institution=user.institution)
            .filter(memberships__user=user)
            .filter(memberships__user=target)
            .first()
        )
        if existing:
            return Response(_room_payload(existing, user))

        with transaction.atomic():
            room = Thread.objects.create(
                institution=user.institution,
                kind=Thread.KIND_DM,
                title="",
                created_by=user,
            )
            ThreadMember.objects.bulk_create([
                ThreadMember(thread=room, user=user),
                ThreadMember(thread=room, user=target),
            ])
        return Response(_room_payload(room, user), status=status.HTTP_201_CREATED)

    def _create_group(self, request):
        user = request.user
        title = str(request.data.get("title") or "").strip()[:200]
        if not title:
            return _err("Give the group a name.")

        ids = {str(i) for i in (request.data.get("member_ids") or [])}
        ids.discard(str(user.id))
        if not ids:
            return _err("Pick at least one person.")

        members = []
        for uid in ids:
            target = _user_by_id(uid)
            if target is None or not _can_chat_with(user, target):
                return _err(
                    "Some people can't be added. Choose teachers in your school or students in your classes."
                )
            members.append(target)

        with transaction.atomic():
            room = Thread.objects.create(
                institution=user.institution,
                kind=Thread.KIND_GROUP,
                class_course=None,
                title=title,
                created_by=user,
                is_institution_group=False,
            )
            ThreadMember.objects.bulk_create(
                [ThreadMember(thread=room, user=user)]
                + [ThreadMember(thread=room, user=m) for m in members],
                ignore_conflicts=True,
            )

        _system(room, f"{user.get_full_name() or user.email} created the group.")
        return Response(_room_payload(room, user), status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────
# Rooms: rename, delete, leave
# ─────────────────────────────────────────────────────────

class RoomDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, room_id):
        denied = _teacher_only(request.user)
        if denied is not None:
            return denied
        room, err = _load_room(request.user, room_id)
        if err is not None:
            return err
        if not _can_manage(request.user, room):
            return _err("Only the creator can rename this group.", status.HTTP_403_FORBIDDEN)

        title = str(request.data.get("title") or "").strip()[:200]
        if not title:
            return _err("Give the group a name.")

        room.title = title
        room.save(update_fields=["title", "updated_at"])
        return Response(_room_payload(room, request.user))

    def delete(self, request, room_id):
        denied = _teacher_only(request.user)
        if denied is not None:
            return denied
        room, err = _load_room(request.user, room_id)
        if err is not None:
            return err
        if not _can_manage(request.user, room):
            return _err("Only the creator can delete this group.", status.HTTP_403_FORBIDDEN)

        room.delete()  # cascades to messages and memberships
        return Response(status=status.HTTP_204_NO_CONTENT)


class RoomLeaveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        denied = _teacher_only(request.user)
        if denied is not None:
            return denied
        room, err = _load_room(request.user, room_id)
        if err is not None:
            return err
        if not _can_leave(room):
            return _err("You can't leave this chat.", status.HTTP_403_FORBIDDEN)

        ThreadMember.objects.filter(thread=room, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────
# Group members
# ─────────────────────────────────────────────────────────

class RoomMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        user = request.user
        denied = _teacher_only(user)
        if denied is not None:
            return denied
        room, err = _load_room(user, room_id)
        if err is not None:
            return err
        if not _can_manage(user, room):
            return _err("Only the creator can add people to this group.", status.HTTP_403_FORBIDDEN)

        added = []
        for uid in request.data.get("user_ids") or []:
            target = _user_by_id(uid)
            if target is None or not _can_chat_with(user, target):
                return _err("You can only add teachers in your school or students in your classes.")
            _, created = ThreadMember.objects.get_or_create(thread=room, user=target)
            if created:
                added.append(target.get_full_name() or target.email)

        if added:
            _system(room, f"{user.get_full_name() or user.email} added {', '.join(added)}.")
        return Response(_room_payload(room, user))


class RoomMemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, room_id, user_id):
        user = request.user
        denied = _teacher_only(user)
        if denied is not None:
            return denied
        room, err = _load_room(user, room_id)
        if err is not None:
            return err
        if not _can_manage(user, room):
            return _err("Only the creator can remove people from this group.", status.HTTP_403_FORBIDDEN)
        if room.created_by_id == user_id:
            return _err("The creator can't be removed.")

        target = _user_by_id(user_id)
        deleted, _ = ThreadMember.objects.filter(thread=room, user_id=user_id).delete()
        if deleted and target is not None:
            _system(room, f"{user.get_full_name() or user.email} removed "
                          f"{target.get_full_name() or target.email}.")
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────
# Messages: read + send
# ─────────────────────────────────────────────────────────

class RoomMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        denied = _teacher_only(request.user)
        if denied is not None:
            return denied
        room, err = _load_room(request.user, room_id)
        if err is not None:
            return err

        base = Message.objects.filter(thread=room, deleted_at__isnull=True)
        after = request.query_params.get("after")
        if after:
            qs = base.filter(created_at__gt=after).select_related("sender").order_by("created_at")
        else:
            ids = list(base.order_by("-created_at").values_list("id", flat=True)[:200])
            qs = Message.objects.filter(id__in=ids).select_related("sender").order_by("created_at")

        data = GroupMessageSerializer(qs, many=True, context={"request": request}).data
        return Response({"count": len(data), "results": data})

    def post(self, request, room_id):
        denied = _teacher_only(request.user)
        if denied is not None:
            return denied
        room, err = _load_room(request.user, room_id)
        if err is not None:
            return err
        if not _can_post(request.user, room):
            return _err("You can't post in this chat.", status.HTTP_403_FORBIDDEN)

        write = MessageWriteSerializer(data=request.data)
        write.is_valid(raise_exception=True)
        message = Message.objects.create(
            thread=room,
            sender=request.user,
            body=write.validated_data["body"],
        )
        _broadcast(room.id, message, request)
        return Response(
            GroupMessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────
# Messages: edit + delete
# ─────────────────────────────────────────────────────────

class MessageDetailView(APIView):
    """Replaces the admin-only MessageDeleteView at messages/<id>/."""
    permission_classes = [IsAuthenticated]

    def _load(self, request, msg_id):
        msg = Message.objects.select_related("thread", "sender").filter(pk=msg_id).first()
        if msg is None or msg.deleted_at is not None:
            return None, _err("Message not found.", status.HTTP_404_NOT_FOUND)
        user = request.user
        if not user.is_superuser and msg.thread.institution_id != user.institution_id:
            return None, _err("Message not found.", status.HTTP_404_NOT_FOUND)
        if user.role != "admin" and not ThreadMember.objects.filter(thread=msg.thread, user=user).exists():
            return None, _err("You are not in this chat.", status.HTTP_403_FORBIDDEN)
        return msg, None

    def patch(self, request, msg_id):
        if request.user.role not in {"teacher", "admin"}:
            return _err("Not allowed.", status.HTTP_403_FORBIDDEN)
        msg, err = self._load(request, msg_id)
        if err is not None:
            return err

        write = MessageWriteSerializer(data=request.data)
        write.is_valid(raise_exception=True)
        msg.body = write.validated_data["body"]
        msg.edited_at = timezone.now()
        msg.save(update_fields=["body", "edited_at", "updated_at"])
        _broadcast(msg.thread_id, msg, request)
        return Response(GroupMessageSerializer(msg, context={"request": request}).data)

    def delete(self, request, msg_id):
        user = request.user
        if user.role not in {"teacher", "admin"}:
            return _err("Not allowed.", status.HTTP_403_FORBIDDEN)
        msg, err = self._load(request, msg_id)
        if err is not None:
            return err
        if msg.sender_id != user.id and user.role != "admin":
            return _err("You can only delete your own messages.", status.HTTP_403_FORBIDDEN)

        msg.deleted_at = timezone.now()
        msg.save(update_fields=["deleted_at", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)