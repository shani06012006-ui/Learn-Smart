"""Serializers for the institution admin API."""
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts.models import User
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
    this endpoint — admin accounts are provisioned via the management
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