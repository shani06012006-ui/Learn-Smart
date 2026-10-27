from rest_framework import serializers

from .models import Institution


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ["id", "name", "slug", "created_at"]
        read_only_fields = fields


# ============================================================
# Sections — input shape accepted from the frontend
# ============================================================
class SectionInputSerializer(serializers.Serializer):
    """Write shape: what the frontend sends inside `sections`."""
    id = serializers.UUIDField(required=False, allow_null=True)
    name = serializers.CharField(max_length=50)
    capacity = serializers.IntegerField(required=False, default=40, min_value=1, max_value=500)
    room = serializers.CharField(required=False, allow_blank=True, default="")


class GradeSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    class_count = serializers.SerializerMethodField()
    sections = serializers.SerializerMethodField() # ✅ Read shape

    class Meta:
        from .models import Grade
        model = Grade
        fields = [
            "id", "level", "name", "is_active",
            "student_count", "class_count",
            "sections",
            "created_at",
        ]
        read_only_fields = ["id", "student_count", "class_count", "created_at"]

    def get_sections(self, obj):
        from classes.models import StudentEnrollment
        try:
            return [
                {
                    "id": str(s.id),
                    "name": s.name,
                    "capacity": s.capacity,
                    "room": s.room or "",
                    "is_active": s.is_active,
                    "student_count": s.section_enrollments.filter(
                        status=StudentEnrollment.STATUS_ACTIVE
                    ).count(),
                }
                for s in obj.sections.all().order_by("name")
            ]
        except Exception:
            return []

    def get_student_count(self, obj):
        from classes.models import StudentEnrollment
        try:
            return StudentEnrollment.objects.filter(
                class_course__grade=obj,
                status=StudentEnrollment.STATUS_ACTIVE,
            ).count()
        except Exception:
            return 0

    def get_class_count(self, obj):
        return obj.class_courses.filter(is_deleted=False).count()

    # --- Write methods for sections (for admin creation) ---
    def create(self, validated_data):
        # (If you need to pass sections during creation, add logic here)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # (If you need to pass sections during creation, add logic here)
        return super().update(instance, validated_data)