from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsTeacher

from . import services
from .models import ClassCourse, StudentEnrollment
from .permissions import CanViewClass, IsClassOwner
from .serializers import (
    AddStudentSerializer,
    ClassCourseDetailSerializer,
    ClassCourseSerializer,
    EnrollmentStatusUpdateSerializer,
    JoinClassSerializer,
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

    def get_queryset(self):
        user = self.request.user
        if user.role == "teacher":
            return ClassCourse.objects.filter(teacher=user)
        if user.role == "student":
            return ClassCourse.objects.filter(
                enrollments__student=user,
                enrollments__status=StudentEnrollment.STATUS_ACTIVE,
            ).distinct()
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
        input_serializer = AddStudentSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        enrollment, created = services.add_student_to_class(
            class_course=class_course, **input_serializer.validated_data
        )
        output = StudentEnrollmentSerializer(enrollment)
        return Response(output.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


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
