from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import RefreshToken, StudentAttendance, TeacherAttendance, User
from classes.models import ClassCourse, LiveClass, StudentEnrollment, TimetableEntry
from core.models import AuditLog
from institutions.models import Institution
from core.audit import log_audit
from leaves.models import StudentLeave, TeacherLeave

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
    LeaveReviewSerializer,
    LiveClassReadSerializer,
    LiveClassWriteSerializer,
    StudentAttendanceSerializer,
    StudentLeaveReadSerializer,
    StudentLeaveWriteSerializer,
    TeacherAttendanceSerializer,
    TeacherLeaveReadSerializer,
    TeacherLeaveWriteSerializer,
    TimetableEntryReadSerializer,
    TimetableEntryWriteSerializer,
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


class AdminTimetableViewSet(viewsets.GenericViewSet):

    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    def _scope_queryset(self, qs):
        user = self.request.user
        if user.is_superuser:
            return qs
        return qs.filter(institution=user.institution)

    def get_queryset(self):
        qs = (
            TimetableEntry.objects.all()
            .select_related("class_course", "class_course__teacher", "teacher", "institution")
        )
        qs = self._scope_queryset(qs)

        teacher_id = self.request.query_params.get("teacher")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)

        class_id = self.request.query_params.get("class_id")
        if class_id:
            qs = qs.filter(class_course_id=class_id)

        day = self.request.query_params.get("day")
        if day is not None:
            try:
                day_int = int(day)
                if 0 <= day_int <= 6:
                    qs = qs.filter(day_of_week=day_int)
            except (TypeError, ValueError):
                pass

        institution_id = self.request.query_params.get("institution")
        user = self.request.user
        if institution_id and user.is_superuser:
            qs = qs.filter(institution_id=institution_id)

        active_param = self.request.query_params.get("active")
        if active_param is not None:
            active_bool = active_param.lower() in {"true", "1", "yes"}
            qs = qs.filter(is_active=active_bool)
        else:
            qs = qs.filter(is_active=True)

        return qs.order_by("day_of_week", "start_time")

    def get_object(self):
        pk = self.kwargs["pk"]
        qs = self._scope_queryset(TimetableEntry.objects.all())
        try:
            return qs.get(pk=pk)
        except TimetableEntry.DoesNotExist:
            raise NotFound("Timetable entry not found.")

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = TimetableEntryReadSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(TimetableEntryReadSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        entry = self.get_object()
        return Response(TimetableEntryReadSerializer(entry).data)

    def create(self, request):
        from core.audit import log_audit  # lazy import — avoids circular
        from classes.services import materialize_upcoming_sessions

        serializer = TimetableEntryWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        course = data["_course"]
        user = request.user

        if not user.is_superuser and course.institution_id != user.institution_id:
            return Response(
                {
                    "error": {
                        "detail": "Class is not in your institution.",
                        "status_code": 400,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.check_conflicts(
            course=course,
            day=data["day_of_week"],
            start=data["start_time"],
            end=data["end_time"],
            room=data.get("room", ""),
        )

        entry = TimetableEntry.objects.create(
            institution=course.institution,
            class_course=course,
            teacher=course.teacher,
            day_of_week=data["day_of_week"],
            start_time=data["start_time"],
            end_time=data["end_time"],
            room=data.get("room", ""),
            is_active=data.get("is_active", True),
        )

        log_audit(
            action="timetable.created",
            request=request,
            institution=course.institution,
            resource_type="timetable",
            resource_id=entry.id,
            metadata={
                "class_id": str(course.id),
                "day": entry.day_of_week,
                "start": entry.start_time.isoformat(),
                "end": entry.end_time.isoformat(),
                "room": entry.room,
            },
        )

        materialize_upcoming_sessions(entry)

        return Response(
            TimetableEntryReadSerializer(entry).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, pk=None):
        from core.audit import log_audit
        from classes.services import regenerate_future_sessions

        entry = self.get_object()
        serializer = TimetableEntryWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        new_course = data.get("_course", entry.class_course)
        new_day = data.get("day_of_week", entry.day_of_week)
        new_start = data.get("start_time", entry.start_time)
        new_end = data.get("end_time", entry.end_time)
        new_room = data.get("room", entry.room)
        new_active = data.get("is_active", entry.is_active)

        if new_end <= new_start:
            return Response(
                {
                    "error": {
                        "detail": "End time must be after start time.",
                        "status_code": 400,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        if not user.is_superuser and new_course.institution_id != user.institution_id:
            return Response(
                {
                    "error": {
                        "detail": "Class is not in your institution.",
                        "status_code": 400,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.check_conflicts(
            course=new_course,
            day=new_day,
            start=new_start,
            end=new_end,
            room=new_room,
            exclude_id=entry.id,
        )

        entry.class_course = new_course
        entry.teacher = new_course.teacher
        entry.institution = new_course.institution
        entry.day_of_week = new_day
        entry.start_time = new_start
        entry.end_time = new_end
        entry.room = new_room
        entry.is_active = new_active
        entry.save()

        log_audit(
            action="timetable.updated",
            request=request,
            institution=entry.institution,
            resource_type="timetable",
            resource_id=entry.id,
            metadata={
                "class_id": str(entry.class_course_id),
                "day": entry.day_of_week,
                "start": entry.start_time.isoformat(),
                "end": entry.end_time.isoformat(),
                "room": entry.room,
                "is_active": entry.is_active,
            },
        )

        regenerate_future_sessions(entry)

        return Response(TimetableEntryReadSerializer(entry).data)

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        """Soft-delete: flip is_active=False. Idempotent."""
        from core.audit import log_audit
        from classes.services import cancel_future_sessions

        entry = self.get_object()

        if entry.is_active:
            entry.is_active = False
            entry.save(update_fields=["is_active", "updated_at"])

            # Cancel upcoming LiveClass sessions for this slot.
            cancel_future_sessions(entry)

            log_audit(
                action="timetable.deleted",
                request=request,
                institution=entry.institution,
                resource_type="timetable",
                resource_id=entry.id,
                metadata={"class_id": str(entry.class_course_id)},
            )

        return Response(TimetableEntryReadSerializer(entry).data)


class TimetableView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = (
            TimetableEntry.objects.all()
            .select_related("class_course", "class_course__teacher", "teacher", "institution")
        )

        if user.role == "teacher":
            qs = qs.filter(teacher=user)
        elif user.role == "student":
            enrolled_class_ids = StudentEnrollment.objects.filter(
                student=user,
                status=StudentEnrollment.STATUS_ACTIVE,
            ).values_list("class_course_id", flat=True)
            qs = qs.filter(class_course_id__in=enrolled_class_ids)
        else:
            return Response(
                {"detail": "Use /admin/timetable/ for admin access."},
                status=status.HTTP_403_FORBIDDEN,
            )

        day = request.query_params.get("day")
        if day is not None:
            try:
                day_int = int(day)
                if 0 <= day_int <= 6:
                    qs = qs.filter(day_of_week=day_int)
            except (TypeError, ValueError):
                pass

        active_param = request.query_params.get("active")
        if active_param is not None:
            active_bool = active_param.lower() in {"true", "1", "yes"}
            qs = qs.filter(is_active=active_bool)
        else:
            qs = qs.filter(is_active=True)

        qs = qs.order_by("day_of_week", "start_time")
        return Response(TimetableEntryReadSerializer(qs, many=True).data)
    


class AdminLiveClassViewSet(viewsets.GenericViewSet):
    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    def _scope_queryset(self, qs):
        user = self.request.user
        if user.is_superuser:
            return qs
        return qs.filter(institution=user.institution)

    def get_queryset(self):
        qs = (
            LiveClass.objects.all()
            .select_related(
                "timetable_entry",
                "class_course",
                "class_course__teacher",
                "teacher",
                "institution",
            )
        )
        qs = self._scope_queryset(qs)

        teacher_id = self.request.query_params.get("teacher")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)

        class_id = self.request.query_params.get("class_id")
        if class_id:
            qs = qs.filter(class_course_id=class_id)

        date_str = self.request.query_params.get("date")
        if date_str:
            qs = qs.filter(scheduled_date=date_str)

        from_str = self.request.query_params.get("from")
        if from_str:
            qs = qs.filter(scheduled_start__gte=from_str)

        to_str = self.request.query_params.get("to")
        if to_str:
            qs = qs.filter(scheduled_start__lte=to_str)

        status_filter = self.request.query_params.get("status")

        institution_id = self.request.query_params.get("institution")
        user = self.request.user
        if institution_id and user.is_superuser:
            qs = qs.filter(institution_id=institution_id)

        qs = qs.order_by("-scheduled_start")

        if status_filter in {
            LiveClass.STATUS_UPCOMING,
            LiveClass.STATUS_LIVE,
            LiveClass.STATUS_COMPLETED,
            LiveClass.STATUS_CANCELLED,
        }:
            # Filter in Python — status is derived.
            ids = [
                row.id
                for row in qs
                if row.computed_status() == status_filter
            ]
            qs = qs.filter(id__in=ids)

        return qs

    def get_object(self):
        pk = self.kwargs["pk"]
        qs = self._scope_queryset(LiveClass.objects.all())
        try:
            return qs.get(pk=pk)
        except LiveClass.DoesNotExist:
            raise NotFound("Live class not found.")

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = LiveClassReadSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(LiveClassReadSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        obj = self.get_object()
        return Response(LiveClassReadSerializer(obj).data)

    def partial_update(self, request, pk=None):
        obj = self.get_object()
        serializer = LiveClassWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        for field in ("room", "meeting_url", "recording_url", "stored_status"):
            if field in serializer.validated_data:
                setattr(obj, field, serializer.validated_data[field])
        obj.save()

        return Response(LiveClassReadSerializer(obj).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """Idempotent: set stored_status=cancelled."""
        from core.audit import log_audit

        obj = self.get_object()

        if obj.stored_status != LiveClass.STATUS_CANCELLED:
            obj.stored_status = LiveClass.STATUS_CANCELLED
            obj.save(update_fields=["stored_status", "updated_at"])

            log_audit(
                action="live_class.cancelled",
                request=request,
                institution=obj.institution,
                resource_type="live_class",
                resource_id=obj.id,
                metadata={
                    "class_id": str(obj.class_course_id),
                    "scheduled_date": obj.scheduled_date.isoformat(),
                },
            )

        return Response(LiveClassReadSerializer(obj).data)


class RoleAwareLiveClassView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = (
            LiveClass.objects.all()
            .select_related(
                "timetable_entry",
                "class_course",
                "class_course__teacher",
                "teacher",
                "institution",
            )
        )

        if user.role == "teacher":
            qs = qs.filter(teacher=user)
        elif user.role == "student":
            enrolled_class_ids = StudentEnrollment.objects.filter(
                student=user,
                status=StudentEnrollment.STATUS_ACTIVE,
            ).values_list("class_course_id", flat=True)
            qs = qs.filter(class_course_id__in=enrolled_class_ids)
        else:
            return Response(
                {"detail": "Use /admin/live-classes/ for admin access."},
                status=status.HTTP_403_FORBIDDEN,
            )

        class_id = request.query_params.get("class_id")
        if class_id:
            qs = qs.filter(class_course_id=class_id)

        from_str = request.query_params.get("from")
        if from_str:
            qs = qs.filter(scheduled_start__gte=from_str)

        to_str = request.query_params.get("to")
        if to_str:
            qs = qs.filter(scheduled_start__lte=to_str)

        qs = qs.order_by("scheduled_start")

        status_filter = request.query_params.get("status")
        if status_filter in {
            LiveClass.STATUS_UPCOMING,
            LiveClass.STATUS_LIVE,
            LiveClass.STATUS_COMPLETED,
            LiveClass.STATUS_CANCELLED,
        }:
            ids = [
                row.id
                for row in qs
                if row.computed_status() == status_filter
            ]
            qs = qs.filter(id__in=ids)

        return Response(LiveClassReadSerializer(qs, many=True).data)    
    


class AdminStudentLeaveViewSet(viewsets.GenericViewSet):

    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    def _scope_queryset(self, qs):
        user = self.request.user
        if user.is_superuser:
            return qs
        return qs.filter(institution=user.institution)

    def get_queryset(self):
        qs = (
            StudentLeave.objects.all()
            .select_related("student", "institution", "reviewer")
        )
        qs = self._scope_queryset(qs)

        status_filter = self.request.query_params.get("status")
        if status_filter in {
            StudentLeave.STATUS_PENDING,
            StudentLeave.STATUS_APPROVED,
            StudentLeave.STATUS_REJECTED,
            StudentLeave.STATUS_CANCELLED,
        }:
            qs = qs.filter(status=status_filter)

        leave_type = self.request.query_params.get("leave_type")
        if leave_type in {
            StudentLeave.LEAVE_SICK,
            StudentLeave.LEAVE_CASUAL,
            StudentLeave.LEAVE_VACATION,
            StudentLeave.LEAVE_OTHER,
        }:
            qs = qs.filter(leave_type=leave_type)

        student_id = self.request.query_params.get("student_id")
        if student_id:
            qs = qs.filter(student_id=student_id)

        from_str = self.request.query_params.get("from")
        if from_str:
            qs = qs.filter(start_date__gte=from_str)

        to_str = self.request.query_params.get("to")
        if to_str:
            qs = qs.filter(end_date__lte=to_str)

        institution_id = self.request.query_params.get("institution")
        user = self.request.user
        if institution_id and user.is_superuser:
            qs = qs.filter(institution_id=institution_id)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(student__email__icontains=q)
                | Q(student__first_name__icontains=q)
                | Q(student__last_name__icontains=q)
                | Q(reason__icontains=q)
            )

        return qs.order_by("-applied_at")

    def get_object(self):
        pk = self.kwargs["pk"]
        qs = self._scope_queryset(StudentLeave.objects.all())
        try:
            return qs.get(pk=pk)
        except StudentLeave.DoesNotExist:
            raise NotFound("Leave not found.")

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = StudentLeaveReadSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(StudentLeaveReadSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        obj = self.get_object()
        return Response(StudentLeaveReadSerializer(obj).data)

    def create(self, request):
        serializer = StudentLeaveWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        if user.is_superuser:
            institution = None  # resolved below from the student
            student = getattr(serializer, "_student", None)
            if student is None:
                return Response(
                    {"error": {"detail": "student_id is required.", "status_code": 400}},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            institution = student.institution
        else:
            student = getattr(serializer, "_student", None)
            if student is None:
                return Response(
                    {"error": {"detail": "student_id is required.", "status_code": 400}},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if student.institution_id != user.institution_id:
                return Response(
                    {"error": {"detail": "Student is not in your institution.", "status_code": 400}},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            institution = user.institution

        # Overlap check (before create).
        serializer.check_overlap(
            StudentLeave,
            "student",
            student.id,
            data["start_date"],
            data["end_date"],
        )

        leave = StudentLeave.objects.create(
            institution=institution,
            student=student,
            leave_type=data["leave_type"],
            start_date=data["start_date"],
            end_date=data["end_date"],
            reason=data.get("reason", ""),
        )

        log_audit(
            action="leave.created",
            request=request,
            institution=institution,
            resource_type="student_leave",
            resource_id=leave.id,
            metadata={
                "student_id": str(student.id),
                "leave_type": leave.leave_type,
                "start_date": leave.start_date.isoformat(),
                "end_date": leave.end_date.isoformat(),
                "days": leave.days,
            },
        )

        return Response(
            StudentLeaveReadSerializer(leave).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, pk=None):
        leave = self.get_object()
        if leave.status != StudentLeave.STATUS_PENDING:
            return Response(
                {"error": {"detail": "Only pending leaves can be edited.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = StudentLeaveWriteSerializer(data=request.data, partial=True, instance=leave)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        new_start = data.get("start_date", leave.start_date)
        new_end = data.get("end_date", leave.end_date)

        serializer.check_overlap(
            StudentLeave,
            "student",
            leave.student_id,
            new_start,
            new_end,
            exclude_id=leave.id,
        )

        for field in ("leave_type", "start_date", "end_date", "reason"):
            if field in data:
                setattr(leave, field, data[field])
        leave.save()

        log_audit(
            action="leave.updated",
            request=request,
            institution=leave.institution,
            resource_type="student_leave",
            resource_id=leave.id,
            metadata={"student_id": str(leave.student_id)},
        )

        return Response(StudentLeaveReadSerializer(leave).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != StudentLeave.STATUS_PENDING:
            return Response(
                {"error": {"detail": "Only pending leaves can be approved.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        leave.status = StudentLeave.STATUS_APPROVED
        leave.reviewed_at = timezone.now()
        leave.reviewer = request.user
        leave.admin_remarks = serializer.validated_data.get("admin_remarks", "")
        leave.save(update_fields=["status", "reviewed_at", "reviewer", "admin_remarks", "updated_at"])

        log_audit(
            action="leave.approved",
            request=request,
            institution=leave.institution,
            resource_type="student_leave",
            resource_id=leave.id,
            metadata={"student_id": str(leave.student_id)},
        )
        return Response(StudentLeaveReadSerializer(leave).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != StudentLeave.STATUS_PENDING:
            return Response(
                {"error": {"detail": "Only pending leaves can be rejected.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        leave.status = StudentLeave.STATUS_REJECTED
        leave.reviewed_at = timezone.now()
        leave.reviewer = request.user
        leave.admin_remarks = serializer.validated_data.get("admin_remarks", "")
        leave.save(update_fields=["status", "reviewed_at", "reviewer", "admin_remarks", "updated_at"])

        log_audit(
            action="leave.rejected",
            request=request,
            institution=leave.institution,
            resource_type="student_leave",
            resource_id=leave.id,
            metadata={"student_id": str(leave.student_id)},
        )
        return Response(StudentLeaveReadSerializer(leave).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        leave = self.get_object()
        if leave.status == StudentLeave.STATUS_CANCELLED:
            return Response(
                {"error": {"detail": "Leave is already cancelled.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        leave.status = StudentLeave.STATUS_CANCELLED
        leave.reviewed_at = timezone.now()
        leave.reviewer = request.user
        leave.admin_remarks = serializer.validated_data.get("admin_remarks", "")
        leave.save(update_fields=["status", "reviewed_at", "reviewer", "admin_remarks", "updated_at"])

        log_audit(
            action="leave.cancelled",
            request=request,
            institution=leave.institution,
            resource_type="student_leave",
            resource_id=leave.id,
            metadata={"student_id": str(leave.student_id)},
        )
        return Response(StudentLeaveReadSerializer(leave).data)


class AdminTeacherLeaveViewSet(viewsets.GenericViewSet):

    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    def _scope_queryset(self, qs):
        user = self.request.user
        if user.is_superuser:
            return qs
        return qs.filter(institution=user.institution)

    def get_queryset(self):
        qs = (
            TeacherLeave.objects.all()
            .select_related("teacher", "institution", "reviewer")
        )
        qs = self._scope_queryset(qs)

        status_filter = self.request.query_params.get("status")
        if status_filter in {
            TeacherLeave.STATUS_PENDING,
            TeacherLeave.STATUS_APPROVED,
            TeacherLeave.STATUS_REJECTED,
            TeacherLeave.STATUS_CANCELLED,
        }:
            qs = qs.filter(status=status_filter)

        leave_type = self.request.query_params.get("leave_type")
        if leave_type in {
            TeacherLeave.LEAVE_SICK,
            TeacherLeave.LEAVE_CASUAL,
            TeacherLeave.LEAVE_VACATION,
            TeacherLeave.LEAVE_OTHER,
        }:
            qs = qs.filter(leave_type=leave_type)

        teacher_id = self.request.query_params.get("teacher_id")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)

        from_str = self.request.query_params.get("from")
        if from_str:
            qs = qs.filter(start_date__gte=from_str)

        to_str = self.request.query_params.get("to")
        if to_str:
            qs = qs.filter(end_date__lte=to_str)

        institution_id = self.request.query_params.get("institution")
        user = self.request.user
        if institution_id and user.is_superuser:
            qs = qs.filter(institution_id=institution_id)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(teacher__email__icontains=q)
                | Q(teacher__first_name__icontains=q)
                | Q(teacher__last_name__icontains=q)
                | Q(reason__icontains=q)
            )

        return qs.order_by("-applied_at")

    def get_object(self):
        pk = self.kwargs["pk"]
        qs = self._scope_queryset(TeacherLeave.objects.all())
        try:
            return qs.get(pk=pk)
        except TeacherLeave.DoesNotExist:
            raise NotFound("Leave not found.")

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = TeacherLeaveReadSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(TeacherLeaveReadSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        obj = self.get_object()
        return Response(TeacherLeaveReadSerializer(obj).data)

    def create(self, request):
        serializer = TeacherLeaveWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        teacher = getattr(serializer, "_teacher", None)
        if teacher is None:
            return Response(
                {"error": {"detail": "teacher_id is required.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.is_superuser:
            institution = teacher.institution
        else:
            if teacher.institution_id != user.institution_id:
                return Response(
                    {"error": {"detail": "Teacher is not in your institution.", "status_code": 400}},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            institution = user.institution

        serializer.check_overlap(
            TeacherLeave,
            "teacher",
            teacher.id,
            data["start_date"],
            data["end_date"],
        )

        leave = TeacherLeave.objects.create(
            institution=institution,
            teacher=teacher,
            leave_type=data["leave_type"],
            start_date=data["start_date"],
            end_date=data["end_date"],
            reason=data.get("reason", ""),
        )

        log_audit(
            action="leave.created",
            request=request,
            institution=institution,
            resource_type="teacher_leave",
            resource_id=leave.id,
            metadata={
                "teacher_id": str(teacher.id),
                "leave_type": leave.leave_type,
                "start_date": leave.start_date.isoformat(),
                "end_date": leave.end_date.isoformat(),
                "days": leave.days,
            },
        )

        return Response(
            TeacherLeaveReadSerializer(leave).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, pk=None):
        leave = self.get_object()
        if leave.status != TeacherLeave.STATUS_PENDING:
            return Response(
                {"error": {"detail": "Only pending leaves can be edited.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TeacherLeaveWriteSerializer(data=request.data, partial=True, instance=leave)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        new_start = data.get("start_date", leave.start_date)
        new_end = data.get("end_date", leave.end_date)

        serializer.check_overlap(
            TeacherLeave,
            "teacher",
            leave.teacher_id,
            new_start,
            new_end,
            exclude_id=leave.id,
        )

        for field in ("leave_type", "start_date", "end_date", "reason"):
            if field in data:
                setattr(leave, field, data[field])
        leave.save()

        log_audit(
            action="leave.updated",
            request=request,
            institution=leave.institution,
            resource_type="teacher_leave",
            resource_id=leave.id,
            metadata={"teacher_id": str(leave.teacher_id)},
        )

        return Response(TeacherLeaveReadSerializer(leave).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != TeacherLeave.STATUS_PENDING:
            return Response(
                {"error": {"detail": "Only pending leaves can be approved.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        leave.status = TeacherLeave.STATUS_APPROVED
        leave.reviewed_at = timezone.now()
        leave.reviewer = request.user
        leave.admin_remarks = serializer.validated_data.get("admin_remarks", "")
        leave.save(update_fields=["status", "reviewed_at", "reviewer", "admin_remarks", "updated_at"])

        log_audit(
            action="leave.approved",
            request=request,
            institution=leave.institution,
            resource_type="teacher_leave",
            resource_id=leave.id,
            metadata={"teacher_id": str(leave.teacher_id)},
        )
        return Response(TeacherLeaveReadSerializer(leave).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != TeacherLeave.STATUS_PENDING:
            return Response(
                {"error": {"detail": "Only pending leaves can be rejected.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        leave.status = TeacherLeave.STATUS_REJECTED
        leave.reviewed_at = timezone.now()
        leave.reviewer = request.user
        leave.admin_remarks = serializer.validated_data.get("admin_remarks", "")
        leave.save(update_fields=["status", "reviewed_at", "reviewer", "admin_remarks", "updated_at"])

        log_audit(
            action="leave.rejected",
            request=request,
            institution=leave.institution,
            resource_type="teacher_leave",
            resource_id=leave.id,
            metadata={"teacher_id": str(leave.teacher_id)},
        )
        return Response(TeacherLeaveReadSerializer(leave).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        leave = self.get_object()
        if leave.status == TeacherLeave.STATUS_CANCELLED:
            return Response(
                {"error": {"detail": "Leave is already cancelled.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        leave.status = TeacherLeave.STATUS_CANCELLED
        leave.reviewed_at = timezone.now()
        leave.reviewer = request.user
        leave.admin_remarks = serializer.validated_data.get("admin_remarks", "")
        leave.save(update_fields=["status", "reviewed_at", "reviewer", "admin_remarks", "updated_at"])

        log_audit(
            action="leave.cancelled",
            request=request,
            institution=leave.institution,
            resource_type="teacher_leave",
            resource_id=leave.id,
            metadata={"teacher_id": str(leave.teacher_id)},
        )
        return Response(TeacherLeaveReadSerializer(leave).data)    