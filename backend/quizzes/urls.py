# backend/quizzes/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    QuizViewSet, 
    GenerateFromPdfView,
    StudentQuizListView,
    StudentStartQuizAttemptView,
    StudentSubmitQuizAttemptView,
    StudentQuizAttemptResultView,
    TeacherQuizSubmissionsView
)

router = DefaultRouter()
router.register(r"", QuizViewSet, basename="quiz")

urlpatterns = [
    # Teacher endpoints
    path("generate-from-pdf/", GenerateFromPdfView.as_view(), name="quiz-generate-from-pdf"),
    path("<uuid:quiz_id>/submissions/", TeacherQuizSubmissionsView.as_view(), name="quiz-submissions"),
    
    # Student endpoints
    path("student/quizzes/", StudentQuizListView.as_view(), name="student-quiz-list"),
    path("student/quizzes/<uuid:quiz_id>/start/", StudentStartQuizAttemptView.as_view(), name="student-quiz-start"),
    path("student/quizzes/<uuid:quiz_id>/submit/", StudentSubmitQuizAttemptView.as_view(), name="student-quiz-submit"),
    path("student/quiz-attempts/<uuid:attempt_id>/", StudentQuizAttemptResultView.as_view(), name="student-quiz-result"),

    # Standard CRUD routes (list, create, detail, publish, unpublish)
    path("", include(router.urls)),
]