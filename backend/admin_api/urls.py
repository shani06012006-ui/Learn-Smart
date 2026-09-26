from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminAuditLogViewSet,
    AdminEnrollmentViewSet,
    AdminLiveClassViewSet,
    AdminSessionViewSet,
    AdminStatsView,
    AdminStudentAttendanceViewSet,
    AdminStudentLeaveViewSet,
    AdminTeacherAttendanceViewSet,
    AdminTeacherLeaveViewSet,
    AdminTimetableViewSet,
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
router.register(
    "timetable",
    AdminTimetableViewSet,
    basename="admin-timetable",
)
router.register(
    "live-classes",
    AdminLiveClassViewSet,
    basename="admin-live-class",
)
router.register(
    "leaves/students",
    AdminStudentLeaveViewSet,
    basename="admin-student-leave",
)
router.register(
    "leaves/teachers",
    AdminTeacherLeaveViewSet,
    basename="admin-teacher-leave",
)

urlpatterns = [
    path("", include(router.urls)),
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
]
