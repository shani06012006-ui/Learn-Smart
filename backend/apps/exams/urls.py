# backend/apps/exams/urls.py

from django.urls import path
from . import views

app_name = 'exams'

urlpatterns = [
    # Exam CRUD
    path('classes/<uuid:class_id>/exams/', views.ExamListCreateView.as_view(), name='exam-list-create'),
    path('exams/<uuid:id>/', views.ExamDetailView.as_view(), name='exam-detail'),
    
    # Questions
    path('exams/<uuid:exam_id>/questions/', views.QuestionListCreateView.as_view(), name='question-list-create'),
    
    # Exam Taking
    path('exams/<uuid:exam_id>/start/', views.StartExamView.as_view(), name='start-exam'),
    path('attempts/<uuid:attempt_id>/answer/', views.SubmitAnswerView.as_view(), name='submit-answer'),
    path('attempts/<uuid:attempt_id>/submit/', views.SubmitExamView.as_view(), name='submit-exam'),
    path('attempts/<uuid:id>/results/', views.ExamResultsView.as_view(), name='exam-results'),
]