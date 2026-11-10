# backend/attendance/urls.py
# -*- coding: utf-8 -*-
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet

router = DefaultRouter()
# Registers /api/v1/admin/attendance/
router.register(r"attendance", AttendanceViewSet, basename="admin-attendance")

urlpatterns = [
    path("", include(router.urls)),
]