from rest_framework import serializers

from accounts.serializers import UserPublicSerializer

from .models import ClassCourse, StudentEnrollment


class ClassCourseSerializer(serializers.ModelSerializer):
    teacher = UserPublicSerializer(read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassCourse
        fields = [
            "id", "name", "subject", "description", "teacher",
            "is_archived", "student_count", "created_at",
        ]
        read_only_fields = ["id", "teacher", "is_archived", "student_count", "created_at"]

    def get_student_count(self, obj):
        return obj.enrollments.filter(status=StudentEnrollment.STATUS_ACTIVE).count()

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["teacher"] = request.user
        validated_data["institution"] = request.user.institution
        return super().create(validated_data)


class ClassCourseDetailSerializer(ClassCourseSerializer):
    class Meta(ClassCourseSerializer.Meta):
        fields = ClassCourseSerializer.Meta.fields + ["institution"]
        read_only_fields = ClassCourseSerializer.Meta.read_only_fields + ["institution"]


class AddStudentSerializer(serializers.Serializer):
    """Input serializer for POST /classes/{id}/students/ — not a ModelSerializer
    since it drives classes.services.add_student_to_class rather than a
    direct model create (the student User and the enrollment are two
    separate, conditionally-created objects)."""

    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    student = UserPublicSerializer(read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = [
            "id", "student", "joining_code", "status",
            "joined_at", "invited_at",
        ]
        read_only_fields = fields

    invited_at = serializers.DateTimeField(source="created_at", read_only=True)


class EnrollmentStatusUpdateSerializer(serializers.Serializer):
    """PATCH body for blocking/removing a student from a class roster."""

    status = serializers.ChoiceField(
        choices=[StudentEnrollment.STATUS_BLOCKED, StudentEnrollment.STATUS_REMOVED,
                 StudentEnrollment.STATUS_ACTIVE]
    )


class JoinClassSerializer(serializers.Serializer):
    joining_code = serializers.CharField(max_length=6, min_length=6)
