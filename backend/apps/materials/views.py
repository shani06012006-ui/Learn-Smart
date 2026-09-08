# backend/apps/materials/views.py

from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.parsers import FormParser, MultiPartParser

from apps.classes.models import Class

from .models import Announcement, MaterialCategory, MaterialComment, StudyMaterial
from .serializers import (
    AnnouncementSerializer,
    MaterialCategorySerializer,
    MaterialCommentSerializer,
    StudyMaterialSerializer,
)


class IsTeacherOrReadOnly(permissions.BasePermission):
    """Custom permission: teachers can edit, students can only view"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_teacher
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user == obj.created_by


class MaterialCategoryListCreateView(generics.ListCreateAPIView):
    """List all categories for a class or create new one"""
    serializer_class = MaterialCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        class_id = self.kwargs['class_id']
        return MaterialCategory.objects.filter(class_obj_id=class_id)
    
    def perform_create(self, serializer):
        class_obj = get_object_or_404(Class, id=self.kwargs['class_id'])
        if not self.request.user.is_teacher:
            raise permissions.PermissionDenied("Only teachers can create categories")
        serializer.save(class_obj=class_obj)


class StudyMaterialListCreateView(generics.ListCreateAPIView):
    """List all materials for a class or upload new material"""
    serializer_class = StudyMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        class_id = self.kwargs['class_id']
        return StudyMaterial.objects.filter(class_obj_id=class_id, is_published=True)
    
    def perform_create(self, serializer):
        class_obj = get_object_or_404(Class, id=self.kwargs['class_id'])
        if not self.request.user.is_teacher:
            raise permissions.PermissionDenied("Only teachers can upload materials")
        serializer.save(class_obj=class_obj)


class StudyMaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a specific material"""
    queryset = StudyMaterial.objects.all()
    serializer_class = StudyMaterialSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        return super().retrieve(request, *args, **kwargs)


class AnnouncementListCreateView(generics.ListCreateAPIView):
    """List all announcements for a class or create new one"""
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        class_id = self.kwargs['class_id']
        return Announcement.objects.filter(
            class_obj_id=class_id,
            is_published=True
        )
    
    def perform_create(self, serializer):
        class_obj = get_object_or_404(Class, id=self.kwargs['class_id'])
        if not self.request.user.is_teacher:
            raise permissions.PermissionDenied("Only teachers can create announcements")
        serializer.save(class_obj=class_obj)


class MaterialCommentListCreateView(generics.ListCreateAPIView):
    """List all comments for a material or add a comment"""
    serializer_class = MaterialCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        material_id = self.kwargs['material_id']
        return MaterialComment.objects.filter(material_id=material_id)
    
    def perform_create(self, serializer):
        material = get_object_or_404(StudyMaterial, id=self.kwargs['material_id'])
        serializer.save(material=material)