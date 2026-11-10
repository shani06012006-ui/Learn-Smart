# backend/accounts/teacher_onboarding_views.py
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .activation import ActivationThrottle
from .models import User
from .teacher_onboarding import (
    CompleteSerializer,
    LinkSerializer,
    OnboardingError,
    check_teacher_link,
    complete_teacher_onboarding,
    resend_teacher_invite,
)


def _error_response(exc: OnboardingError):
    return Response(
        {"error": {"code": exc.code, "detail": exc.detail}},
        status=exc.http_status,
    )


class TeacherOnboardingValidateView(APIView):
    """Token travels in the request body, never in the URL, so it stays out of logs."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ActivationThrottle]

    def post(self, request):
        ser = LinkSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            row = check_teacher_link(ser.validated_data["token"])
        except OnboardingError as exc:
            return _error_response(exc)

        return Response({
            "email": row.user.email,
            "first_name": row.user.first_name,
            "expires_at": row.expires_at,
        })


class TeacherOnboardingCompleteView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ActivationThrottle]

    def post(self, request):
        ser = CompleteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            user = complete_teacher_onboarding(
                ser.validated_data["token"],
                ser.validated_data["new_password"],
            )
        except OnboardingError as exc:
            return _error_response(exc)

        return Response({"email": user.email, "detail": "Password created."})


class AdminResendTeacherInviteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        actor = request.user
        if not (actor.is_superuser or getattr(actor, "role", None) == User.ROLE_ADMIN):
            raise PermissionDenied("Only admins can resend teacher invites.")

        teacher = get_object_or_404(User, pk=pk, role=User.ROLE_TEACHER)

        # Admins can only manage teachers from their own institution.
        if actor.institution_id and teacher.institution_id != actor.institution_id:
            raise NotFound()

        try:
            sent = resend_teacher_invite(teacher, issued_by=actor)
        except OnboardingError as exc:
            return _error_response(exc)

        return Response({"email": teacher.email, "email_sent": sent})