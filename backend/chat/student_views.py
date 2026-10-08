# -*- coding: utf-8 -*-
"""
Student-facing chat endpoints.

All endpoints are auto-scoped to request.user (must be a student).
Threads the student can see:
  - Group threads they're a member of (via class enrollment)
  - DM threads they're a member of
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Q
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from accounts.models import User
from .models import Message, Thread, ThreadMember


def _require_student(user):
    return getattr(user, "role", None) == getattr(User, "ROLE_STUDENT", "student")


def _full_name(u):
    if not u:
        return None
    return (f"{u.first_name or ''} {u.last_name or ''}".strip()) or u.email


class StudentChatPermission(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return _require_student(request.user)


def _serialize_message(m):
    return {
        "id": str(m.id),
        "body": m.body if not m.is_deleted else "[message deleted]",
        "sender": {
            "id": str(m.sender_id),
            "name": _full_name(m.sender),
            "role": getattr(m.sender, "role", None),
        },
        "created_at": m.created_at.isoformat() if m.created_at else None,
        "is_deleted": m.is_deleted,
    }


def _serialize_thread(t, user):
    """Compact thread summary for the room list."""
    last = t.messages.order_by("-created_at").first()
    other_users = []
    if t.kind == Thread.KIND_DM:
        for m in t.memberships.select_related("user"):
            if m.user_id != user.id:
                other_users.append({
                    "id": str(m.user_id),
                    "name": _full_name(m.user),
                    "role": getattr(m.user, "role", None),
                })
    return {
        "id": str(t.id),
        "kind": t.kind,
        "title": t.title or (t.class_course.name if t.class_course_id else ""),
        "class_course_id": str(t.class_course_id) if t.class_course_id else None,
        "other_users": other_users,
        "last_message": _serialize_message(last) if last else None,
        "last_read_at": (
            t.memberships.filter(user=user).values_list("last_read_at", flat=True).first()
        ),
    }


class StudentChatViewSet(ViewSet):
    permission_classes = [StudentChatPermission]

    def list(self, request):
        """GET /student/chat/rooms/ — all rooms the student is in."""
        threads = (
            Thread.objects
            .filter(memberships__user=request.user)
            .select_related("class_course")
            .order_by("-updated_at", "-created_at")
        )
        rooms = [_serialize_thread(t, request.user) for t in threads]
        return Response({"count": len(rooms), "results": rooms})

    def retrieve(self, request, pk=None):
        """GET /student/chat/rooms/<id>/ — thread details."""
        try:
            t = Thread.objects.get(pk=pk, memberships__user=request.user)
        except Thread.DoesNotExist:
            return Response(
                {"error": {"detail": "Room not found.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(_serialize_thread(t, request.user))

    @action(detail=True, methods=["get"], url_path="messages")
    def messages(self, request, pk=None):
        """GET /student/chat/rooms/<id>/messages/?after=<iso>"""
        try:
            t = Thread.objects.get(pk=pk, memberships__user=request.user)
        except Thread.DoesNotExist:
            return Response(
                {"error": {"detail": "Room not found.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )

        qs = t.messages.select_related("sender").order_by("created_at")
        after = request.query_params.get("after")
        if after:
            qs = qs.filter(created_at__gt=after)
        qs = qs[:200]

        # Mark as read
        ThreadMember.objects.filter(thread=t, user=request.user).update(
            last_read_at=__import__("django.utils.timezone", fromlist=["now"]).now()
        )

        return Response({"count": qs.count(), "results": [_serialize_message(m) for m in qs]})

    @action(detail=True, methods=["post"], url_path="send")
    def send(self, request, pk=None):
        """POST /student/chat/rooms/<id>/send/ — {body}"""
        try:
            t = Thread.objects.get(pk=pk, memberships__user=request.user)
        except Thread.DoesNotExist:
            return Response(
                {"error": {"detail": "Room not found.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )
        body = (request.data.get("body") or "").strip()
        if not body:
            return Response(
                {"error": {"detail": "Empty message.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        msg = Message.objects.create(thread=t, sender=request.user, body=body)
        payload = _serialize_message(msg)

        # Broadcast to any live WebSocket subscribers
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"chat_thread_{t.id}",
                {"type": "chat.message", "message": payload},
            )
        except Exception:
            import logging
            logging.getLogger(__name__).exception("chat broadcast failed")

        return Response(payload, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="dm/(?P<teacher_id>[^/.]+)")
    def dm(self, request, teacher_id=None):
        """POST /student/chat/rooms/dm/<teacher_id>/ — get-or-create a DM thread."""
        try:
            teacher = User.objects.get(
                pk=teacher_id,
                role=getattr(User, "ROLE_TEACHER", "teacher"),
            )
        except User.DoesNotExist:
            return Response(
                {"error": {"detail": "Teacher not found.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )

        student = request.user
        if not student.institution_id or teacher.institution_id != student.institution_id:
            return Response(
                {"error": {"detail": "Teacher not in your institution.", "status_code": 403}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Find an existing DM thread with both members
        existing = (
            Thread.objects
            .filter(kind=Thread.KIND_DM, institution=student.institution)
            .filter(memberships__user=student)
            .filter(memberships__user=teacher)
            .first()
        )
        if existing:
            return Response(_serialize_thread(existing, student))

        t = Thread.objects.create(
            institution=student.institution,
            kind=Thread.KIND_DM,
            title="",
            created_by=student,
        )
        ThreadMember.objects.get_or_create(thread=t, user=student)
        ThreadMember.objects.get_or_create(thread=t, user=teacher)
        return Response(_serialize_thread(t, student), status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="teachers")
    def teachers(self, request):
        """GET /student/chat/rooms/teachers/ — teachers of my classes."""
        from classes.models import ClassCourse
        teachers = (
            User.objects
            .filter(
                role=getattr(User, "ROLE_TEACHER", "teacher"),
                classes_taught__enrollments__student=request.user,
                classes_taught__enrollments__status="active",
            )
            .distinct()
        )
        rows = [{
            "id": str(t.id),
            "name": _full_name(t),
            "email": t.email,
        } for t in teachers]
        return Response({"count": len(rows), "results": rows})


# ═══════════════════════════════════════════════════════════════
# Teacher-side chat (class groups + institution teachers group)
# ═══════════════════════════════════════════════════════════════

class TeacherChatPermission(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return getattr(request.user, "role", None) in ("teacher", "admin")


class TeacherChatViewSet(ViewSet):
    """
    Teacher-facing chat endpoints.
    - List all threads the teacher is a member of (class groups + institution group)
    - Read/send messages
    - Uses the same serializer shape as student chat for consistency
    """
    permission_classes = [TeacherChatPermission]

    def list(self, request):
        threads = (
            Thread.objects
            .filter(memberships__user=request.user)
            .select_related("class_course")
            .order_by("-updated_at", "-created_at")
        )
        rooms = [_serialize_thread(t, request.user) for t in threads]
        return Response({"count": len(rooms), "results": rooms})

    def retrieve(self, request, pk=None):
        try:
            t = Thread.objects.get(pk=pk, memberships__user=request.user)
        except Thread.DoesNotExist:
            return Response(
                {"error": {"detail": "Room not found.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(_serialize_thread(t, request.user))

    @action(detail=True, methods=["get"], url_path="messages")
    def messages(self, request, pk=None):
        try:
            t = Thread.objects.get(pk=pk, memberships__user=request.user)
        except Thread.DoesNotExist:
            return Response(
                {"error": {"detail": "Room not found.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )
        qs = t.messages.select_related("sender").order_by("created_at")[:200]
        return Response({"count": qs.count(), "results": [_serialize_message(m) for m in qs]})

    @action(detail=True, methods=["post"], url_path="send")
    def send(self, request, pk=None):
        try:
            t = Thread.objects.get(pk=pk, memberships__user=request.user)
        except Thread.DoesNotExist:
            return Response(
                {"error": {"detail": "Room not found.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )
        body = (request.data.get("body") or "").strip()
        if not body:
            return Response(
                {"error": {"detail": "Empty message.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        msg = Message.objects.create(thread=t, sender=request.user, body=body)
        payload = _serialize_message(msg)
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            async_to_sync(get_channel_layer().group_send)(
                f"chat_thread_{t.id}",
                {"type": "chat.message", "message": payload},
            )
        except Exception:
            import logging
            logging.getLogger(__name__).exception("teacher chat broadcast failed")
        return Response(payload, status=status.HTTP_201_CREATED)

