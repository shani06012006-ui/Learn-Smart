"""
Serializers for the teacher/student leave-request API.

Read serializers mirror the ones in admin_api (same field shape) so the
frontend can use a single component for both sides.
"""
from datetime import date, timedelta

from rest_framework import serializers

from .models import StudentLeave, TeacherLeave


# ─────────────────────────────────────────────────────────────
# Read serializers (self + reviewer info)
# ─────────────────────────────────────────────────────────────

class _ReviewerBriefSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(read_only=True)

    def get_full_name(self, obj):
        return obj.get_full_name() if obj else ""


class MyLeaveReadSerializer(serializers.ModelSerializer):
    """Read shape returned to the teacher/student who owns the row."""
    reviewer = _ReviewerBriefSerializer(read_only=True)

    class Meta:
        model = StudentLeave  # overridden in subclass
        fields = [
            "id",
            "leave_type",
            "start_date",
            "end_date",
            "days",
            "status",
            "reason",
            "applied_at",
            "reviewed_at",
            "reviewer",
            "admin_remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class MyStudentLeaveSerializer(MyLeaveReadSerializer):
    class Meta(MyLeaveReadSerializer.Meta):
        model = StudentLeave


class MyTeacherLeaveSerializer(MyLeaveReadSerializer):
    class Meta(MyLeaveReadSerializer.Meta):
        model = TeacherLeave


# ─────────────────────────────────────────────────────────────
# Write serializer (create + validation)
# ─────────────────────────────────────────────────────────────

class LeaveCreateSerializer(serializers.Serializer):
    """
    Payload for POST /api/v1/leaves/my/

    Validations:
      - end_date >= start_date
      - start_date cannot be more than 60 days in the past
      - reason is required (min 5 chars)
      - no overlap with an existing pending/approved leave for the user
    """
    leave_type = serializers.ChoiceField(
        choices=[c[0] for c in StudentLeave.LEAVE_TYPE_CHOICES],
    )
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    reason = serializers.CharField(min_length=5, max_length=1000)

    def validate(self, attrs):
        start = attrs["start_date"]
        end = attrs["end_date"]

        if end < start:
            raise serializers.ValidationError(
                {"end_date": "End date cannot be before start date."}
            )
        if start < date.today() - timedelta(days=60):
            raise serializers.ValidationError(
                {"start_date": "Cannot apply more than 60 days in the past."}
            )
        return attrs

    def validate_overlap(self, user, model):
        """
        Called by the view after basic validation. `user` is the requesting
        student or teacher; `model` is StudentLeave or TeacherLeave.
        """
        start = self.validated_data["start_date"]
        end = self.validated_data["end_date"]

        owner_field = "student" if model is StudentLeave else "teacher"
        overlapping = model.objects.filter(
            **{owner_field: user},
            status__in=[StudentLeave.STATUS_PENDING, StudentLeave.STATUS_APPROVED],
            start_date__lte=end,
            end_date__gte=start,
        ).exists()

        if overlapping:
            raise serializers.ValidationError({
                "detail": "You already have a pending or approved leave "
                          "that overlaps these dates."
            })


class LeaveReviewSerializer(serializers.Serializer):
    """Not used by this app — kept for symmetry with admin_api."""
    admin_remarks = serializers.CharField(
        required=False, allow_blank=True, default=""
    )
