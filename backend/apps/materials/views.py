# backend/apps/materials/views.py

from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from apps.classes.models import Class, Enrollment

from .models import MaterialCategory, StudyMaterial, Announcement
from .serializers import (
    MaterialCategorySerializer,
    StudyMaterialSerializer,
    StudyMaterialListSerializer,
    AnnouncementSerializer,
)


class IsTeacherOrReadOnly(permissions.BasePermission):
    """Custom permission: teachers can edit, students can only view"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.user_type == 'teacher'
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user == obj.created_by


class IsEnrolledOrTeacher(permissions.BasePermission):
    """Students must be enrolled in the class to view materials"""
    
    def has_permission(self, request, view):
        if request.user.user_type == 'teacher':
            return True
        
        class_id = view.kwargs.get('class_id')
        if class_id:
            return Enrollment.objects.filter(
                student=request.user,
                class_obj_id=class_id,
                is_active=True
            ).exists()
        return False


class MaterialCategoryListCreateView(generics.ListCreateAPIView):
    """List all categories for a class or create new one"""
    serializer_class = MaterialCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsEnrolledOrTeacher]
    
    def get_queryset(self):
        class_id = self.kwargs['class_id']
        return MaterialCategory.objects.filter(class_obj_id=class_id)
    
    def perform_create(self, serializer):
        class_obj = get_object_or_404(Class, id=self.kwargs['class_id'])
        if self.request.user.user_type != 'teacher':
            raise permissions.PermissionDenied("Only teachers can create categories")
        serializer.save(class_obj=class_obj)


class StudyMaterialListCreateView(generics.ListCreateAPIView):
    """List all materials for a class or upload new material"""
    permission_classes = [permissions.IsAuthenticated, IsEnrolledOrTeacher]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return StudyMaterialListSerializer
        return StudyMaterialSerializer
    
    def get_queryset(self):
        class_id = self.kwargs['class_id']
        user = self.request.user
        
        queryset = StudyMaterial.objects.filter(class_obj_id=class_id)
        
        if user.user_type == 'student':
            queryset = queryset.filter(is_published=True)
        
        return queryset
    
    def perform_create(self, serializer):
        class_obj = get_object_or_404(Class, id=self.kwargs['class_id'])
        if self.request.user.user_type != 'teacher':
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
    permission_classes = [permissions.IsAuthenticated, IsEnrolledOrTeacher]
    
    def get_queryset(self):
        class_id = self.kwargs['class_id']
        user = self.request.user
        
        queryset = Announcement.objects.filter(
            class_obj_id=class_id,
            is_published=True
        )
        
        if user.user_type == 'student':
            queryset = queryset.filter(is_published=True)
        
        return queryset
    
    def perform_create(self, serializer):
        class_obj = get_object_or_404(Class, id=self.kwargs['class_id'])
        if self.request.user.user_type != 'teacher':
            raise permissions.PermissionDenied("Only teachers can create announcements")
        serializer.save(class_obj=class_obj)


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a specific announcement"""
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'student':
            return Announcement.objects.filter(is_published=True)
        return Announcement.objects.all()