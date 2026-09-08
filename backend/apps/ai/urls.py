# backend/apps/ai/urls.py

from django.urls import path

from .views import (
    AnalyzePerformanceView,
    GeneratePracticeQuestionsView,
    GenerateQuestionsView,
    GradeAnswerView,
)

urlpatterns = [
    path('generate-questions/', GenerateQuestionsView.as_view(), name='generate-questions'),
    path('grade/<uuid:question_id>/', GradeAnswerView.as_view(), name='grade-answer'),
    path('analyze/<uuid:student_id>/', AnalyzePerformanceView.as_view(), name='analyze-performance'),
    path('practice-questions/', GeneratePracticeQuestionsView.as_view(), name='practice-questions'),
]