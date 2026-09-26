from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import RefreshToken, StudentAttendance, TeacherAttendance, User
from classes.models import ClassCourse, StudentEnrollment
from core.models import AuditLog
from institutions.models import Institution

from .permissions import IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser

from .serializers import (
    AdminCourseReadSerializer,
    AdminCourseWriteSerializer,
    AdminEnrollmentSerializer,
    AdminRefreshTokenSerializer,
    AdminStatsSerializer,
    AdminUserCreateSerializer,
    AdminUserSerializer,
    AdminUserToggleActiveSerializer,
    AdminUserUpdateSerializer,
    AuditLogSerializer,
    StudentAttendanceSerializer,
    TeacherAttendanceSerializer,
)



class AdminTeacherAttendanceViewSet(viewsets.GenericViewSet):

    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    def get_queryset(self):
        user = self.request.user
        qs = TeacherAttendance.objects.all().select_related("teacher", "institution")

        if not user.is_superuser:
            qs = qs.filter(institution=user.institution)

        date_str = self.request.query_params.get("date")
        if date_str:
            qs = qs.filter(date=date_str)
        else:
            qs = qs.filter(date=timezone.localdate())

        status_filter = self.request.query_params.get("status")
        if status_filter in {TeacherAttendance.STATUS_PRESENT}:
            qs = qs.filter(status=status_filter)

        institution_id = self.request.query_params.get("institution")
        if institution_id and user.is_superuser:
            qs = qs.filter(institution_id=institution_id)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(teacher__email__icontains=q)
                | Q(teacher__first_name__icontains=q)
                | Q(teacher__last_name__icontains=q)
            )

        return qs.order_by("-date", "-first_seen_at")

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = TeacherAttendanceSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(TeacherAttendanceSerializer(qs, many=True).data)


class AdminStudentAttendanceViewSet(viewsets.GenericViewSet):

    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    def get_queryset(self):
        user = self.request.user
        qs = (
            StudentAttendance.objects.all()
            .select_related("student", "class_course", "class_course__teacher", "institution")
        )

        if not user.is_superuser:
            qs = qs.filter(institution=user.institution)

        date_str = self.request.query_params.get("date")
        if date_str:
            qs = qs.filter(date=date_str)
        else:
            qs = qs.filter(date=timezone.localdate())

        status_filter = self.request.query_params.get("status")
        if status_filter in {StudentAttendance.STATUS_PRESENT}:
            qs = qs.filter(status=status_filter)

        class_id = self.request.query_params.get("class_id")
        if class_id:
            qs = qs.filter(class_course_id=class_id)

        student_id = self.request.query_params.get("student_id")
        if student_id:
            qs = qs.filter(student_id=student_id)

        institution_id = self.request.query_params.get("institution")
        if institution_id and user.is_superuser:
            qs = qs.filter(institution_id=institution_id)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(student__email__icontains=q)
                | Q(student__first_name__icontains=q)
                | Q(student__last_name__icontains=q)
                | Q(class_course__name__icontains=q)
                | Q(class_course__subject__icontains=q)
            )

        return qs.order_by("-date", "-joined_at")

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = StudentAttendanceSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(StudentAttendanceSerializer(qs, many=True).data)
    

class AdminEnrollmentViewSet(viewsets.GenericViewSet):

    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    def get_queryset(self):
        user = self.request.user
        qs = (
            StudentEnrollment.objects.all()
            .select_related("student", "class_course", "class_course__teacher")
            .order_by("-created_at")
        )

        if not user.is_superuser:
            qs = qs.filter(class_course__institution=user.institution)

        status_filter = self.request.query_params.get("status")
        if status_filter in {
            StudentEnrollment.STATUS_ACTIVE,
            StudentEnrollment.STATUS_PENDING,
            StudentEnrollment.STATUS_BLOCKED,
            StudentEnrollment.STATUS_REMOVED,
        }:
            qs = qs.filter(status=status_filter)

        class_id = self.request.query_params.get("class_id")
        if class_id:
            qs = qs.filter(class_course_id=class_id)

        student_id = self.request.query_params.get("student_id")
        if student_id:
            qs = qs.filter(student_id=student_id)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(student__email__icontains=q)
                | Q(student__first_name__icontains=q)
                | Q(student__last_name__icontains=q)
                | Q(class_course__name__icontains=q)
                | Q(class_course__subject__icontains=q)
            )

        return qs

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = AdminEnrollmentSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(AdminEnrollmentSerializer(qs, many=True).data)



class AdminUserViewSet(viewsets.GenericViewSet):

    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    # ------------------------------------------------------------------ queryset

    def _scope_queryset(self, qs):
        """Apply the institution isolation rule to any queryset."""
        user = self.request.user
        if user.is_superuser:
            return qs
        return qs.filter(institution=user.institution)

    def get_queryset(self):
        qs = User.objects.all().select_related("institution").order_by("-created_at")
        qs = self._scope_queryset(qs)

        role = self.request.query_params.get("role")
        if role in {User.ROLE_TEACHER, User.ROLE_STUDENT, User.ROLE_ADMIN}:
            qs = qs.filter(role=role)

        active = self.request.query_params.get("is_active")
        if active is not None:
            active_bool = active.lower() in {"true", "1", "yes"}
            qs = qs.filter(is_active=active_bool)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(email__icontains=q)
                | Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
            )

        return qs

    def get_object(self):
        """Retrieve a single user, respecting isolation."""
        pk = self.kwargs["pk"]
        qs = self._scope_queryset(User.objects.all())
        try:
            return qs.get(pk=pk)
        except User.DoesNotExist:
            from rest_framework.exceptions import NotFound

            raise NotFound("User not found.")

    # ------------------------------------------------------------------ read

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = AdminUserSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(AdminUserSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        user = self.get_object()
        return Response(AdminUserSerializer(user).data)

    # ------------------------------------------------------------------ write

    def create(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if user.is_superuser:
            institution_id = request.data.get("institution_id")
            if institution_id:
                try:
                    institution = Institution.objects.get(pk=institution_id)
                except Institution.DoesNotExist:
                    return Response(
                        {"error": {"detail": "institution_id does not match any institution.", "status_code": 400}},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                institution = None  
        else:
            institution = user.institution

        new_user = User.objects.create_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            first_name=serializer.validated_data.get("first_name", ""),
            last_name=serializer.validated_data.get("last_name", ""),
            role=serializer.validated_data["role"],
            institution=institution,
        )

        return Response(AdminUserSerializer(new_user).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        user = self.get_object()
        serializer = AdminUserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        for field in ("first_name", "last_name"):
            if field in serializer.validated_data:
                setattr(user, field, serializer.validated_data[field])
        user.save(update_fields=["first_name", "last_name", "updated_at"])

        return Response(AdminUserSerializer(user).data)

    @action(detail=True, methods=["post"], url_path="toggle-active")
    def toggle_active(self, request, pk=None):
        user = self.get_object()


        if user.id == request.user.id:
            return Response(
                {"error": {"detail": "You cannot change your own active status.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AdminUserToggleActiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user.is_active = serializer.validated_data["is_active"]
        user.save(update_fields=["is_active", "updated_at"])
        return Response(AdminUserSerializer(user).data)

     # ------------------------------------------------------------------ relations

    @action(detail=True, methods=["get"], url_path="classes")
    def classes(self, request, pk=None):

        user = self.get_object()

        if user.role != User.ROLE_TEACHER:
            return Response(
                {
                    "error": {
                        "detail": "This user is not a teacher.",
                        "status_code": 400,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = (
            ClassCourse.objects.filter(teacher=user)
            .select_related("institution")
            .annotate(student_count=Count("enrollments"))
            .order_by("-created_at")
        )

        data = [
            {
                "id": str(c.id),
                "name": c.name,
                "subject": c.subject,
                "description": c.description,
                "is_archived": c.is_archived,
                "student_count": c.student_count,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in qs
        ]
        return Response({"results": data, "count": len(data)})

    @action(detail=True, methods=["get"], url_path="enrollments")
    def enrollments(self, request, pk=None):
        user = self.get_object()

        if user.role != User.ROLE_STUDENT:
            return Response(
                {
                    "error": {
                        "detail": "This user is not a student.",
                        "status_code": 400,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = (
            StudentEnrollment.objects.filter(student=user)
            .select_related("class_course", "class_course__teacher")
            .order_by("-created_at")
        )

        data = [
            {
                "id": str(e.id),
                "status": e.status,
                "joined_at": e.joined_at.isoformat() if e.joined_at else None,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "class_course": {
                    "id": str(e.class_course.id),
                    "name": e.class_course.name,
                    "subject": e.class_course.subject,
                    "is_archived": e.class_course.is_archived,
                    "teacher": {
                        "id": str(e.class_course.teacher.id),
                        "full_name": e.class_course.teacher.get_full_name(),
                        "email": e.class_course.teacher.email,
                    },
                },
            }
            for e in qs
        ]
        return Response({"results": data, "count": len(data)})


class AdminStatsView(APIView):

    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    def get(self, request):
        user = request.user

        users_qs = User.objects.all()
        classes_qs = ClassCourse.objects.all()
        enrollments_qs = StudentEnrollment.objects.all()

        if not user.is_superuser:
            users_qs = users_qs.filter(institution=user.institution)
            classes_qs = classes_qs.filter(institution=user.institution)
            enrollments_qs = enrollments_qs.filter(class_course__institution=user.institution)

        role_counts = users_qs.aggregate(
            users_total=Count("id"),
            users_teachers=Count("id", filter=Q(role=User.ROLE_TEACHER)),
            users_students=Count("id", filter=Q(role=User.ROLE_STUDENT)),
            users_admins=Count("id", filter=Q(role=User.ROLE_ADMIN)),
            users_inactive=Count("id", filter=Q(is_active=False)),
        )

        class_counts = classes_qs.aggregate(
            classes_total=Count("id"),
            classes_archived=Count("id", filter=Q(is_archived=True)),
        )

        enrollments_active = enrollments_qs.filter(
            status=StudentEnrollment.STATUS_ACTIVE
        ).count()

        payload = {
            **role_counts,
            **class_counts,
            "enrollments_active": enrollments_active,
            "institution": user.institution,
            "is_superuser_view": user.is_superuser,
        }
        return Response(AdminStatsSerializer(payload).data)
    


class AdminAuditLogViewSet(viewsets.GenericViewSet):

    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    def get_queryset(self):
        user = self.request.user
        qs = AuditLog.objects.all().select_related("actor", "institution")

        if not user.is_superuser:
            qs = qs.filter(institution=user.institution)

        action = self.request.query_params.get("action")
        if action:
            qs = qs.filter(action=action)

        resource_type = self.request.query_params.get("resource_type")
        if resource_type:
            qs = qs.filter(resource_type=resource_type)

        actor_id = self.request.query_params.get("actor_id")
        if actor_id:
            qs = qs.filter(actor_id=actor_id)

        since = self.request.query_params.get("since")
        if since:
            qs = qs.filter(occurred_at__gte=since)

        until = self.request.query_params.get("until")
        if until:
            qs = qs.filter(occurred_at__lte=until)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(action__icontains=q) | Q(resource_type__icontains=q))

        return qs.order_by("-occurred_at")

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = AuditLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(AuditLogSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"], url_path="actions")
    def actions(self, request):

        qs = self.get_queryset()
        actions = (
            qs.values_list("action", flat=True).distinct().order_by("action")
        )
        return Response({"results": list(actions)})
    



class AdminSessionViewSet(viewsets.GenericViewSet):

    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    def get_queryset(self):
        user = self.request.user
        qs = RefreshToken.objects.all().select_related("user")

        if not user.is_superuser:
            qs = qs.filter(user__institution=user.institution)

        user_id = self.request.query_params.get("user_id")
        if user_id:
            qs = qs.filter(user_id=user_id)

        status_filter = self.request.query_params.get("status")
        if status_filter == "active":
            qs = qs.filter(revoked_at__isnull=True, expires_at__gt=timezone.now())
        elif status_filter == "revoked":
            qs = qs.filter(revoked_at__isnull=False)
        elif status_filter == "expired":
            qs = qs.filter(revoked_at__isnull=True, expires_at__lte=timezone.now())

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(device_label__icontains=q)
                | Q(ip_address__icontains=q)
                | Q(user_agent__icontains=q)
                | Q(user__email__icontains=q)
            )

        return qs.order_by("-issued_at")

    def get_object(self):
        pk = self.kwargs["pk"]
        qs = self.get_queryset()
        try:
            return qs.get(pk=pk)
        except RefreshToken.DoesNotExist:
            raise NotFound("Session not found.")

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = AdminRefreshTokenSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(AdminRefreshTokenSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"], url_path="revoke")
    def revoke(self, request, pk=None):

        session = self.get_object()

        if session.revoked_at is None:
            session.revoked_at = timezone.now()
            session.revoked_reason = "admin_revoked"
            session.save(update_fields=["revoked_at", "revoked_reason"])

        return Response(AdminRefreshTokenSerializer(session).data)
            

class InstitutionCourseViewSet(viewsets.GenericViewSet):

    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    # ------------------------------------------------------------------ scope

    def _scope_queryset(self, qs):
        user = self.request.user
        if user.is_superuser:
            return qs
        return qs.filter(institution=user.institution)

    def get_queryset(self):
        qs = (
            ClassCourse.objects.all()
            .select_related("teacher", "institution")
            .order_by("-created_at")
        )
        qs = self._scope_queryset(qs)

        archived = self.request.query_params.get("is_archived")
        if archived is not None:
            qs = qs.filter(is_archived=archived.lower() in {"true", "1", "yes"})

        subject = self.request.query_params.get("subject")
        if subject:
            qs = qs.filter(subject__iexact=subject)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(subject__icontains=q))

        qs = qs.annotate(
            student_count=Count(
                "enrollments",
                filter=Q(enrollments__status=StudentEnrollment.STATUS_ACTIVE),
                distinct=True,
            )
        )
        return qs

    def get_object(self):
        pk = self.kwargs["pk"]
        qs = self._scope_queryset(
            ClassCourse.objects.all().select_related("teacher", "institution")
        )
        try:
            return qs.get(pk=pk)
        except ClassCourse.DoesNotExist:
            raise NotFound("Course not found.")

    # ------------------------------------------------------------------ read

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = AdminCourseReadSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(AdminCourseReadSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        course = self.get_object()
        return Response(AdminCourseReadSerializer(course).data)

    # ------------------------------------------------------------------ write

    def create(self, request):
        serializer = AdminCourseWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Required fields on create
        for field in ("name", "subject", "teacher_id"):
            if field not in data:
                return Response(
                    {
                        "error": {
                            "detail": f"{field} is required.",
                            "status_code": 400,
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        user = request.user
        if user.is_superuser:
            institution_id = request.data.get("institution_id")
            if not institution_id:
                return Response(
                    {
                        "error": {
                            "detail": "institution_id is required for superuser course creation.",
                            "status_code": 400,
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                institution = Institution.objects.get(pk=institution_id)
            except Institution.DoesNotExist:
                return Response(
                    {
                        "error": {
                            "detail": "institution_id does not match any institution.",
                            "status_code": 400,
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            institution = user.institution

        try:
            teacher = User.objects.get(pk=data["teacher_id"])
        except User.DoesNotExist:
            return Response(
                {
                    "error": {
                        "detail": "teacher_id does not match any user.",
                        "status_code": 400,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if teacher.role != User.ROLE_TEACHER:
            return Response(
                {
                    "error": {
                        "detail": "The specified user is not a teacher.",
                        "status_code": 400,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not user.is_superuser and teacher.institution_id != institution.id:
            return Response(
                {
                    "error": {
                        "detail": "The specified teacher is not in your institution.",
                        "status_code": 400,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        course = ClassCourse.objects.create(
            institution=institution,
            teacher=teacher,
            name=data["name"],
            subject=data["subject"],
            description=data.get("description", ""),
        )
        return Response(
            AdminCourseReadSerializer(course).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, pk=None):
        course = self.get_object()
        serializer = AdminCourseWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        for field in ("name", "subject", "description", "is_archived"):
            if field in serializer.validated_data:
                setattr(course, field, serializer.validated_data[field])
        course.save()

        return Response(AdminCourseReadSerializer(course).data)

    def destroy(self, request, pk=None):
        course = self.get_object()
        course.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    # ------------------------------------------------------------------ relations

    @action(detail=True, methods=["get"], url_path="students")
    def students(self, request, pk=None):

        course = self.get_object()

        qs = (
            StudentEnrollment.objects.filter(class_course=course)
            .select_related("student")
            .order_by("-created_at")
        )

        data = [
            {
                "id": str(e.id),
                "status": e.status,
                "joined_at": e.joined_at.isoformat() if e.joined_at else None,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "student": {
                    "id": str(e.student.id),
                    "full_name": e.student.get_full_name(),
                    "email": e.student.email,
                    "is_active": e.student.is_active,
                },
            }
            for e in qs
        ]
        return Response({"results": data, "count": len(data)})