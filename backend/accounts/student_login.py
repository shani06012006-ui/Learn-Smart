# -*- coding: utf-8 -*-
"""
PIN-based student login.

POST /api/v1/auth/student-login/
    body: { "pin": "123456" }
    -> { access, refresh, user }

Response mirrors the standard /auth/login/ shape so the frontend can reuse
the same session storage.
"""
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, StudentCredentials


class StudentLoginSerializer(serializers.Serializer):
    pin = serializers.CharField(min_length=4, max_length=8, trim_whitespace=True)


class StudentLoginView(APIView):
    """
    AllowAny — this is the whole point of the endpoint: no email needed.
    A simple PIN acts as the credential.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        ser = StudentLoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        pin = ser.validated_data["pin"].strip()

        try:
            creds = StudentCredentials.objects.select_related("student").get(pin=pin)
        except StudentCredentials.DoesNotExist:
            return Response(
                {"error": {"detail": "Unknown PIN.", "status_code": 401}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Lockout check
        if creds.is_locked():
            return Response(
                {
                    "error": {
                        "detail": "Too many attempts. Try again later.",
                        "status_code": 429,
                    }
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if not creds.is_active:
            return Response(
                {
                    "error": {
                        "detail": "PIN login has been disabled for this student.",
                        "status_code": 403,
                    }
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        student = creds.student
        if student.role != User.ROLE_STUDENT:
            return Response(
                {"error": {"detail": "Not a student account.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not student.is_active:
            return Response(
                {"error": {"detail": "Account is inactive.", "status_code": 403}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Success — issue tokens with the student's identity
        creds.register_success()

        refresh = RefreshToken.for_user(student)
        # Custom claim so downstream permission classes can see the auth mode.
        refresh["pin_login"] = True
        refresh.access_token["pin_login"] = True

        from admin_api.serializers import AdminUserSerializer
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": AdminUserSerializer(student).data,
        }, status=status.HTTP_200_OK)
