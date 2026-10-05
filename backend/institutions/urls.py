from rest_framework.routers import DefaultRouter

from .views import GradeViewSet, InstitutionViewSet

router = DefaultRouter()
router.register("institutions", InstitutionViewSet, basename="institution")
router.register("grades", GradeViewSet, basename="grade")

urlpatterns = router.urls
