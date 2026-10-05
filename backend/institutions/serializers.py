from rest_framework import serializers

from .models import Institution


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ["id", "name", "slug", "created_at"]
        read_only_fields = fields


class GradeSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    class_count = serializers.SerializerMethodField()

    class Meta:
        from .models import Grade
        model = Grade
        fields = [
            "id", "level", "name", "is_active",
            "student_count", "class_count", "created_at",
        ]
        read_only_fields = ["id", "student_count", "class_count", "created_at"]

    def get_student_count(self, obj):
        return obj.students.filter(role="student", is_active=True).count()

    def get_class_count(self, obj):
        return obj.class_courses.filter(is_deleted=False).count()

