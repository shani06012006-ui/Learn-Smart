"""
Root URL configuration.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from classes.views import StudentAnnouncementsView

from attendance.views import AttendanceViewSet, TeacherAttendanceViewSet, TeacherStudentsViewSet
from classes.views import TeacherAnnouncementsViewSet
from accounts.views import TeacherColleaguesView
from accounts.student_login import StudentLoginView
from attendance.student_views import StudentSelfViewSet
from chat.student_views import StudentChatViewSet, TeacherChatViewSet
from admin_api.views import PerformanceTrendView, TeacherPerformanceTrendView
from leaves.views import TeacherStudentLeavesViewSet
from quizzes.views import ( StudentQuizListView, StudentStartQuizAttemptView, StudentSubmitQuizAttemptView, StudentQuizAttemptResultView, TeacherQuizSubmissionsView, )
from classes.sections_views import (
    AdminSectionsView, AdminSectionDetailView, SectionAssignStudentsView,SectionStudentsView, 
)
from admin_api.timetable_generate_views import AdminGenerateTimetableView
from admin_api.substitution_views import (
    AdminAbsencesView, SuggestSubstitutesView, AssignSubstituteView,
)


urlpatterns = [
    path("admin/", admin.site.urls),

    # ============================================================
    # Custom admin endpoints — MUST come BEFORE the admin_api include,
    # otherwise the admin_api router's `<pk>` patterns will swallow them.
    # ============================================================
    path("api/v1/admin/timetable/generate/", AdminGenerateTimetableView.as_view(), name="admin-timetable-generate"),
    path("api/v1/admin/absences/", AdminAbsencesView.as_view(), name="admin-absences"),
    path("api/v1/admin/substitutions/suggest/", SuggestSubstitutesView.as_view(), name="admin-substitutions-suggest"),
    path("api/v1/admin/substitutions/assign/", AssignSubstituteView.as_view(), name="admin-substitutions-assign"),
    path("api/v1/admin/sections/", AdminSectionsView.as_view(), name="admin-sections"),
    path("api/v1/admin/sections/<uuid:pk>/", AdminSectionDetailView.as_view(), name="admin-section-detail"),
    path("api/v1/admin/sections/<uuid:pk>/assign/", SectionAssignStudentsView.as_view(), name="admin-section-assign"),
    path("api/v1/admin/dashboard/performance-trend/", PerformanceTrendView.as_view(), name="admin-performance-trend"),

    # ============================================================
    # Auth
    # ============================================================
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/auth/student-login/", StudentLoginView.as_view(), name="student-pin-login"),

    # ============================================================
    # Teacher-scoped endpoints
    # ============================================================
    path("api/v1/teacher/dashboard/performance-trend/", TeacherPerformanceTrendView.as_view(), name="teacher-performance-trend"),

    path("api/v1/teacher/attendance/", TeacherAttendanceViewSet.as_view({"get": "list", "post": "mark"}), name="teacher-attendance-list"),
    path("api/v1/teacher/attendance/mark/", TeacherAttendanceViewSet.as_view({"post": "mark"}), name="teacher-attendance-mark"),
    path("api/v1/teacher/attendance/stats/", TeacherAttendanceViewSet.as_view({"get": "stats"}), name="teacher-attendance-stats"),
    path("api/v1/teacher/attendance/summary/", TeacherAttendanceViewSet.as_view({"get": "summary"}), name="teacher-attendance-summary"),

    path("api/v1/teacher/students/", TeacherStudentsViewSet.as_view({"get": "list"}), name="teacher-students-list"),
    path("api/v1/teacher/teachers/", TeacherColleaguesView.as_view(), name="teacher-colleagues"),
    path("api/v1/teacher/announcements/", TeacherAnnouncementsViewSet.as_view({"get": "list", "post": "create"}), name="teacher-announcements"),
    path("api/v1/teacher/announcements/<uuid:pk>/", TeacherAnnouncementsViewSet.as_view({
        "get": "retrieve", "patch": "partial_update", "delete": "destroy",
    }), name="teacher-announcement-detail"),

    path("api/v1/teacher/leaves/students/", TeacherStudentLeavesViewSet.as_view({"get": "list"}), name="teacher-student-leaves"),
    path("api/v1/teacher/leaves/students/<uuid:pk>/", TeacherStudentLeavesViewSet.as_view({"get": "retrieve"}), name="teacher-student-leave-detail"),
    path("api/v1/teacher/leaves/students/<uuid:pk>/approve/", TeacherStudentLeavesViewSet.as_view({"post": "approve"}), name="teacher-student-leave-approve"),
    path("api/v1/teacher/leaves/students/<uuid:pk>/reject/", TeacherStudentLeavesViewSet.as_view({"post": "reject"}), name="teacher-student-leave-reject"),
    path("api/v1/teacher/leaves/students/<uuid:pk>/cancel/", TeacherStudentLeavesViewSet.as_view({"post": "cancel"}), name="teacher-student-leave-cancel"),

    path("api/v1/teacher/chat/rooms/", TeacherChatViewSet.as_view({"get": "list"}), name="teacher-chat-rooms"),
    path("api/v1/teacher/chat/rooms/<uuid:pk>/", TeacherChatViewSet.as_view({"get": "retrieve"}), name="teacher-chat-room"),
    path("api/v1/teacher/chat/rooms/<uuid:pk>/messages/", TeacherChatViewSet.as_view({"get": "messages"}), name="teacher-chat-messages"),
    path("api/v1/teacher/chat/rooms/<uuid:pk>/send/", TeacherChatViewSet.as_view({"post": "send"}), name="teacher-chat-send"),

    # ============================================================
    # Student-scoped endpoints
    # ============================================================
    path("api/v1/student/me/", StudentSelfViewSet.as_view({"get": "me"}), name="student-me"),
    path("api/v1/student/my-classes/", StudentSelfViewSet.as_view({"get": "my_classes"}), name="student-my-classes"),
    path("api/v1/admin/sections/<uuid:pk>/students/", SectionStudentsView.as_view(), name="admin-section-students"),
    path("api/v1/student/my-attendance/", StudentSelfViewSet.as_view({"get": "my_attendance"}), name="student-my-attendance"),
    path("api/v1/student/my-grades/", StudentSelfViewSet.as_view({"get": "my_grades"}), name="student-my-grades"),
    path("api/v1/student/my-timetable/", StudentSelfViewSet.as_view({"get": "my_timetable"}), name="student-my-timetable"),
    path("api/v1/student/my-materials/", StudentSelfViewSet.as_view({"get": "my_materials"}), name="student-my-materials"),
    path("api/v1/student/quizzes/", StudentQuizListView.as_view(), name="student-quizzes"),
    path("api/v1/student/chat/rooms/", StudentChatViewSet.as_view({"get": "list"}), name="student-chat-rooms"),
    path("api/v1/student/chat/rooms/<uuid:pk>/", StudentChatViewSet.as_view({"get": "retrieve"}), name="student-chat-room"),
    path("api/v1/student/chat/rooms/<uuid:pk>/messages/", StudentChatViewSet.as_view({"get": "messages"}), name="student-chat-messages"),
    path("api/v1/student/chat/rooms/<uuid:pk>/send/", StudentChatViewSet.as_view({"post": "send"}), name="student-chat-send"),
    path("api/v1/student/chat/rooms/dm/<uuid:teacher_id>/", StudentChatViewSet.as_view({"post": "dm"}), name="student-chat-dm"),
    path("api/v1/student/chat/rooms/teachers/", StudentChatViewSet.as_view({"get": "teachers"}), name="student-chat-teachers"),
    path("api/v1/student/quizzes/", StudentQuizListView.as_view(), name="student-quizzes"),
    path("api/v1/student/quizzes/<uuid:quiz_id>/start/",StudentStartQuizAttemptView.as_view(), name="student-quiz-start"),
    path("api/v1/student/quizzes/<uuid:quiz_id>/submit/",StudentSubmitQuizAttemptView.as_view(),name="student-quiz-submit" ),
    path("api/v1/student/quiz-attempts/<uuid:attempt_id>/",StudentQuizAttemptResultView.as_view(),name="student-quiz-attempt-result" ),
    path("api/v1/student/announcements/",StudentAnnouncementsView.as_view(),name="student-announcements", ),     
    path("api/v1/quizzes/<uuid:quiz_id>/submissions/", TeacherQuizSubmissionsView.as_view(), name="teacher-quiz-submissions" ),
    
    # ============================================================
    # Top-level attendance
    # ============================================================
    path("api/v1/attendance/", AttendanceViewSet.as_view({"get": "list"}), name="attendance-list"),
    path("api/v1/attendance/bulk-save/", AttendanceViewSet.as_view({"post": "bulk_save"}), name="attendance-bulk-save"),

    # ============================================================
    # Third-party app routers (MUST come last)
    # ============================================================
    path("api/v1/admin/", include("admin_api.urls")),
    path("api/v1/admin/", include("attendance.urls")),
    path("api/v1/", include("classes.urls")),
    path("api/v1/", include("institutions.urls")),
    path("api/v1/chat/", include("chat.urls")),
    path("api/v1/leaves/", include("leaves.urls")),
    path("api/v1/quizzes/", include("quizzes.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)