# backend/apps/analytics/urls.py

from django.urls import path

from .views import ClassAnalyticsView, TeacherDashboardAnalyticsView

urlpatterns = [
    path('class/<uuid:class_id>/', ClassAnalyticsView.as_view(), name='class-analytics'),
    path('teacher/dashboard/', TeacherDashboardAnalyticsView.as_view(), name='teacher-analytics'),
]