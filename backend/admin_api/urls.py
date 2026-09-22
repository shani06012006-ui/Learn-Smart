from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminStatsView, AdminUserViewSet

router = DefaultRouter()
router.register("users", AdminUserViewSet, basename="admin-user")

urlpatterns = [
    path("", include(router.urls)),
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
]