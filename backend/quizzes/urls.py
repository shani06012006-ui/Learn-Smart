from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import QuizViewSet, GenerateFromPdfView

router = DefaultRouter()
router.register(r"", QuizViewSet, basename="quiz")

urlpatterns = [
    path("generate-from-pdf/", GenerateFromPdfView.as_view(), name="quiz-generate-from-pdf"),
    path("", include(router.urls)),
]