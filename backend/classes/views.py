import mimetypes

from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsTeacher

from . import services
from .models import Announcement, ClassCourse, Material, StudentEnrollment
from .permissions import CanViewClass, IsClassOwner
from .serializers import (
    AddStudentSerializer,
    ClassCourseDetailSerializer,
    ClassCourseSerializer,
    EnrollmentStatusUpdateSerializer,
    JoinClassSerializer,
    MaterialSerializer,
    MaterialUpdateSerializer,
    MaterialUploadSerializer,
    StudentEnrollmentSerializer,
)


class ClassCourseListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/classes/  — teachers see classes they teach; students see
                              classes they're actively enrolled in.
    POST /api/v1/classes/  — teacher-only, creates a class.
    """

    serializer_class = ClassCourseSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsTeacher()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        """
        Create the class and, if a grade is attached, auto-enroll all
        students of that grade. The count is stashed on `self.request`
        so the serializer can surface it in the response.
        """
        instance = serializer.save()
        try:
            enrolled = services.auto_enroll_class_into_grade(instance)
            self.request._auto_enrolled_count = enrolled
        except Exception as exc:  # pragma: no cover — best-effort
            import logging
            logging.getLogger(__name__).exception(
                "auto-enroll failed for class %s: %s", instance.id, exc
            )

    def get_queryset(self):
        user = self.request.user
        if user.role == "teacher":
            return ClassCourse.objects.filter(teacher=user)
        if user.role == "student":
            return ClassCourse.objects.filter(
                enrollments__student=user,
                enrollments__status=StudentEnrollment.STATUS_ACTIVE,
            ).distinct()
        if user.role == "admin":
            qs = ClassCourse.objects.all()
            # Scope to the admin's own institution
            if getattr(user, "institution_id", None):
                qs = qs.filter(institution_id=user.institution_id)
            # Hide archived by default; ?include_archived=1 to show
            include_archived = self.request.query_params.get("include_archived")
            if include_archived not in ("1", "true", "yes"):
                qs = qs.filter(is_archived=False)
            teacher_id = self.request.query_params.get("teacher")
            if teacher_id:
                qs = qs.filter(teacher_id=teacher_id)
            return qs
        return ClassCourse.objects.none()


class ClassCourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/classes/{id}/  — teacher (owner) or enrolled student.
    PATCH  /api/v1/classes/{id}/  — teacher (owner) only.
    DELETE /api/v1/classes/{id}/  — teacher (owner) only; SOFT deletes
                                     (is_deleted=True), never a hard delete,
                                     so linked materials/exams/grades survive.
    """

    queryset = ClassCourse.objects.all()
    serializer_class = ClassCourseDetailSerializer
    lookup_field = "id"

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated(), CanViewClass()]
        return [permissions.IsAuthenticated(), IsTeacher(), IsClassOwner()]

    def perform_destroy(self, instance):
        instance.soft_delete()


class ClassStudentsView(APIView):
    """
    GET  /api/v1/classes/{id}/students/  — teacher-only roster view.
    POST /api/v1/classes/{id}/students/  — teacher adds a student; auto-
                                            generates their joining code.
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get_class(self, class_id, user):
        class_course = get_object_or_404(ClassCourse, id=class_id)
        if class_course.teacher_id != user.id:
            self.permission_denied(self.request, message="You are not the teacher assigned to this class.")
        return class_course

    def get(self, request, class_id):
        class_course = self.get_class(class_id, request.user)
        enrollments = class_course.enrollments.select_related("student").order_by("-created_at")
        serializer = StudentEnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

    def post(self, request, class_id):
        class_course = self.get_class(class_id, request.user)
        input_serializer = AddStudentSerializer(
            data=request.data,
            context={"request": request},
        )
        input_serializer.is_valid(raise_exception=True)

        # `grade_id` in the serializer validates to a Grade instance
        validated = input_serializer.validated_data
        grade = validated.pop("grade_id", None)

        enrollment, created = services.add_student_to_class(
            class_course=class_course,
            grade=grade,
            **validated,
        )
        output = StudentEnrollmentSerializer(enrollment)
        return Response(
            output.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ClassStudentDetailView(APIView):
    """
    PATCH /api/v1/classes/{id}/students/{enrollment_id}/
    Body: { "status": "blocked" | "removed" | "active" }
    Teacher-only. Used to block or remove a student from the roster (or
    reactivate a previously blocked one).
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def patch(self, request, class_id, enrollment_id):
        enrollment = get_object_or_404(
            StudentEnrollment, id=enrollment_id, class_course_id=class_id
        )
        if enrollment.class_course.teacher_id != request.user.id:
            self.permission_denied(request, message="You are not the teacher assigned to this class.")

        serializer = EnrollmentStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        enrollment.status = serializer.validated_data["status"]
        enrollment.save(update_fields=["status"])

        return Response(StudentEnrollmentSerializer(enrollment).data)


class JoinClassView(APIView):
    """
    POST /api/v1/enrollments/join/
    Body: { "joining_code": "PHY10X" }
    Student-only. Redeems a joining code issued by a teacher.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != "student":
            return Response(
                {"detail": "Only students can join a class with a code."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = JoinClassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            enrollment = services.join_class_with_code(
                student=request.user,
                joining_code=serializer.validated_data["joining_code"],
            )
        except StudentEnrollment.DoesNotExist:
            return Response({"detail": "Invalid joining code."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "class_course": ClassCourseSerializer(enrollment.class_course).data,
                "status": enrollment.status,
            }
        )


class ClassMaterialsView(APIView):
    """
    GET  /api/v1/classes/{class_id}/materials/
        -- teacher (owner) or actively enrolled student.
    POST /api/v1/classes/{class_id}/materials/
        -- teacher (owner) only. Accepts multipart/form-data with
           title, optional description, and a file.
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _resolve_class(self, class_id, user, *, for_write):
        class_course = get_object_or_404(ClassCourse, id=class_id)

        if for_write:
            if user.role != "teacher" or class_course.teacher_id != user.id:
                self.permission_denied(
                    self.request,
                    message="You are not the teacher assigned to this class.",
                )
            return class_course

        if user.role == "teacher" and class_course.teacher_id == user.id:
            return class_course
        if user.role == "student" and class_course.enrollments.filter(
            student_id=user.id, status=StudentEnrollment.STATUS_ACTIVE
        ).exists():
            return class_course

        self.permission_denied(
            self.request, message="You do not have access to this class."
        )

    def get(self, request, class_id):
        class_course = self._resolve_class(class_id, request.user, for_write=False)
        materials = class_course.materials.select_related("uploaded_by").order_by(
            "-created_at"
        )
        serializer = MaterialSerializer(
            materials, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request, class_id):
        class_course = self._resolve_class(class_id, request.user, for_write=True)

        input_serializer = MaterialUploadSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        data = input_serializer.validated_data

        file = data["file"]
        material = Material.objects.create(
            class_course=class_course,
            uploaded_by=request.user,
            title=data["title"],
            description=data.get("description", ""),
            file=file,
            file_name=file.name,
            file_size=file.size,
            mime_type=mimetypes.guess_type(file.name)[0] or "application/octet-stream",
        )

        return Response(
            MaterialSerializer(material, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MaterialDetailView(APIView):
    """
    GET    /api/v1/materials/{id}/  -- teacher (owner) or enrolled student.
    PATCH  /api/v1/materials/{id}/  -- teacher (owner) only, title/description.
    DELETE /api/v1/materials/{id}/  -- teacher (owner) only, soft delete.
    """

    permission_classes = [permissions.IsAuthenticated]

    def _resolve_for_read(self, material_id, user):
        material = get_object_or_404(Material, id=material_id)

        if user.role == "teacher" and material.class_course.teacher_id == user.id:
            return material
        if user.role == "student" and material.class_course.enrollments.filter(
            student_id=user.id, status=StudentEnrollment.STATUS_ACTIVE
        ).exists():
            return material

        self.permission_denied(
            self.request, message="You do not have access to this material."
        )

    def _resolve_for_write(self, material_id, user):
        material = get_object_or_404(Material, id=material_id)
        if material.class_course.teacher_id != user.id:
            self.permission_denied(
                self.request,
                message="You are not the teacher assigned to this class.",
            )
        return material

    def get(self, request, material_id):
        material = self._resolve_for_read(material_id, request.user)
        return Response(
            MaterialSerializer(material, context={"request": request}).data
        )

    def patch(self, request, material_id):
        material = self._resolve_for_write(material_id, request.user)

        serializer = MaterialUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        update_fields = []
        if "title" in data:
            material.title = data["title"]
            update_fields.append("title")
        if "description" in data:
            material.description = data["description"]
            update_fields.append("description")

        if update_fields:
            update_fields.append("updated_at")
            material.save(update_fields=update_fields)

        return Response(
            MaterialSerializer(material, context={"request": request}).data
        )

    def delete(self, request, material_id):
        material = self._resolve_for_write(material_id, request.user)
        material.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# ---------------------------------------------------------------- material list


class MaterialListView(APIView):
    """
    GET /api/v1/materials/

    Cross-class material feed for the current user.

    - teacher: all materials across classes they teach
    - student: all materials from classes they're actively enrolled in
    - admin:   403 (use /admin/ views instead)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = (
            Material.objects
            .select_related("uploaded_by", "class_course")
            .order_by("-created_at")
        )

        if user.role == "teacher":
            qs = qs.filter(class_course__teacher=user)
        elif user.role == "student":
            enrolled_ids = StudentEnrollment.objects.filter(
                student=user,
                status=StudentEnrollment.STATUS_ACTIVE,
            ).values_list("class_course_id", flat=True)
            qs = qs.filter(class_course_id__in=enrolled_ids)
        else:
            return Response(
                {"detail": "Only teachers and students can list materials."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Optional filter by class
        class_id = request.query_params.get("class_course")
        if class_id:
            qs = qs.filter(class_course_id=class_id)

        # Optional search on title / description / filename
        q = request.query_params.get("q")
        if q:
            from django.db.models import Q
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(description__icontains=q)
                | Q(file_name__icontains=q)
            )

        serializer = MaterialSerializer(
            qs, many=True, context={"request": request}
        )
        return Response({
            "count": qs.count(),
            "results": serializer.data,
        })


# ============================================================
# Announcements — teacher CRUD
# ============================================================

class TeacherAnnouncementsViewSet(viewsets.GenericViewSet):
    """
    Teacher-authored announcements.

    GET    /api/v1/teacher/announcements/            — list own
    POST   /api/v1/teacher/announcements/            — create
    GET    /api/v1/teacher/announcements/<id>/       — retrieve
    PATCH  /api/v1/teacher/announcements/<id>/       — update
    DELETE /api/v1/teacher/announcements/<id>/       — delete
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", None) != "teacher":
            return Announcement.objects.none()
        qs = Announcement.objects.filter(teacher=user).select_related(
            "class_course", "teacher"
        )
        class_id = self.request.query_params.get("class_course")
        if class_id:
            qs = qs.filter(class_course_id=class_id)
        return qs.order_by("-created_at")

    def _serialize(self, obj):
        return {
            "id": str(obj.id),
            "title": obj.title,
            "body": obj.body,
            "is_published": obj.is_published,
            "published_at": obj.published_at.isoformat() if obj.published_at else None,
            "created_at": obj.created_at.isoformat(),
            "updated_at": obj.updated_at.isoformat(),
            "class_course": str(obj.class_course_id) if obj.class_course_id else None,
            "class_name": obj.class_course.name if obj.class_course else None,
            "teacher_id": str(obj.teacher_id),
            "teacher_name": (
                f"{obj.teacher.first_name or ''} {obj.teacher.last_name or ''}".strip()
                or obj.teacher.email
            ),
        }

    def list(self, request):
        if getattr(request.user, "role", None) != "teacher":
            return Response(
                {"detail": "Teacher access only."},
                status=status.HTTP_403_FORBIDDEN,
            )
        qs = self.get_queryset()
        return Response({"count": qs.count(), "results": [self._serialize(a) for a in qs]})

    def retrieve(self, request, pk=None):
        try:
            obj = self.get_queryset().get(pk=pk)
        except Announcement.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self._serialize(obj))

    def create(self, request):
        if getattr(request.user, "role", None) != "teacher":
            return Response(
                {"detail": "Teacher access only."},
                status=status.HTTP_403_FORBIDDEN,
            )
        title = (request.data.get("title") or "").strip()
        body = (request.data.get("body") or "").strip()
        class_course_id = request.data.get("class_course") or None
        is_published = bool(request.data.get("is_published", True))

        if not title or not body:
            return Response(
                {"detail": "Both title and body are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate class belongs to this teacher
        cls = None
        if class_course_id:
            try:
                cls = ClassCourse.objects.get(id=class_course_id, teacher=request.user)
            except ClassCourse.DoesNotExist:
                return Response(
                    {"detail": "Class not found or not yours."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        from django.utils import timezone as _tz
        obj = Announcement.objects.create(
            teacher=request.user,
            institution=getattr(request.user, "institution", None),
            class_course=cls,
            title=title,
            body=body,
            is_published=is_published,
            published_at=_tz.now() if is_published else None,
        )
        return Response(self._serialize(obj), status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        try:
            obj = self.get_queryset().get(pk=pk)
        except Announcement.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if "title" in request.data:
            title = (request.data.get("title") or "").strip()
            if not title:
                return Response(
                    {"detail": "Title cannot be empty."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            obj.title = title
        if "body" in request.data:
            body = (request.data.get("body") or "").strip()
            if not body:
                return Response(
                    {"detail": "Body cannot be empty."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            obj.body = body
        if "class_course" in request.data:
            cid = request.data.get("class_course") or None
            if cid:
                try:
                    obj.class_course = ClassCourse.objects.get(id=cid, teacher=request.user)
                except ClassCourse.DoesNotExist:
                    return Response(
                        {"detail": "Class not found or not yours."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                obj.class_course = None
        if "is_published" in request.data:
            obj.is_published = bool(request.data.get("is_published"))
            from django.utils import timezone as _tz
            obj.published_at = _tz.now() if obj.is_published else None

        obj.save()
        return Response(self._serialize(obj))

    def destroy(self, request, pk=None):
        try:
            obj = self.get_queryset().get(pk=pk)
        except Announcement.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

