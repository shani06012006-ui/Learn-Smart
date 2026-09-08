# backend/apps/materials/urls.py

from django.urls import path
from .views import (
    MaterialCategoryListCreateView,
    StudyMaterialListCreateView,
    StudyMaterialDetailView,
    AnnouncementListCreateView,
    MaterialCommentListCreateView,
)

urlpatterns = [
    # Categories
    path('classes/<uuid:class_id>/categories/', MaterialCategoryListCreateView.as_view(), name='categories'),
    
    # Materials
    path('classes/<uuid:class_id>/materials/', StudyMaterialListCreateView.as_view(), name='materials'),
    path('materials/<uuid:pk>/', StudyMaterialDetailView.as_view(), name='material-detail'),
    
    # Announcements
    path('classes/<uuid:class_id>/announcements/', AnnouncementListCreateView.as_view(), name='announcements'),
    
    # Comments
    path('materials/<uuid:material_id>/comments/', MaterialCommentListCreateView.as_view(), name='comments'),
]