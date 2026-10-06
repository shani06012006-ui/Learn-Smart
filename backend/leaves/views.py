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
