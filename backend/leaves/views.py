"""
Teacher / student leave-request REST views.

Endpoints (mounted at /api/v1/leaves/):

  GET    my/           -- list own leave requests
  POST   my/           -- submit a new leave request
  POST   <id>/cancel/  -- cancel a pending request
  GET    summary/      -- status counts for the current user
"""
from django.utils import timezone
from rest_framework import status as http_status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import StudentLeave, TeacherLeave
from .serializers import (
    LeaveCreateSerializer,
    MyStudentLeaveSerializer,
    MyTeacherLeaveSerializer,
)


def _model_and_owner_field(user):
    """Return (model, owner_field_name) based on the user's role."""
    if user.role == "teacher":
        return TeacherLeave, "teacher"
    if user.role == "student":
        return StudentLeave, "student"
    return None, None


def _broadcast_new_leave(leave, user):
    """Notify the institution's admin channel that a leave was created."""
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        layer = get_channel_layer()
        if layer is None:
            return
        group = f"leaves_admin_{leave.institution_id}"
        payload = {
            "id": str(leave.id),
            "leave_type": leave.leave_type,
            "start_date": leave.start_date.isoformat(),
            "end_date": leave.end_date.isoformat(),
            "days": leave.days,
            "status": leave.status,
            "reason": leave.reason,
            "applied_at": leave.applied_at.isoformat(),
            "requester": {
                "id": str(user.id),
                "full_name": user.get_full_name() or user.email,
                "email": user.email,
                "role": user.role,
            },
        }
        async_to_sync(layer.group_send)(
            group,
            {"type": "leave.created", "leave": payload},
        )
    except Exception:
        import logging
        logging.getLogger(__name__).exception("broadcast_new_leave failed")


# ─────────────────────────────────────────────────────────────
# List + Create
# ─────────────────────────────────────────────────────────────

class MyLeavesView(APIView):
    """
    GET  /api/v1/leaves/my/  -- list own leaves (newest first)
    POST /api/v1/leaves/my/  -- create a new leave request
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        model, owner_field = _model_and_owner_field(request.user)
        if model is None:
            return Response(
                {"detail": "Only teachers and students can access this endpoint."},
                status=http_status.HTTP_403_FORBIDDEN,
            )

        qs = (
            model.objects
            .filter(**{owner_field: request.user})
            .select_related("reviewer")
            .order_by("-applied_at")
        )

        status_filter = request.query_params.get("status")
        if status_filter in {
            model.STATUS_PENDING,
            model.STATUS_APPROVED,
            model.STATUS_REJECTED,
            model.STATUS_CANCELLED,
        }:
            qs = qs.filter(status=status_filter)

        serializer_cls = (
            MyTeacherLeaveSerializer if model is TeacherLeave
            else MyStudentLeaveSerializer
        )
        return Response({
            "count": qs.count(),
            "results": serializer_cls(qs, many=True).data,
        })

    def post(self, request):
        model, owner_field = _model_and_owner_field(request.user)
        if model is None:
            return Response(
                {"detail": "Only teachers and students can submit leave requests."},
                status=http_status.HTTP_403_FORBIDDEN,
            )

        serializer = LeaveCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        serializer.validate_overlap(request.user, model)

        leave = model.objects.create(
            **{owner_field: request.user},
            institution=request.user.institution,
            leave_type=serializer.validated_data["leave_type"],
            start_date=serializer.validated_data["start_date"],
            end_date=serializer.validated_data["end_date"],
            reason=serializer.validated_data["reason"],
            status=model.STATUS_PENDING,
        )

        _broadcast_new_leave(leave, request.user)

        return Response(
            (MyTeacherLeaveSerializer if model is TeacherLeave
             else MyStudentLeaveSerializer)(leave).data,
            status=http_status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────
# Cancel own pending leave
# ─────────────────────────────────────────────────────────────

class CancelLeaveView(APIView):
    """
    POST /api/v1/leaves/<id>/cancel/
    Only the owner may cancel; only if status == pending.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, leave_id):
        model, owner_field = _model_and_owner_field(request.user)
        if model is None:
            return Response(
                {"detail": "Not permitted."},
                status=http_status.HTTP_403_FORBIDDEN,
            )

        try:
            leave = model.objects.get(
                id=leave_id,
                **{owner_field: request.user},
            )
        except model.DoesNotExist:
            return Response(
                {"detail": "Leave not found."},
                status=http_status.HTTP_404_NOT_FOUND,
            )

        if leave.status != model.STATUS_PENDING:
            return Response(
                {"detail": "Only pending leave requests can be cancelled."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        leave.status = model.STATUS_CANCELLED
        leave.save(update_fields=["status", "updated_at"])

        # Notify admin group about the cancellation
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            layer = get_channel_layer()
            if layer is not None:
                async_to_sync(layer.group_send)(
                    f"leaves_admin_{leave.institution_id}",
                    {
                        "type": "leave.cancelled",
                        "leave_id": str(leave.id),
                    },
                )
        except Exception:
            pass

        serializer_cls = (
            MyTeacherLeaveSerializer if model is TeacherLeave
            else MyStudentLeaveSerializer
        )
        return Response(serializer_cls(leave).data)


# ─────────────────────────────────────────────────────────────
# Summary (status counts for the sidebar badge)
# ─────────────────────────────────────────────────────────────

class LeaveSummaryView(APIView):
    """
    GET /api/v1/leaves/summary/
    Returns { pending, approved, rejected, cancelled, total }.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        model, owner_field = _model_and_owner_field(request.user)
        if model is None:
            return Response(
                {"detail": "Not permitted."},
                status=http_status.HTTP_403_FORBIDDEN,
            )

        qs = model.objects.filter(**{owner_field: request.user})
        counts = {
            "pending": qs.filter(status=model.STATUS_PENDING).count(),
            "approved": qs.filter(status=model.STATUS_APPROVED).count(),
            "rejected": qs.filter(status=model.STATUS_REJECTED).count(),
            "cancelled": qs.filter(status=model.STATUS_CANCELLED).count(),
        }
        counts["total"] = sum(counts.values())
        return Response(counts)


# ═══════════════════════════════════════════════════════════════
# Teacher: student leaves from the classes they teach
# ═══════════════════════════════════════════════════════════════

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound

from admin_api.serializers import (
    StudentLeaveReadSerializer,
    LeaveReviewSerializer,
)


class IsTeacher(IsAuthenticated):
    """Caller must be a teacher."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return getattr(request.user, "role", None) == "teacher"


class TeacherStudentLeavesViewSet(viewsets.GenericViewSet):
    """
    Teacher view of student leaves for their own classes.

    GET    /api/v1/teacher/leaves/students/
    GET    /api/v1/teacher/leaves/students/<id>/
    POST   /api/v1/teacher/leaves/students/<id>/approve/
    POST   /api/v1/teacher/leaves/students/<id>/reject/
    POST   /api/v1/teacher/leaves/students/<id>/cancel/

    Queryset is scoped to StudentLeave rows whose student is
    actively enrolled in one of the requesting teacher's classes.
    """
    permission_classes = [IsTeacher]

    def _scope_queryset(self, qs):
        return qs.filter(
            student__enrollments__class_course__teacher=self.request.user,
            student__enrollments__status="active",
        ).distinct()

    def get_queryset(self):
        qs = (
            StudentLeave.objects.all()
            .select_related("student", "institution", "reviewer")
        )
        qs = self._scope_queryset(qs)

        status_filter = self.request.query_params.get("status")
        if status_filter in {
            StudentLeave.STATUS_PENDING,
            StudentLeave.STATUS_APPROVED,
            StudentLeave.STATUS_REJECTED,
            StudentLeave.STATUS_CANCELLED,
        }:
            qs = qs.filter(status=status_filter)

        leave_type = self.request.query_params.get("leave_type")
        if leave_type in {
            StudentLeave.LEAVE_SICK,
            StudentLeave.LEAVE_CASUAL,
            StudentLeave.LEAVE_VACATION,
            StudentLeave.LEAVE_OTHER,
        }:
            qs = qs.filter(leave_type=leave_type)

        q = self.request.query_params.get("q")
        if q:
            from django.db.models import Q
            qs = qs.filter(
                Q(student__email__icontains=q)
                | Q(student__first_name__icontains=q)
                | Q(student__last_name__icontains=q)
            )

        from_str = self.request.query_params.get("from")
        if from_str:
            qs = qs.filter(start_date__gte=from_str)
        to_str = self.request.query_params.get("to")
        if to_str:
            qs = qs.filter(end_date__lte=to_str)

        return qs.order_by("-applied_at")

    def get_object(self):
        pk = self.kwargs["pk"]
        try:
            return self.get_queryset().get(pk=pk)
        except StudentLeave.DoesNotExist:
            raise NotFound("Student leave not found.")

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(
                StudentLeaveReadSerializer(page, many=True).data
            )
        return Response(StudentLeaveReadSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        obj = self.get_object()
        return Response(StudentLeaveReadSerializer(obj).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != StudentLeave.STATUS_PENDING:
            return Response(
                {"error": {"detail": "Only pending leaves can be approved.", "status_code": 400}},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        leave.status = StudentLeave.STATUS_APPROVED
        leave.reviewed_at = timezone.now()
        leave.reviewer = request.user
        leave.admin_remarks = serializer.validated_data.get("admin_remarks", "")
        leave.save(update_fields=["status", "reviewed_at", "reviewer", "admin_remarks", "updated_at"])
        return Response(StudentLeaveReadSerializer(leave).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != StudentLeave.STATUS_PENDING:
            return Response(
                {"error": {"detail": "Only pending leaves can be rejected.", "status_code": 400}},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        leave.status = StudentLeave.STATUS_REJECTED
        leave.reviewed_at = timezone.now()
        leave.reviewer = request.user
        leave.admin_remarks = serializer.validated_data.get("admin_remarks", "")
        leave.save(update_fields=["status", "reviewed_at", "reviewer", "admin_remarks", "updated_at"])
        return Response(StudentLeaveReadSerializer(leave).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        leave = self.get_object()
        if leave.status == StudentLeave.STATUS_CANCELLED:
            return Response(
                {"error": {"detail": "Leave is already cancelled.", "status_code": 400}},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        leave.status = StudentLeave.STATUS_CANCELLED
        leave.reviewed_at = timezone.now()
        leave.reviewer = request.user
        leave.admin_remarks = serializer.validated_data.get("admin_remarks", "")
        leave.save(update_fields=["status", "reviewed_at", "reviewer", "admin_remarks", "updated_at"])
        return Response(StudentLeaveReadSerializer(leave).data)

