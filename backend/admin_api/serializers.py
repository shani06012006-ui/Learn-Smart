"""Serializers for the institution admin API."""
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts.models import RefreshToken, User
from classes.models import ClassCourse, StudentEnrollment
from core.models import AuditLog
from institutions.models import Institution


class InstitutionBriefSerializer(serializers.ModelSerializer):
    """Compact institution payload for embedding in user rows."""

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
    """
    Create a teacher or student. Admins cannot create other admins through
    this endpoint Ã¢â‚¬â€ admin accounts are provisioned via the management
    commands (create_institution_admin) or Django's createsuperuser, so
    privilege escalation isn't possible via the API.

    The institution is assigned server-side from request.user, never
    accepted from the client.
    """

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
    """
    Editable fields on an existing user. Deliberately narrow:
    - Admins cannot change another user's email, role, or institution
      through this endpoint. Those are stable identifiers, and changing
      them via the API would break audit trails.
    - is_active toggling is exposed separately via a dedicated action, not
      this serializer, so the UI can render it as a distinct control.
    """

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
    """
    Read-only representation of a refresh token for the admin UI.

    SECURITY: `token_hash` is never exposed. The admin sees only the
    session metadata needed to identify and revoke it.

    `status` is a computed string: "active" | "revoked" | "expired".
    `is_active` mirrors RefreshToken.is_active() for client-side filtering.
    """

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
    """
    Read representation of a course for the admin UI.

    Mirrors the fields exposed by the teacher-facing ClassCourseSerializer
    so the UI components can be shared, with teacher expanded into a
    full brief object (rather than just the id) and institution included.
    """
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
        # Use the annotated value if the view provided one; fall back to
        # a query otherwise (for single-object retrieves).
        count = getattr(obj, "student_count", None)
        if count is not None:
            return count
        return obj.enrollments.filter(status=StudentEnrollment.STATUS_ACTIVE).count()


class AdminCourseWriteSerializer(serializers.Serializer):
    """
    Create + update payload for the admin course endpoints.

    - On create: name, subject, teacher_id are required. The institution is
      resolved server-side from the caller (or from an explicit
      institution_id for superusers).
    - On update: only name, subject, description, is_archived are accepted.
      teacher_id is not changeable here (a separate operation if needed
      later).
    """
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