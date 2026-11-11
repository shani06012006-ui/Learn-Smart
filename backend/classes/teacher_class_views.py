# backend/classes/teacher_class_views.py
"""
Teacher class CRUD.

  GET     /api/v1/teacher/classes/            list the teacher's classes (archived included)
  POST    /api/v1/teacher/classes/            create a class the teacher teaches
  GET     /api/v1/teacher/classes/<id>/       read one class
  PATCH   /api/v1/teacher/classes/<id>/       edit, archive, or restore
  DELETE  /api/v1/teacher/classes/<id>/       delete (soft delete, keeps history)

Only the teacher who owns a class can read or change it.
"""
from django.db.models import Count, Q
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from admin_api.serializers import AdminCourseReadSerializer
from institutions.models import Grade
from .models import ClassCourse, StudentEnrollment


def _teacher_only(user):
    if getattr(user, "role", None) != User.ROLE_TEACHER:
        return Response(
            {"detail": "Only teachers can manage classes."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


def _teacher_classes(user):
    return (
        ClassCourse.objects.filter(teacher=user)
        .select_related("teacher", "institution", "grade")
        .annotate(
            student_count=Count(
                "enrollments",
                filter=Q(enrollments__status=StudentEnrollment.STATUS_ACTIVE),
                distinct=True,
            )
        )
        .order_by("-created_at")
    )


class TeacherClassWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    subject = serializers.CharField(max_length=100)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    grade_id = serializers.UUIDField(required=False, allow_null=True)
    is_archived = serializers.BooleanField(required=False)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Give the class a name.")
        return value

    def validate_subject(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Add a subject.")
        return value

    def validate_grade_id(self, value):
        if value is None:
            return None
        institution = self.context["institution"]
        grade = Grade.objects.filter(pk=value, institution=institution).first()
        if grade is None:
            raise serializers.ValidationError("Unknown grade for your institution.")
        return grade


class TeacherClassListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        denied = _teacher_only(request.user)
        if denied is not None:
            return denied
        qs = _teacher_classes(request.user)
        return Response({
            "count": qs.count(),
            "results": AdminCourseReadSerializer(qs, many=True).data,
        })

    def post(self, request):
        user = request.user
        denied = _teacher_only(user)
        if denied is not None:
            return denied
        if not user.institution_id:
            return Response(
                {"detail": "Your account is not linked to an institution."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ser = TeacherClassWriteSerializer(
            data=request.data,
            context={"institution": user.institution},
        )
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        course = ClassCourse.objects.create(
            institution=user.institution,
            teacher=user,
            name=data["name"],
            subject=data["subject"],
            description=data.get("description", ""),
            grade=data.get("grade_id"),
        )
        created = _teacher_classes(user).get(pk=course.pk)
        return Response(AdminCourseReadSerializer(created).data, status=status.HTTP_201_CREATED)


class TeacherClassDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _owned(self, user, pk):
        return ClassCourse.objects.filter(pk=pk, teacher=user).first()

    def get(self, request, pk):
        denied = _teacher_only(request.user)
        if denied is not None:
            return denied
        course = _teacher_classes(request.user).filter(pk=pk).first()
        if course is None:
            return Response({"detail": "Class not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminCourseReadSerializer(course).data)

    def patch(self, request, pk):
        user = request.user
        denied = _teacher_only(user)
        if denied is not None:
            return denied
        course = self._owned(user, pk)
        if course is None:
            return Response({"detail": "Class not found."}, status=status.HTTP_404_NOT_FOUND)

        ser = TeacherClassWriteSerializer(
            data=request.data,
            partial=True,
            context={"institution": user.institution},
        )
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        for field in ("name", "subject", "description", "is_archived"):
            if field in data:
                setattr(course, field, data[field])
        if "grade_id" in data:
            course.grade = data["grade_id"]
        course.save()

        updated = _teacher_classes(user).get(pk=course.pk)
        return Response(AdminCourseReadSerializer(updated).data)

    def delete(self, request, pk):
        user = request.user
        denied = _teacher_only(user)
        if denied is not None:
            return denied
        course = self._owned(user, pk)
        if course is None:
            return Response({"detail": "Class not found."}, status=status.HTTP_404_NOT_FOUND)
        course.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)