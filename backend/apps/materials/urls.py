# backend/apps/materials/urls.py

from django.urls import path
from .views import (
    MaterialCategoryListCreateView,
    StudyMaterialListCreateView,
    StudyMaterialDetailView,
    AnnouncementListCreateView,
    AnnouncementDetailView,
)

app_name = 'materials'

urlpatterns = [
    # Categories
    path('classes/<uuid:class_id>/categories/', 
         MaterialCategoryListCreateView.as_view(), 
         name='category-list-create'),
    
    # Materials
    path('classes/<uuid:class_id>/materials/', 
         StudyMaterialListCreateView.as_view(), 
         name='material-list-create'),
    path('materials/<uuid:pk>/', 
         StudyMaterialDetailView.as_view(), 
         name='material-detail'),
    
    # Announcements
    path('classes/<uuid:class_id>/announcements/', 
         AnnouncementListCreateView.as_view(), 
         name='announcement-list-create'),
    path('announcements/<uuid:pk>/', 
         AnnouncementDetailView.as_view(), 
         name='announcement-detail'),
]