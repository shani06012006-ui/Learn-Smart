from rest_framework.routers import DefaultRouter

from .views import InstitutionViewSet

router = DefaultRouter()
router.register("institutions", InstitutionViewSet, basename="institution")

urlpatterns = router.urls
