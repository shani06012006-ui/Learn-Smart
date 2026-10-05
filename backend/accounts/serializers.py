from rest_framework import serializers

from institutions.models import Institution
from .models import User


class InstitutionBriefSerializer(serializers.ModelSerializer):
    """Compact institution payload for embedding in user rows."""

    class Meta:
        model = Institution
        fields = ["id", "name", "slug"]
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    institution = InstitutionBriefSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "institution",
            "is_active",
            "is_superuser",
        ]
        read_only_fields = ["id"]


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
        ]
        read_only_fields = fields


class GradeBriefForStudentSerializer(serializers.Serializer):
    """Inline grade object for student rows."""
    id = serializers.UUIDField()
    level = serializers.IntegerField()
    name = serializers.CharField()


class StudentClassBriefSerializer(serializers.Serializer):
    """Minimal class info shown as a chip on a student row."""
    id = serializers.UUIDField()
    name = serializers.CharField()
    subject = serializers.CharField()


class StudentBriefSerializer(serializers.ModelSerializer):
    """
    Compact student representation for teacher-side views.

    Fields:
      id, email, first_name, last_name, full_name, initials,
      role, grade, classes, is_active
    """
    full_name = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()
    grade = serializers.SerializerMethodField()
    classes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name",
            "full_name", "initials", "role", "grade",
            "classes", "is_active",
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_initials(self, obj):
        name = obj.get_full_name() or obj.email
        parts = [p for p in (name or "").split() if p]
        if not parts:
            return "?"
        return "".join(p[0] for p in parts[:2]).upper()

    def get_grade(self, obj):
        if not obj.grade_id:
            return None
        g = obj.grade
        return {"id": str(g.id), "level": g.level, "name": g.name}

    def get_classes(self, obj):
        # The list view attaches `_my_classes` (a list of dicts) to avoid
        # N+1 queries. Fall back to a live query if not attached.
        cached = getattr(obj, "_my_classes", None)
        if cached is not None:
            return cached
        from classes.models import StudentEnrollment
        enrollments = (
            StudentEnrollment.objects
            .filter(student=obj, status=StudentEnrollment.STATUS_ACTIVE)
            .select_related("class_course")
        )
        return [
            {
                "id": str(e.class_course.id),
                "name": e.class_course.name,
                "subject": e.class_course.subject,
            }
            for e in enrollments
        ]

