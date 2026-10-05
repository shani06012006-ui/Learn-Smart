from django.urls import path

from admin_api.views import RoleAwareLiveClassView, TimetableView
from .views import (
    ClassCourseDetailView,
    ClassCourseListCreateView,
    ClassMaterialsView,
    ClassStudentDetailView,
    ClassStudentsView,
    JoinClassView,
    MaterialDetailView,
    MaterialListView,
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
    path(
        "classes/<uuid:class_id>/materials/",
        ClassMaterialsView.as_view(),
        name="class-materials",
    ),
    path("materials/", MaterialListView.as_view(), name="material-list"),
    path(
        "materials/<uuid:material_id>/",
        MaterialDetailView.as_view(),
        name="material-detail",
    ),
    path("enrollments/join/", JoinClassView.as_view(), name="enrollment-join"),
    path("timetable/", TimetableView.as_view(), name="timetable"),
    path("live-classes/", RoleAwareLiveClassView.as_view(), name="live-classes"),
]
