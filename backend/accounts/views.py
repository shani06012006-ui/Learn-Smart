"""
Authentication endpoints.

These are the endpoints the React admin (and, later, the teacher/student
apps once they migrate off the mock auth) talk to over HTTP.

Endpoints:
    POST /api/v1/auth/login/            email + password -> access + refresh
    POST /api/v1/auth/refresh/          rotate refresh -> new pair
    GET  /api/v1/auth/me/               Authorization -> user
    POST /api/v1/auth/logout/           revoke the supplied refresh token
    POST /api/v1/auth/ws-ticket/        mint a single-use WebSocket ticket

Refresh tokens are stateful (see accounts/token_service.py). Access
tokens are JWTs, validated by accounts/jwt_auth.py which also enforces
`tokens_valid_after`.
"""
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import UserSerializer
from .token_service import (
    RefreshTokenError,
    issue_access_token,
    issue_refresh_token,
    revoke_one,
    rotate_refresh_token,
)
from .ws_tickets import mint_ticket


def _client_ip(request):
    return request.META.get("REMOTE_ADDR") or None


def _user_agent(request):
    return request.META.get("HTTP_USER_AGENT", "") or ""


class LoginView(APIView):
    """
    Email + password -> JWT access + opaque stateful refresh.

    On success:
      - user.last_login is updated
      - a RefreshToken row is created (new family)
      - an audit event is written
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        if not email or not password:
            return Response(
                {"error": {"detail": "Email and password are required.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=email, password=password)

        if user is None:
            return Response(
                {"error": {"detail": "Invalid email or password.", "status_code": 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"error": {"detail": "This account has been deactivated.", "status_code": 403}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Update last_login (Django's built-in field).
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        # Issue our own stateful refresh token (new family).
        raw_refresh, _row = issue_refresh_token(
            user,
            ip_address=_client_ip(request),
            user_agent=_user_agent(request),
        )
        access = issue_access_token(user)

        return Response(
            {
                "access": access,
                "refresh": raw_refresh,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class RefreshView(APIView):
    """
    Exchange a refresh token for a new pair. Rotation is atomic (row lock
    in token_service.rotate_refresh_token). Reuse of a rotated token kills
    the whole family and returns 401.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw = request.data.get("refresh") or ""
        if not raw:
            return Response(
                {"error": {"detail": "refresh is required.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_raw, new_access, user = rotate_refresh_token(
                raw,
                ip_address=_client_ip(request),
                user_agent=_user_agent(request),
            )
        except RefreshTokenError as e:
            return Response(
                {"error": {"detail": "Invalid or expired refresh token.", "status_code": 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {"access": new_access, "refresh": new_raw},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """Return the currently authenticated user. Requires a valid access token."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Revoke the supplied refresh token. Idempotent. Access tokens issued
    before logout remain valid until their natural expiry — see the
    architecture doc for the reasoning.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw = request.data.get("refresh") or ""
        if raw:
            revoke_one(raw, reason="logout")

        return Response(status=status.HTTP_204_NO_CONTENT)


class WsTicketView(APIView):
    """
    Mint a short-lived, single-use ticket for opening a WebSocket.

    The client presents its access JWT in the Authorization header (as
    with any authenticated request). The response body contains an opaque
    ticket string that is valid for 30 seconds and can be consumed once.

    This avoids putting the long-lived access JWT in the WebSocket URL,
    which would leak it into proxy and server logs.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ticket = mint_ticket(request.user)
        return Response({"ticket": ticket}, status=status.HTTP_200_OK)


# Keep a reference so `from .views import User` doesn't break.
_ = User


class StudentListView(APIView):
    """
    GET /api/v1/students/

    Cross-class student list for teachers.

    Query parameters:
      scope   -- "mine" (default, students in teacher's classes) or
                 "all" (all students in the institution)
      grade   -- filter by Grade UUID
      q       -- case-insensitive search on email / first / last name

    Teachers only. Admins use /api/v1/admin/users/?role=student.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != "teacher":
            return Response(
                {"detail": "Only teachers can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from .models import User
        from .serializers import StudentBriefSerializer
        from classes.models import ClassCourse, StudentEnrollment

        # Base scope: only students of the teacher's institution
        qs = User.objects.filter(
            role=User.ROLE_STUDENT,
            institution=user.institution,
        ).select_related("grade").order_by("first_name", "last_name", "email")

        scope = request.query_params.get("scope", "mine").lower()

        if scope == "mine":
            # Restrict to students enrolled in any class this teacher owns
            my_class_ids = ClassCourse.objects.filter(
                teacher=user,
            ).values_list("id", flat=True)
            student_ids = StudentEnrollment.objects.filter(
                class_course_id__in=my_class_ids,
                status=StudentEnrollment.STATUS_ACTIVE,
            ).values_list("student_id", flat=True).distinct()
            qs = qs.filter(id__in=student_ids)

        # Filter by grade
        grade_id = request.query_params.get("grade")
        if grade_id:
            qs = qs.filter(grade_id=grade_id)

        # Search
        q = request.query_params.get("q")
        if q:
            from django.db.models import Q
            qs = qs.filter(
                Q(email__icontains=q)
                | Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
            )

        # Attach "classes the student is enrolled in" for the serialized output.
        # Build a map[student_id] = list of {id, name, subject} in one query.
        student_ids = list(qs.values_list("id", flat=True))
        enrollments = (
            StudentEnrollment.objects
            .filter(
                student_id__in=student_ids,
                status=StudentEnrollment.STATUS_ACTIVE,
            )
            .select_related("class_course")
        )
        class_map = {}
        for e in enrollments:
            class_map.setdefault(e.student_id, []).append({
                "id": str(e.class_course.id),
                "name": e.class_course.name,
                "subject": e.class_course.subject,
            })

        # Attach the list to each user object (used by the serializer)
        students = list(qs)
        for s in students:
            setattr(s, "_my_classes", class_map.get(s.id, []))

        serializer = StudentBriefSerializer(students, many=True)
        return Response({
            "count": len(students),
            "results": serializer.data,
        })

