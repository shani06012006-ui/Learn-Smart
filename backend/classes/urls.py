from django.urls import path

from admin_api.views import TimetableView
from .views import (
    ClassCourseDetailView,
    ClassCourseListCreateView,
    ClassStudentDetailView,
    ClassStudentsView,
    JoinClassView,
)

urlpatterns = [
    path("classes/", ClassCourseListCreateView.as_view(), name="class-list-create"),
    path("classes/<uuid:id>/", ClassCourseDetailView.as_view(), name="class-detail"),
    path("classes/<uuid:class_id>/students/", ClassStudentsView.as_view(), name="class-students"),
    path(
        "classes/<uuid:class_id>/students/<uuid:enrollment_id>/",
        ClassStudentDetailView.as_view(),
        name="class-student-detail",
    ),
    path("enrollments/join/", JoinClassView.as_view(), name="enrollment-join"),
    path("timetable/", TimetableView.as_view(), name="timetable"),
]
