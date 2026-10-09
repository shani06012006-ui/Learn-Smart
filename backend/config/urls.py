"""
Root URL configuration.

Route layout:
    /admin/             Django's built-in admin (developer fallback only â€”
                        the institution admin experience is the React app)
    /api/v1/auth/       Login, refresh, me, logout (JWT)
    /api/v1/admin/      Institution admin API (users, stats)
    /api/v1/            All other business endpoints (classes, institutions)
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from attendance.views import TeacherAttendanceViewSet, TeacherStudentsViewSet
from accounts.student_login import StudentLoginView
from attendance.student_views import StudentSelfViewSet
from chat.student_views import StudentChatViewSet, TeacherChatViewSet
from admin_api.views import PerformanceTrendView, TeacherPerformanceTrendView
from leaves.views import TeacherStudentLeavesViewSet

urlpatterns = [
    # Developer-only fallback. Not the product's admin UI.
    path("admin/", admin.site.urls),

    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/admin/", include("admin_api.urls")),
    path("api/v1/admin/dashboard/performance-trend/",
         PerformanceTrendView.as_view(),
         name="admin-performance-trend"),
    path("api/v1/teacher/dashboard/performance-trend/",
         TeacherPerformanceTrendView.as_view(),
         name="teacher-performance-trend"),

    # PIN-based student quick-login
    path("api/v1/auth/student-login/",
         StudentLoginView.as_view(),
         name="student-pin-login"),
    path("api/v1/student/me/",
         StudentSelfViewSet.as_view({"get": "me"}), name="student-me"),
    path("api/v1/student/my-classes/",
         StudentSelfViewSet.as_view({"get": "my_classes"}), name="student-my-classes"),
    path("api/v1/student/my-attendance/",
         StudentSelfViewSet.as_view({"get": "my_attendance"}), name="student-my-attendance"),
    path("api/v1/student/my-grades/",
         StudentSelfViewSet.as_view({"get": "my_grades"}), name="student-my-grades"),
    path("api/v1/student/my-timetable/",
         StudentSelfViewSet.as_view({"get": "my_timetable"}), name="student-my-timetable"),
    path("api/v1/student/my-materials/",
         StudentSelfViewSet.as_view({"get": "my_materials"}), name="student-my-materials"),
    # student chat
    path("api/v1/student/chat/rooms/",
         StudentChatViewSet.as_view({"get": "list"}), name="student-chat-rooms"),
    path("api/v1/student/chat/rooms/<uuid:pk>/",
         StudentChatViewSet.as_view({"get": "retrieve"}), name="student-chat-room"),
    path("api/v1/student/chat/rooms/<uuid:pk>/messages/",
         StudentChatViewSet.as_view({"get": "messages"}), name="student-chat-messages"),
    path("api/v1/student/chat/rooms/<uuid:pk>/send/",
         StudentChatViewSet.as_view({"post": "send"}), name="student-chat-send"),
    path("api/v1/student/chat/rooms/dm/<uuid:teacher_id>/",
         StudentChatViewSet.as_view({"post": "dm"}), name="student-chat-dm"),
    path("api/v1/student/chat/rooms/teachers/",
         StudentChatViewSet.as_view({"get": "teachers"}), name="student-chat-teachers"),
    # teacher: student leaves for own classes
    path("api/v1/teacher/leaves/students/",
         TeacherStudentLeavesViewSet.as_view({"get": "list"}),
         name="teacher-student-leaves"),
    path("api/v1/teacher/leaves/students/<uuid:pk>/",
         TeacherStudentLeavesViewSet.as_view({"get": "retrieve"}),
         name="teacher-student-leave-detail"),
    path("api/v1/teacher/leaves/students/<uuid:pk>/approve/",
         TeacherStudentLeavesViewSet.as_view({"post": "approve"}),
         name="teacher-student-leave-approve"),
    path("api/v1/teacher/leaves/students/<uuid:pk>/reject/",
         TeacherStudentLeavesViewSet.as_view({"post": "reject"}),
         name="teacher-student-leave-reject"),
    path("api/v1/teacher/leaves/students/<uuid:pk>/cancel/",
         TeacherStudentLeavesViewSet.as_view({"post": "cancel"}),
         name="teacher-student-leave-cancel"),
    # teacher chat
    path("api/v1/teacher/chat/rooms/",
         TeacherChatViewSet.as_view({"get": "list"}), name="teacher-chat-rooms"),
    path("api/v1/teacher/chat/rooms/<uuid:pk>/",
         TeacherChatViewSet.as_view({"get": "retrieve"}), name="teacher-chat-room"),
    path("api/v1/teacher/chat/rooms/<uuid:pk>/messages/",
         TeacherChatViewSet.as_view({"get": "messages"}), name="teacher-chat-messages"),
    path("api/v1/teacher/chat/rooms/<uuid:pk>/send/",
         TeacherChatViewSet.as_view({"post": "send"}), name="teacher-chat-send"),
path("api/v1/admin/", include("attendance.urls")),
    # teacher-scoped attendance
    path("api/v1/teacher/attendance/",
         TeacherAttendanceViewSet.as_view({"get": "list", "post": "mark"}),
         name="teacher-attendance-list"),
    path("api/v1/teacher/attendance/mark/",
         TeacherAttendanceViewSet.as_view({"post": "mark"}),
         name="teacher-attendance-mark"),
    path("api/v1/teacher/attendance/stats/",
         TeacherAttendanceViewSet.as_view({"get": "stats"}),
         name="teacher-attendance-stats"),
    path("api/v1/teacher/attendance/summary/",
         TeacherAttendanceViewSet.as_view({"get": "summary"}),
         name="teacher-attendance-summary"),

    # teacher-scoped roster
    path("api/v1/teacher/students/",
         TeacherStudentsViewSet.as_view({"get": "list"}),
         name="teacher-students-list"),
    path("api/v1/", include("classes.urls")),
    path("api/v1/", include("institutions.urls")),
    path("api/v1/chat/", include("chat.urls")),
    path("api/v1/leaves/", include("leaves.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
