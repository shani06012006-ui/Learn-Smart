# backend/apps/exams/urls.py

from django.urls import path

from .views import (
    ExamDetailView,
    ExamListCreateView,
    ExamResultsView,
    QuestionListCreateView,
    StartExamView,
    SubmitAnswerView,
    SubmitExamView,
)

urlpatterns = [
    # Exams
    path('classes/<uuid:class_id>/exams/', ExamListCreateView.as_view(), name='exams'),
    path('exams/<uuid:id>/', ExamDetailView.as_view(), name='exam-detail'),
    
    # Questions
    path('exams/<uuid:exam_id>/questions/', QuestionListCreateView.as_view(), name='questions'),
    
    # Exam taking
    path('exams/<uuid:exam_id>/start/', StartExamView.as_view(), name='start-exam'),
    path('attempts/<uuid:attempt_id>/answer/', SubmitAnswerView.as_view(), name='submit-answer'),
    path('attempts/<uuid:attempt_id>/submit/', SubmitExamView.as_view(), name='submit-exam'),
    
    # Results
    path('attempts/<uuid:id>/results/', ExamResultsView.as_view(), name='exam-results'),
]