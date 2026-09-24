"""
Institution admin API views.

Isolation rule (server-side, enforced here):

- A superuser (is_superuser=True, role="admin") sees every institution.
- Any other admin sees only rows where institution == their own institution.

Every queryset is filtered by `_scope_queryset`. Every write sets the
institution from `request.user` (never from client input). No view trusts
a client-supplied institution id.
"""
from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from classes.models import ClassCourse, StudentEnrollment
from institutions.models import Institution

from .permissions import IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser
from .serializers import (
    AdminCourseReadSerializer,
    AdminCourseWriteSerializer,
    AdminStatsSerializer,
    AdminUserCreateSerializer,
    AdminUserSerializer,
    AdminUserToggleActiveSerializer,
    AdminUserUpdateSerializer,
)


class AdminUserViewSet(viewsets.GenericViewSet):
    """
    Admin-only user management, scoped to the caller's institution.

    Endpoints:
        GET    /api/v1/admin/users/            list (paginated, filterable)
        POST   /api/v1/admin/users/            create teacher or student
        GET    /api/v1/admin/users/<id>/       retrieve
        PATCH  /api/v1/admin/users/<id>/       update first/last name
        POST   /api/v1/admin/users/<id>/toggle-active/   activate/deactivate
    """

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

        # Optional ?role=teacher|student|admin filter
        role = self.request.query_params.get("role")
        if role in {User.ROLE_TEACHER, User.ROLE_STUDENT, User.ROLE_ADMIN}:
            qs = qs.filter(role=role)

        # Optional ?is_active=true|false filter
        active = self.request.query_params.get("is_active")
        if active is not None:
            active_bool = active.lower() in {"true", "1", "yes"}
            qs = qs.filter(is_active=active_bool)

        # Optional ?q= search on email / name
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
        # Institution on the new user: superuser must supply one (from the
        # body); a regular admin's institution is used implicitly.
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
                institution = None  # superuser may create an unattached user
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

        # Guardrail: an admin cannot deactivate themselves. Prevents a
        # lockout scenario where the last admin turns off their own account.
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
        """
        GET /api/v1/admin/users/<id>/classes/

        Return the classes taught by this user. Only valid for teachers.
        Respects institution isolation via get_object().
        """
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
        """
        GET /api/v1/admin/users/<id>/enrollments/

        Return the classes this student is enrolled in. Only valid for
        students. Respects institution isolation via get_object().
        """
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
    """
    GET /api/v1/admin/stats/

    Dashboard counts scoped to the caller's institution (or across all
    institutions for superusers).
    """

    permission_classes = [IsInstitutionAdmin, RequiresInstitutionUnlessSuperuser]

    def get(self, request):
        user = request.user

        users_qs = User.objects.all()
        classes_qs = ClassCourse.objects.all()
        enrollments_qs = StudentEnrollment.objects.all()

        if not user.is_superuser:
            users_qs = users_qs.filter(institution=user.institution)
            classes_qs = classes_qs.filter(institution=user.institution)
            # Enrollments don't have a direct institution field Ã¢â‚¬â€ scope via
            # the class the enrollment belongs to.
            enrollments_qs = enrollments_qs.filter(class_course__institution=user.institution)

        # role counts
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

class InstitutionCourseViewSet(viewsets.GenericViewSet):
    """
    Admin-only course management, scoped to the caller's institution.

    Endpoints:
        GET    /api/v1/admin/courses/                 list
        POST   /api/v1/admin/courses/                 create
        GET    /api/v1/admin/courses/<uuid>/          retrieve
        PATCH  /api/v1/admin/courses/<uuid>/          update (name, subject, description, is_archived)
        DELETE /api/v1/admin/courses/<uuid>/          soft delete

    Isolation rules match AdminUserViewSet:
        - Superuser sees every institution.
        - Everyone else sees only courses where course.institution == user.institution.
        - The institution on a new course is resolved server-side; the
          client never supplies it (except superusers, who must supply it
          because they have no institution of their own).
    """

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

        # Optional ?is_archived=true|false
        archived = self.request.query_params.get("is_archived")
        if archived is not None:
            qs = qs.filter(is_archived=archived.lower() in {"true", "1", "yes"})

        # Optional ?subject=Physics
        subject = self.request.query_params.get("subject")
        if subject:
            qs = qs.filter(subject__iexact=subject)

        # Optional ?q= search on name / subject
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(subject__icontains=q))

        # Annotate active student count for the read serializer
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
            # 404 (not 403) per the cross-tenant policy: a resource that
            # exists in another institution must not be discoverable.
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

        # Resolve the institution (never trust the client for non-superusers)
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

        # Resolve and validate the teacher
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
        """
        Soft-deletes the course. The React admin UI exposes this only as
        an "Archive" action (which uses partial_update with
        is_archived=true). The DELETE endpoint remains available for a
        future hard-removal flow, but is not wired into the UI.
        """
        course = self.get_object()
        course.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)