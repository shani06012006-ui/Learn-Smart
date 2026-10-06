# -*- coding: utf-8 -*-
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet

router = DefaultRouter()
router.register("attendance", AttendanceViewSet, basename="admin-attendance")

urlpatterns = router.urls
