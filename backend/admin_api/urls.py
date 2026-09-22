from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminStatsView, AdminUserViewSet, InstitutionCourseViewSet

router = DefaultRouter()
router.register("users", AdminUserViewSet, basename="admin-user")
router.register("courses", InstitutionCourseViewSet, basename="institution-course")

urlpatterns = [
    path("", include(router.urls)),
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
]