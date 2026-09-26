from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminAuditLogViewSet,
    AdminEnrollmentViewSet,
    AdminSessionViewSet,
    AdminStatsView,
    AdminStudentAttendanceViewSet,
    AdminTeacherAttendanceViewSet,
    AdminUserViewSet,
    InstitutionCourseViewSet,
)

router = DefaultRouter()
router.register("users", AdminUserViewSet, basename="admin-user")
router.register("courses", InstitutionCourseViewSet, basename="institution-course")
router.register("audit", AdminAuditLogViewSet, basename="admin-audit")
router.register("sessions", AdminSessionViewSet, basename="admin-session")
router.register("enrollments", AdminEnrollmentViewSet, basename="admin-enrollment")
router.register(
    "attendance/teachers",
    AdminTeacherAttendanceViewSet,
    basename="admin-teacher-attendance",
)
router.register(
    "attendance/students",
    AdminStudentAttendanceViewSet,
    basename="admin-student-attendance",
)

urlpatterns = [
    path("", include(router.urls)),
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
]
