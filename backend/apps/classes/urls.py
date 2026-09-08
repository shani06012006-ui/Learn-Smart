# backend/apps/classes/urls.py

from django.urls import path

from .views import (
    BlockStudentView,
    ClassDetailView,
    ClassListCreateView,
    ClassStudentsView,
    JoinClassView,
    LeaveClassView,
    StudentStatusView,
)

urlpatterns = [
    # Class CRUD endpoints
    path('classes/', ClassListCreateView.as_view(), name='class-list-create'),
    path('classes/<uuid:id>/', ClassDetailView.as_view(), name='class-detail'),
    
    # Class join/leave endpoints
    path('classes/join/', JoinClassView.as_view(), name='join-class'),
    path('classes/<uuid:class_id>/leave/', LeaveClassView.as_view(), name='leave-class'),
    
    # Student management
    path('classes/<uuid:class_id>/students/', ClassStudentsView.as_view(), name='class-students'),
    path('classes/<uuid:class_id>/students/status/', StudentStatusView.as_view(), name='student-status'),
    path('classes/<uuid:class_id>/students/<uuid:student_id>/block/', BlockStudentView.as_view(), name='block-student'),
]