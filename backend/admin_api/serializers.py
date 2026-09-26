from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts.models import (
    RefreshToken,
    StudentAttendance,
    TeacherAttendance,
    User,
)
from classes.models import ClassCourse, LiveClass, StudentEnrollment, TimetableEntry
from core.models import AuditLog
from institutions.models import Institution


class InstitutionBriefSerializer(serializers.ModelSerializer):

    class Meta:
        model = Institution
        fields = ["id", "name", "slug"]
        read_only_fields = fields


class AdminUserSerializer(serializers.ModelSerializer):
    """Read representation of a user for the admin UI."""

    institution = InstitutionBriefSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "institution",
            "is_active",
            "is_staff",
            "is_superuser",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()


class AdminUserCreateSerializer(serializers.Serializer):

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150, allow_blank=True, required=False, default="")
    last_name = serializers.CharField(max_length=150, allow_blank=True, required=False, default="")
    role = serializers.ChoiceField(choices=[User.ROLE_TEACHER, User.ROLE_STUDENT])

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value


class AdminUserUpdateSerializer(serializers.Serializer):

    first_name = serializers.CharField(max_length=150, allow_blank=True, required=False)
    last_name = serializers.CharField(max_length=150, allow_blank=True, required=False)


class AdminUserToggleActiveSerializer(serializers.Serializer):
    """Payload for the activate/deactivate action."""

    is_active = serializers.BooleanField()


class AdminStatsSerializer(serializers.Serializer):
    """Payload for the dashboard stats endpoint."""

    users_total = serializers.IntegerField()
    users_teachers = serializers.IntegerField()
    users_students = serializers.IntegerField()
    users_admins = serializers.IntegerField()
    users_inactive = serializers.IntegerField()
    classes_total = serializers.IntegerField()
    classes_archived = serializers.IntegerField()
    enrollments_active = serializers.IntegerField()
    institution = InstitutionBriefSerializer(allow_null=True)
    is_superuser_view = serializers.BooleanField()


# ---------------------------------------------------------------- enrollments


class AdminEnrollmentStudentBriefSerializer(serializers.ModelSerializer):
    """Compact student payload embedded in enrollment rows."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name", "is_active"]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()


class AdminEnrollmentClassBriefSerializer(serializers.ModelSerializer):
    """Compact class payload embedded in enrollment rows."""

    teacher = serializers.SerializerMethodField()

    class Meta:
        model = ClassCourse
        fields = [
            "id",
            "name",
            "subject",
            "is_archived",
            "teacher",
        ]
        read_only_fields = fields

    def get_teacher(self, obj):
        return {
            "id": str(obj.teacher.id),
            "email": obj.teacher.email,
            "full_name": obj.teacher.get_full_name(),
        }


class AdminEnrollmentSerializer(serializers.ModelSerializer):
    """
    Read-only representation of a StudentEnrollment for the admin UI.
    """

    student = AdminEnrollmentStudentBriefSerializer(read_only=True)
    class_course = AdminEnrollmentClassBriefSerializer(read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = [
            "id",
            "student",
            "class_course",
            "status",
            "joined_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


# ---------------------------------------------------------------- sessions


class AdminSessionUserBriefSerializer(serializers.ModelSerializer):
    """Compact user payload embedded in session rows."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name", "role"]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()


class AdminRefreshTokenSerializer(serializers.ModelSerializer):

    user = AdminSessionUserBriefSerializer(read_only=True)
    status = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = RefreshToken
        fields = [
            "id",
            "user",
            "device_label",
            "ip_address",
            "user_agent",
            "issued_at",
            "expires_at",
            "last_used_at",
            "used_at",
            "revoked_at",
            "revoked_reason",
            "status",
            "is_active",
        ]
        read_only_fields = fields

    def get_status(self, obj):
        from django.utils import timezone

        if obj.revoked_at is not None:
            return "revoked"
        if obj.expires_at <= timezone.now():
            return "expired"
        return "active"

    def get_is_active(self, obj):
        return obj.is_active()


# --------------------------------------------------------------------------
# Course management
# --------------------------------------------------------------------------

class AdminCourseTeacherBriefSerializer(serializers.ModelSerializer):
    """Compact teacher payload embedded in course rows."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name"]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()


class AdminCourseReadSerializer(serializers.ModelSerializer):

    teacher = AdminCourseTeacherBriefSerializer(read_only=True)
    institution = InstitutionBriefSerializer(read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassCourse
        fields = [
            "id",
            "name",
            "subject",
            "description",
            "teacher",
            "institution",
            "is_archived",
            "student_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_student_count(self, obj):
        count = getattr(obj, "student_count", None)
        if count is not None:
            return count
        return obj.enrollments.filter(status=StudentEnrollment.STATUS_ACTIVE).count()


class AdminCourseWriteSerializer(serializers.Serializer):

    name = serializers.CharField(max_length=255, required=False)
    subject = serializers.CharField(max_length=100, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    teacher_id = serializers.UUIDField(required=False)
    is_archived = serializers.BooleanField(required=False)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field is required.")
        return value

    def validate_subject(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field is required.")
        return value

# ---------------------------------------------------------------- audit log

class AuditActorBriefSerializer(serializers.ModelSerializer):
    """Compact actor payload embedded in audit rows."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name", "role"]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()


class AuditLogSerializer(serializers.ModelSerializer):

    actor = AuditActorBriefSerializer(read_only=True)
    resource_id = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "occurred_at",
            "actor",
            "actor_type",
            "action",
            "resource_type",
            "resource_id",
            "metadata",
            "ip_address",
            "user_agent",
        ]
        read_only_fields = fields

    def get_resource_id(self, obj):
        return str(obj.resource_id) if obj.resource_id else None


# ---------------------------------------------------------------- attendance

class AttendanceStudentBriefSerializer(serializers.ModelSerializer):
    """Compact student payload embedded in attendance rows."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name", "is_active"]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()


class AttendanceTeacherBriefSerializer(serializers.ModelSerializer):
    """Compact teacher payload embedded in attendance rows."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name"]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()


class AttendanceClassBriefSerializer(serializers.ModelSerializer):
    """Compact class payload embedded in student attendance rows."""

    teacher = AttendanceTeacherBriefSerializer(read_only=True)

    class Meta:
        model = ClassCourse
        fields = ["id", "name", "subject", "is_archived", "teacher"]
        read_only_fields = fields


class TeacherAttendanceSerializer(serializers.ModelSerializer):
    """Read-only teacher attendance row for the admin UI."""

    teacher = AttendanceTeacherBriefSerializer(read_only=True)

    class Meta:
        model = TeacherAttendance
        fields = [
            "id",
            "teacher",
            "date",
            "first_seen_at",
            "last_seen_at",
            "status",
            "duration_seconds",
        ]
        read_only_fields = fields


class StudentAttendanceSerializer(serializers.ModelSerializer):
    """Read-only student attendance row for the admin UI."""

    student = AttendanceStudentBriefSerializer(read_only=True)
    class_course = AttendanceClassBriefSerializer(read_only=True)

    class Meta:
        model = StudentAttendance
        fields = [
            "id",
            "student",
            "class_course",
            "date",
            "joined_at",
            "left_at",
            "status",
            "duration_seconds",
            "source",
        ]
        read_only_fields = fields

# ---------------------------------------------------------------- timetable

class TimetableEntryReadSerializer(serializers.ModelSerializer):
    """Read-only timetable row for admin + role-aware views."""

    teacher = AdminCourseTeacherBriefSerializer(read_only=True)
    class_course = AdminEnrollmentClassBriefSerializer(read_only=True)
    day_label = serializers.SerializerMethodField()

    class Meta:
        model = TimetableEntry
        fields = [
            "id",
            "class_course",
            "teacher",
            "day_of_week",
            "day_label",
            "start_time",
            "end_time",
            "room",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_day_label(self, obj):
        return obj.get_day_of_week_display()


class TimetableEntryWriteSerializer(serializers.Serializer):

    class_course_id = serializers.UUIDField()
    day_of_week = serializers.IntegerField(min_value=0, max_value=6)
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    room = serializers.CharField(max_length=100, allow_blank=True, required=False, default="")
    is_active = serializers.BooleanField(required=False, default=True)

    def validate(self, attrs):
        start = attrs.get("start_time")
        end = attrs.get("end_time")

        if start and end and end <= start:
            raise serializers.ValidationError(
                {"end_time": "End time must be after start time."}
            )

        class_id = attrs.get("class_course_id")
        try:
            course = ClassCourse.objects.get(pk=class_id)
        except ClassCourse.DoesNotExist:
            raise serializers.ValidationError(
                {"class_course_id": "No class matches this id."}
            )

        attrs["_course"] = course
        return attrs

    # ------------------------------------------------------------------ conflicts

    def _overlapping_qs(self, *, day, start, end, exclude_id=None):
        """
        Return rows on the same day whose [start, end) interval overlaps
        the requested one. Two intervals overlap iff
            existing.start < new.end AND existing.end > new.start.
        """
        qs = TimetableEntry.objects.filter(
            day_of_week=day,
            is_active=True,
            start_time__lt=end,
            end_time__gt=start,
        )
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)
        return qs

    def check_conflicts(self, *, course, day, start, end, room, exclude_id=None):
        """
        Run the three conflict checks. Called from the viewset once the
        caller's institution scope is known. Raises ValidationError on
        the first conflict found.
        """
        base = self._overlapping_qs(
            day=day, start=start, end=end, exclude_id=exclude_id
        )

        # 1. Teacher conflict — same teacher already booked in this slot.
        teacher = course.teacher
        if base.filter(teacher=teacher).exists():
            raise serializers.ValidationError(
                f"{teacher.get_full_name() or teacher.email} already has "
                "a class in this time slot."
            )

        # 2. Class conflict — the same class already has a slot here.
        if base.filter(class_course=course).exists():
            raise serializers.ValidationError(
                f"{course.name} already has a timetable entry in this time slot."
            )

        room_clean = (room or "").strip()
        if room_clean:
            if base.filter(room__iexact=room_clean).exists():
                raise serializers.ValidationError(
                    f"Room '{room_clean}' is already booked in this time slot."
                )
                


# ---------------------------------------------------------------- live classes


class LiveClassTimetableBriefSerializer(serializers.ModelSerializer):
    """Compact timetable entry payload embedded in live-class rows."""

    class Meta:
        model = TimetableEntry
        fields = ["id", "day_of_week", "start_time", "end_time", "room"]
        read_only_fields = fields


class LiveClassReadSerializer(serializers.ModelSerializer):
    """
    Read representation of a LiveClass session for the admin + role-aware
    views.

    `status` is derived via `computed_status()` — not a stored field.
    """

    timetable_entry = LiveClassTimetableBriefSerializer(read_only=True)
    class_course = AdminEnrollmentClassBriefSerializer(read_only=True)
    teacher = AdminCourseTeacherBriefSerializer(read_only=True)
    institution = InstitutionBriefSerializer(read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = LiveClass
        fields = [
            "id",
            "timetable_entry",
            "class_course",
            "teacher",
            "institution",
            "scheduled_date",
            "scheduled_start",
            "scheduled_end",
            "room",
            "status",
            "meeting_url",
            "recording_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_status(self, obj):
        return obj.computed_status()


class LiveClassWriteSerializer(serializers.Serializer):
    """
    Update payload for live-class rows.

    Admin can change room / meeting_url / recording_url. Cancellation is
    a one-way status flip — only `cancelled` is accepted here.
    """

    room = serializers.CharField(max_length=100, allow_blank=True, required=False)
    meeting_url = serializers.URLField(allow_blank=True, required=False)
    recording_url = serializers.URLField(allow_blank=True, required=False)
    stored_status = serializers.ChoiceField(
        choices=[LiveClass.STATUS_CANCELLED],
        required=False,
    )                