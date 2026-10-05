from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserPublicSerializer

from .models import ClassCourse, Material, StudentEnrollment


class ClassCourseSerializer(serializers.ModelSerializer):
    teacher = UserPublicSerializer(read_only=True)
    student_count = serializers.SerializerMethodField()
    grade_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    grade = serializers.SerializerMethodField()
    auto_enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassCourse
        fields = [
            "id", "name", "subject", "description", "teacher",
            "is_archived", "student_count", "created_at",
            "grade_id", "grade", "auto_enrolled_count",
        ]
        read_only_fields = [
            "id", "teacher", "is_archived", "student_count", "created_at",
            "grade", "auto_enrolled_count",
        ]

    def get_grade(self, obj):
        if not obj.grade_id:
            return None
        return {
            "id": str(obj.grade.id),
            "level": obj.grade.level,
            "name": obj.grade.name,
        }

    def get_auto_enrolled_count(self, obj):
        return getattr(self.context.get("request"), "_auto_enrolled_count", 0)

    def validate_grade_id(self, value):
        if value in (None, ""):
            return None
        from institutions.models import Grade
        request = self.context.get("request")
        qs = Grade.objects.filter(id=value)
        if request and request.user.institution_id:
            qs = qs.filter(institution_id=request.user.institution_id)
        try:
            return qs.get()
        except Grade.DoesNotExist:
            raise serializers.ValidationError("Unknown grade for your institution.")

    def create(self, validated_data):
        grade = validated_data.pop("grade_id", None)
        request = self.context["request"]
        validated_data["teacher"] = request.user
        validated_data["institution"] = request.user.institution
        if grade is not None:
            validated_data["grade"] = grade
        return super().create(validated_data)

    def update(self, instance, validated_data):
        grade = validated_data.pop("grade_id", None)
        if "grade_id" in self.initial_data:
            instance.grade = grade
        return super().update(instance, validated_data)

    def get_student_count(self, obj):
        """
        Number of students on this class, excluding blocked and removed.

        PENDING is included: a pending enrollment is a real student who
        just hasn't redeemed their joining code yet.
        """
        return obj.enrollments.exclude(
            status__in=[
                StudentEnrollment.STATUS_BLOCKED,
                StudentEnrollment.STATUS_REMOVED,
            ]
        ).count()

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


# ---------------------------------------------------------------- materials


ALLOWED_MATERIAL_EXTENSIONS = frozenset({
    # documents
    "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv",
    # images
    "png", "jpg", "jpeg", "gif", "webp",
    # video
    "mp4", "mov", "webm",
    # audio
    "mp3", "m4a", "wav",
    # archives
    "zip",
})

MAX_MATERIAL_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


class MaterialUploaderBriefSerializer(serializers.ModelSerializer):
    """Compact uploader payload embedded in material rows."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "full_name"]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()


class MaterialSerializer(serializers.ModelSerializer):
    """Read representation of a Material row."""
    uploaded_by = MaterialUploaderBriefSerializer(read_only=True)
    class_course_id = serializers.UUIDField(source="class_course.id", read_only=True)
    class_course_name = serializers.CharField(source="class_course.name", read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = [
            "id",
            "class_course_id",
            "class_course_name",
            "uploaded_by",
            "title",
            "description",
            "file",
            "file_url",
            "file_name",
            "file_size",
            "mime_type",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_file_url(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return None
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class MaterialUploadSerializer(serializers.Serializer):
    """
    Write payload for POST /api/v1/classes/{id}/materials/.

    Validates:
        - title present, non-blank, max 200 chars
        - file present
        - file extension in the allowed set
        - file size <= 50 MB
    """
    title = serializers.CharField(max_length=200, allow_blank=False)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    file = serializers.FileField()

    def validate_file(self, value):
        name = value.name or ""
        ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
        if ext not in ALLOWED_MATERIAL_EXTENSIONS:
            allowed = ", ".join(sorted(ALLOWED_MATERIAL_EXTENSIONS))
            raise serializers.ValidationError(
                f"File type '.{ext}' is not allowed. Allowed: {allowed}."
            )
        if value.size > MAX_MATERIAL_FILE_SIZE:
            raise serializers.ValidationError(
                f"File is too large ({value.size // (1024*1024)} MB). "
                f"Max is {MAX_MATERIAL_FILE_SIZE // (1024*1024)} MB."
            )
        return value


class MaterialUpdateSerializer(serializers.Serializer):
    """
    Write payload for PATCH /api/v1/materials/{id}/.
    File replacement is intentionally NOT supported here -- use
    DELETE + re-upload.
    """
    title = serializers.CharField(max_length=200, allow_blank=False, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
