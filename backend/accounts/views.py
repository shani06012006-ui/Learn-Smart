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


from .services import generate_login_otp, verify_login_otp
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

        # Remember-me? Extended refresh TTL (30 days) vs default (7 days).
        remember_me = bool(request.data.get("remember_me"))
        lifetime = REMEMBER_ME_LIFETIME if remember_me else None

        # Issue our own stateful refresh token (new family).
        raw_refresh, _row = issue_refresh_token(
            user,
            ip_address=_client_ip(request),
            user_agent=_user_agent(request),
            lifetime=lifetime,
        )
        access = issue_access_token(user)

        return Response(
            {
                "access": access,
                "refresh": raw_refresh,
                "user": UserSerializer(user).data,
                "remember_me": remember_me,
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
    GET /api/v1/teacher/students/

    Cross-class student directory for teachers.

    Query parameters:
      class_course -- filter to a single class (UUID)
      class_id     -- alias for class_course
      klass        -- alias for class_course
      grade        -- filter by Grade UUID
      scope        -- "mine" (teacher's classes) or "all" (institution-wide, default)
      q            -- search on email / first / last name

    Returns each row with: roll_number, class_name, class_teacher_name, attendance_pct.
    Teachers see all students in their institution (cross-teacher read).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from accounts.models import User, StudentAttendance
        from classes.models import ClassCourse, StudentEnrollment
        from django.db.models import Q

        user = request.user
        if user.role != "teacher":
            return Response(
                {"detail": "Teacher access only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        class_course_id = (
            request.query_params.get("class_course")
            or request.query_params.get("class_id")
            or request.query_params.get("klass")
        )
        grade_id = request.query_params.get("grade")
        scope = (request.query_params.get("scope") or "all").lower()
        q_str = (request.query_params.get("q") or "").strip()

        enroll_qs = StudentEnrollment.objects.filter(
            status=StudentEnrollment.STATUS_ACTIVE,
        ).select_related(
            "student",
            "class_course",
            "class_course__teacher",
            "class_course__grade",
        )

        # Institution scope (cross-teacher read is allowed within institution)
        if user.institution_id:
            enroll_qs = enroll_qs.filter(class_course__institution_id=user.institution_id)

        # Optional: limit to classes this teacher teaches
        if scope == "mine":
            enroll_qs = enroll_qs.filter(class_course__teacher=user)

        if class_course_id:
            enroll_qs = enroll_qs.filter(class_course_id=class_course_id)
        if grade_id:
            enroll_qs = enroll_qs.filter(class_course__grade_id=grade_id)
        if q_str:
            enroll_qs = enroll_qs.filter(
                Q(student__first_name__icontains=q_str)
                | Q(student__last_name__icontains=q_str)
                | Q(student__email__icontains=q_str)
            )

        rows = []
        seen = set()
        for e in enroll_qs:
            s = e.student
            cls = e.class_course
            # de-dupe across multiple enrollments
            dedupe_key = (str(s.id), str(cls.id) if cls else None)
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)

            total = StudentAttendance.objects.filter(
                student=s, class_course=cls
            ).count()
            present = StudentAttendance.objects.filter(
                student=s, class_course=cls,
                status=StudentAttendance.STATUS_PRESENT,
            ).count()
            pct = round((present / total) * 100, 1) if total else 0.0

            full_name = (f"{s.first_name or ''} {s.last_name or ''}").strip() or s.email
            ct = cls.teacher if cls else None
            class_teacher_name = (
                (f"{ct.first_name or ''} {ct.last_name or ''}").strip() or ct.email
            ) if ct else ""

            rows.append({
                "id": str(s.id),
                "enrollment_id": str(e.id),
                "full_name": full_name,
                "email": s.email,
                "roll_number": e.roll_number or "",
                "class_id": str(cls.id) if cls else None,
                "class_name": cls.name if cls else "",
                "class_teacher_id": str(ct.id) if ct else None,
                "class_teacher_name": class_teacher_name,
                "attendance_pct": pct,
            })

        # Optional: sort by name
        rows.sort(key=lambda r: r["full_name"].lower())
        return Response({"count": len(rows), "results": rows})

class TeacherStudentCreateView(APIView):
    """
    POST /api/v1/auth/students/create/

    Teachers create a student directly (with an optional grade).
    The student is auto-enrolled into every class of that grade.

    Body: { email, first_name, last_name, grade_id (optional) }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.role != "teacher":
            return Response(
                {"detail": "Only teachers can create students here."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.institution_id is None:
            return Response(
                {"detail": "Your account has no institution."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from accounts.models import OnlineStatus, StudentProfile, User
        from institutions.models import Grade
        from classes.services import auto_enroll_student_into_grade

        email = (request.data.get("email") or "").strip().lower()
        first_name = (request.data.get("first_name") or "").strip()
        last_name = (request.data.get("last_name") or "").strip()
        grade_id = request.data.get("grade_id")

        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate grade belongs to teacher's institution
        grade = None
        if grade_id:
            try:
                grade = Grade.objects.get(
                    id=grade_id,
                    institution_id=user.institution_id,
                )
            except Grade.DoesNotExist:
                return Response(
                    {"detail": "Unknown grade for your institution."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Refuse if the user already exists
        existing = User.objects.filter(email=email).first()
        if existing is not None:
            # Reuse — do not change password/role; just enrol if needed
            if existing.role != User.ROLE_STUDENT:
                return Response(
                    {"detail": "A non-student user already uses this email."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            student = existing
            if grade is not None and student.grade_id != grade.id:
                student.grade = grade
                student.save(update_fields=["grade", "updated_at"])
            created = False
        else:
            student = User.objects.create_user(
                email=email,
                password=None,  # unusable until they set one
                first_name=first_name,
                last_name=last_name,
                role=User.ROLE_STUDENT,
                institution=user.institution,
                grade=grade,
            )
            StudentProfile.objects.create(user=student)
            OnlineStatus.objects.create(user=student)
            created = True

        enrolled_count = 0
        if student.grade_id is not None:
            try:
                enrolled_count = auto_enroll_student_into_grade(student)
            except Exception:
                import logging
                logging.getLogger(__name__).exception(
                    "auto-enroll failed for student %s", student.id
                )

        from .serializers import StudentBriefSerializer
        return Response(
            {
                "created": created,
                "auto_enrolled_count": enrolled_count,
                "student": StudentBriefSerializer(student).data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# ═══════════════════════════════════════════════════════════════
# Passwordless email OTP
# ═══════════════════════════════════════════════════════════════

class RequestOTPView(APIView):
    """
    POST /api/v1/auth/request-otp/   body: { email }
    Generates a 6-digit code, prints to console (dev mode).
    Returns 200 always to avoid email enumeration.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if email:
            from .models import User as _U
            if _U.objects.filter(email=email, is_active=True).exists():
                try:
                    generate_login_otp(email)
                except Exception:
                    import logging
                    logging.getLogger(__name__).exception("OTP generation failed")
        return Response({"detail": "If that email exists, a code was sent."})


class VerifyOTPView(APIView):
    """
    POST /api/v1/auth/verify-otp/   body: { email, code }
    Returns the same { access, refresh, user } shape as LoginView.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        code = (request.data.get("code") or "").strip()

        if not email or not code:
            return Response(
                {"error": {"detail": "Email and code are required.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = verify_login_otp(email, code)
        if user is None:
            return Response(
                {"error": {"detail": "Invalid or expired code.", "status_code": 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

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

