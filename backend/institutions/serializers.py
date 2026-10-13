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
    sections = SectionInputSerializer(many=True, required=False)

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

    # ---- read shapes ------------------------------------------------
    def to_representation(self, instance):
        data = super().to_representation(instance)
        from classes.models import StudentEnrollment

        # Replace the write-shaped `sections` with a full read shape
        data["sections"] = [
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
            for s in instance.sections.all().order_by("name")
        ]
        return data

    def get_student_count(self, obj):
        return obj.students.filter(role="student", is_active=True).count()

    def get_class_count(self, obj):
        return obj.class_courses.filter(is_deleted=False).count()

    # ---- validation -------------------------------------------------
    def validate_sections(self, value):
        if value is None:
            return value
        seen = set()
        for item in value:
            name = (item.get("name") or "").strip()
            if not name:
                raise serializers.ValidationError("Section name is required.")
            key = name.lower()
            if key in seen:
                raise serializers.ValidationError(f"Duplicate section name: {name}")
            seen.add(key)
        return value

    # ---- sync helpers -----------------------------------------------
    def _sync_sections(self, grade, sections_data):
        """
        Creates, updates, and (optionally) deletes sections for a grade.
        Existing sections are matched by name (case-insensitive).
        Deleted sections are only removed if they have no active students.
        """
        from classes.models import ClassSection, StudentEnrollment

        existing = {s.name.lower(): s for s in grade.sections.all()}
        incoming = set()

        for item in sections_data:
            name = (item.get("name") or "").strip()
            if not name:
                continue
            incoming.add(name.lower())
            capacity = int(item.get("capacity") or 40)
            room = (item.get("room") or "").strip()

            if name.lower() in existing:
                s = existing[name.lower()]
                s.capacity = capacity
                s.room = room
                s.save(update_fields=["capacity", "room", "updated_at"])
            else:
                ClassSection.objects.create(
                    grade=grade,
                    name=name,
                    capacity=capacity,
                    room=room,
                    is_active=True,
                )

        # Remove sections the user deleted from the form (safe delete)
        for name_lower, s in existing.items():
            if name_lower not in incoming:
                has_students = StudentEnrollment.objects.filter(
                    section=s,
                    status=StudentEnrollment.STATUS_ACTIVE,
                ).exists()
                if not has_students:
                    s.delete()
                # else: silently keep the section (has active students)

    # ---- create / update -------------------------------------------
    def create(self, validated_data):
        sections_data = validated_data.pop("sections", None)
        grade = super().create(validated_data)
        if sections_data:
            self._sync_sections(grade, sections_data)
        return grade

    def update(self, instance, validated_data):
        sections_data = validated_data.pop("sections", None)
        grade = super().update(instance, validated_data)
        if sections_data is not None:
            self._sync_sections(grade, sections_data)
        return grade