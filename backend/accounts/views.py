from django.contrib.auth import authenticate
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User, OnlineStatus, StudentProfile
from .serializers import UserSerializer
from .token_service import (
    REMEMBER_ME_LIFETIME,
    RefreshTokenError,
    issue_access_token,
    issue_refresh_token,
    revoke_one,
    rotate_refresh_token,
)
from .ws_tickets import mint_ticket
from .services import generate_login_otp, verify_login_otp
from .google_auth import (
    GoogleAuthNotConfigured,
    GoogleTokenError,
    GoogleUnavailable,
    verify_google_credential,
)

def _client_ip(request):
    return request.META.get("REMOTE_ADDR") or None

def _user_agent(request):
    return request.META.get("HTTP_USER_AGENT", "") or ""

def _password_setup_required():
    """403 for an account that still has to choose its password."""
    return Response(
        {
            "error": {
                "detail": "Please set your password with the activation link we sent you before logging in.",
                "status_code": 403,
                "code": "password_setup_required",
            }
        },
        status=status.HTTP_403_FORBIDDEN,
    )


class LoginView(APIView):
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

        if user.must_set_password:
            return _password_setup_required()

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        remember_me = bool(request.data.get("remember_me"))
        lifetime = REMEMBER_ME_LIFETIME if remember_me else None

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


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @staticmethod
    def _error(detail, http_status, code):
        return Response(
            {"error": {"detail": detail, "status_code": http_status, "code": code}},
            status=http_status,
        )

    def post(self, request):
        credential = (request.data.get("credential") or "").strip()
        if not credential:
            return self._error(
                "A Google credential is required.", status.HTTP_400_BAD_REQUEST, "missing_credential"
            )

        try:
            claims = verify_google_credential(credential)
        except GoogleAuthNotConfigured:
            return self._error(
                "Google sign-in is not set up on this server yet.",
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "google_not_configured",
            )
        except GoogleUnavailable:
            return self._error(
                "Could not reach Google to verify your sign-in. Please try again.",
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "google_unreachable",
            )
        except GoogleTokenError:
            return self._error(
                "Google sign-in could not be verified. Please try again.",
                status.HTTP_400_BAD_REQUEST,
                "invalid_google_token",
            )

        email = claims["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if user is None:
            return self._error(
                f"No Learn Smart account uses {email}. Ask your school admin to add you first.",
                status.HTTP_403_FORBIDDEN,
                "no_account",
            )
        if not user.is_active:
            return self._error(
                "This account has been deactivated.", status.HTTP_403_FORBIDDEN, "deactivated"
            )
        if user.role == User.ROLE_STUDENT:
            return self._error(
                "Students sign in with their student code, not with Google.",
                status.HTTP_403_FORBIDDEN,
                "student_use_pin",
            )

        update_fields = ["last_login"]
        if not user.first_name and claims.get("given_name"):
            user.first_name = claims["given_name"][:150]
            update_fields.append("first_name")
        if not user.last_name and claims.get("family_name"):
            user.last_name = claims["family_name"][:150]
            update_fields.append("last_name")
        user.last_login = timezone.now()
        user.save(update_fields=update_fields)

        remember_me = bool(request.data.get("remember_me"))
        raw_refresh, _row = issue_refresh_token(
            user,
            ip_address=_client_ip(request),
            user_agent=_user_agent(request),
            lifetime=REMEMBER_ME_LIFETIME if remember_me else None,
        )
        return Response(
            {
                "access": issue_access_token(user),
                "refresh": raw_refresh,
                "user": UserSerializer(user).data,
                "remember_me": remember_me,
            },
            status=status.HTTP_200_OK,
        )


class RefreshView(APIView):
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
        except RefreshTokenError:
            return Response(
                {"error": {"detail": "Invalid or expired refresh token.", "status_code": 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {"access": new_access, "refresh": new_raw},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw = request.data.get("refresh") or ""
        if raw:
            revoke_one(raw, reason="logout")

        return Response(status=status.HTTP_204_NO_CONTENT)


class WsTicketView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ticket = mint_ticket(request.user)
        return Response({"ticket": ticket}, status=status.HTTP_200_OK)


class StudentListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from accounts.models import User, StudentAttendance
        from classes.models import ClassCourse, StudentEnrollment
        from institutions.models import Grade
        from collections import defaultdict

        user = request.user
        if getattr(user, "role", None) != "teacher":
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

        enroll_qs = (
            StudentEnrollment.objects
            .filter(status=StudentEnrollment.STATUS_ACTIVE)
            .select_related(
                "student",
                "class_course",
                "class_course__teacher",
                "class_course__grade",
                "class_course__institution",
            )
        )

        if scope == "mine":
            enroll_qs = enroll_qs.filter(class_course__teacher=user)

        if class_course_id:
            enroll_qs = enroll_qs.filter(class_course_id=class_course_id)
        if grade_id:
            enroll_qs = enroll_qs.filter(class_course__grade_id=grade_id)
        if q_str:
            from django.db.models import Q
            enroll_qs = enroll_qs.filter(
                Q(student__first_name__icontains=q_str)
                | Q(student__last_name__icontains=q_str)
                | Q(student__email__icontains=q_str)
            )

        attendance_map = {}
        student_ids = list({str(e.student_id) for e in enroll_qs})
        class_ids = list({
            str(e.class_course_id) for e in enroll_qs if e.class_course_id
        })

        if student_ids and class_ids:
            att_rows = (
                StudentAttendance.objects
                .filter(
                    student_id__in=student_ids,
                    class_course_id__in=class_ids,
                )
                .values("student_id", "class_course_id", "status")
            )
            counts = defaultdict(lambda: {"total": 0, "present": 0})
            for r in att_rows:
                key = (str(r["student_id"]), str(r["class_course_id"]))
                counts[key]["total"] += 1
                if r["status"] == StudentAttendance.STATUS_PRESENT:
                    counts[key]["present"] += 1
            attendance_map = dict(counts)

        results = []
        seen = set()
        for e in enroll_qs:
            s = e.student
            cls = e.class_course

            dedupe_key = (str(s.id), str(cls.id) if cls else None)
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)

            pct = 0.0
            if cls:
                agg = attendance_map.get((str(s.id), str(cls.id)))
                if agg and agg["total"] > 0:
                    pct = round((agg["present"] / agg["total"]) * 100, 1)

            full_name = (
                f"{s.first_name or ''} {s.last_name or ''}".strip()
            ) or s.email
            ct = cls.teacher if cls else None
            class_teacher_name = (
                (f"{ct.first_name or ''} {ct.last_name or ''}".strip() or ct.email)
                if ct else ""
            )

            results.append({
                "id": str(s.id),
                "enrollment_id": str(e.id),
                "full_name": full_name,
                "email": s.email,
                "roll_number": getattr(e, "roll_number", "") or "",
                "class_id": str(cls.id) if cls else None,
                "class_name": cls.name if cls else "",
                "class_teacher_id": str(ct.id) if ct else None,
                "class_teacher_name": class_teacher_name,
                "attendance_pct": pct,
            })

        results.sort(key=lambda r: r["full_name"].lower())

        grades_qs = Grade.objects.all()
        grades = [{"id": str(g.id), "name": g.name} for g in grades_qs.order_by("level", "name")]

        return Response({
            "count": len(results),
            "grades": grades,
            "results": results,
        })


class TeacherStudentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.role != "teacher":
            return Response(
                {"detail": "Only teachers can create students here."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from accounts.models import OnlineStatus, StudentProfile, User
        from accounts.activation import invite_student, normalise_whatsapp_number
        from accounts.services import generate_student_pin
        from institutions.models import Grade
        from classes.services import auto_enroll_student_into_grade

        email = (request.data.get("email") or "").strip().lower()
        first_name = (request.data.get("first_name") or "").strip()
        last_name = (request.data.get("last_name") or "").strip()
        grade_id = request.data.get("grade_id")

        # Resolve delivery channels (default: email only)
        send_via = request.data.get("send_via")
        if send_via is None:
            send_via = ["email"]
        send_via = list(dict.fromkeys(send_via))
        send_email = "email" in send_via
        whatsapp_number = None
        if "whatsapp" in send_via:
            whatsapp_number = normalise_whatsapp_number(request.data.get("phone"))
            if whatsapp_number is None:
                return Response(
                    {"detail": "Enter a valid mobile number with country code, e.g. +91 98765 43210."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grade = None
        if grade_id:
            try:
                grade = Grade.objects.get(
                    id=grade_id,
                )
            except Grade.DoesNotExist:
                return Response(
                    {"detail": "Unknown grade."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        existing = User.objects.filter(email=email).first()
        if existing is not None:
            if existing.role != User.ROLE_STUDENT:
                return Response(
                    {"detail": "A non-student user already uses this email."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            student = existing
            if grade is not None:
                student.save(update_fields=["updated_at"])
            created = False
        else:
            student = User.objects.create_user(
                email=email,
                password=None,
                first_name=first_name,
                last_name=last_name,
                role=User.ROLE_STUDENT,
                institution=user.institution,
                grade=grade,
                # New students must choose a password before they can sign in.
                must_set_password=True,
            )
            student.set_unusable_password()
            student.save(update_fields=["password"])
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

        # Generate a PIN for the quick-login page.
        pin_value = None
        try:
            from accounts.models import StudentCredentials
            if not StudentCredentials.objects.filter(student=student).exists():
                pin_value = generate_student_pin(student).pin
            else:
                pin_value = StudentCredentials.objects.filter(student=student).first().pin
        except Exception:
            import logging
            logging.getLogger(__name__).exception("PIN generation failed for student %s", student.id)

        # Issue a one-time activation invite so the student can set a password.
        invitation = None
        if created or student.must_set_password:
            try:
                invitation = invite_student(
                    student,
                    issued_by=user,
                    send_email=send_email,
                    whatsapp_number=whatsapp_number,
                )
                invitation["student_pin"] = pin_value
            except Exception:
                import logging
                logging.getLogger(__name__).exception(
                    "activation invite failed for student %s", student.id
                )

        from .serializers import StudentBriefSerializer
        resp = {
            "created": created,
            "auto_enrolled_count": enrolled_count,
            "student": StudentBriefSerializer(student).data,
        }
        if invitation is not None:
            resp["invitation"] = invitation
        if pin_value is not None:
            resp["student_pin"] = pin_value
        return Response(
            resp,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class RequestOTPView(APIView):
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

        if user.must_set_password:
            return _password_setup_required()

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


class TeacherColleaguesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from accounts.models import User

        user = request.user
        if getattr(user, "role", None) != "teacher":
            return Response(
                {"detail": "Teacher access only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = User.objects.filter(
            role=getattr(User, "ROLE_TEACHER", "teacher"),
            is_active=True,
        ).order_by("first_name", "last_name", "email")

        results = []
        for u in qs:
            full_name = (f"{u.first_name or ''} {u.last_name or ''}".strip()) or u.email
            results.append({
                "id": str(u.id),
                "email": u.email,
                "first_name": u.first_name or "",
                "last_name": u.last_name or "",
                "full_name": full_name,
                "role": "teacher",
            })

        return Response({"count": len(results), "results": results})


# ==========================================
# NEW SECURE SETUP & ADMIN CREATION VIEWS
# ==========================================

class SetupPasswordView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not all([token, new_password, confirm_password]):
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({"error": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # ✅ Use the correct custom activation logic
            from .activation import complete_activation
            user = complete_activation(token, new_password)
            
            return Response(
                {"message": "Password set successfully. You can now log in."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            from .activation import ActivationError
            if isinstance(e, ActivationError):
                return Response({"error": e.detail}, status=e.http_status)
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_400_BAD_REQUEST)


class AdminCreateStudentView(APIView):
    def post(self, request):
        email = request.data.get("email")
        first_name = request.data.get("first_name", "")
        last_name = request.data.get("last_name", "")

        if User.objects.filter(email=email).exists():
            return Response({"error": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            email=email,
            password=None,
            first_name=first_name,
            last_name=last_name,
            role=User.ROLE_STUDENT,
            must_set_password=True
        )
        user.set_unusable_password()
        user.save()

        StudentProfile.objects.create(user=user)
        OnlineStatus.objects.create(user=user)

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        setup_url = f"http://localhost:5173/auth/setup-password?uid={uidb64}&token={token}"

        return Response({
            "message": "Student created successfully.",
            "setup_url": setup_url,
            "uid": uidb64,
            "token": token
        }, status=status.HTTP_201_CREATED)
        
class StudentPinLoginView(APIView):
    """
    POST /api/v1/auth/student-login/   body: { pin: "123456" }
    Logs in a student using their 6-digit PIN.
    Returns the same { access, refresh, user } shape as LoginView.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        from .models import StudentCredentials
        
        pin = (request.data.get("pin") or "").strip()

        if not pin or len(pin) != 6 or not pin.isdigit():
            return Response(
                {"error": {"detail": "Enter your 6-digit code.", "code": "invalid_pin"}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            creds = StudentCredentials.objects.select_related("student").get(
                pin=pin, is_active=True
            )
        except StudentCredentials.DoesNotExist:
            return Response(
                {"error": {"detail": "That code didn't work. Try again.", "code": "invalid_pin"}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if creds.is_locked():
            return Response(
                {"error": {"detail": "Too many attempts. Try again in 15 minutes.", "code": "locked"}},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = creds.student

        if not user.is_active:
            return Response(
                {"error": {"detail": "This account has been deactivated.", "code": "inactive"}},
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.must_set_password:
            return Response(
                {
                    "error": {
                        "detail": "Please set your password first with the activation link we sent you.",
                        "code": "password_setup_required",
                    }
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])
        creds.register_success()

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