# backend/apps/materials/models.py

import uuid

from django.conf import settings
from django.db import models

from apps.classes.models import Class


class MaterialCategory(models.Model):
    """Categories for organizing learning materials"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='material_categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['class_obj', 'name']
        verbose_name_plural = 'Material Categories'
    
    def __str__(self):
        return f"{self.class_obj.name} - {self.name}"


class StudyMaterial(models.Model):
    """Learning materials uploaded by teachers"""
    MATERIAL_TYPES = (
        ('note', 'Note'),
        ('pdf', 'PDF Document'),
        ('video', 'Video'),
        ('link', 'External Link'),
        ('presentation', 'Presentation'),
        ('assignment', 'Assignment'),
        ('image', 'Image'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='materials')
    category = models.ForeignKey(MaterialCategory, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    material_type = models.CharField(max_length=20, choices=MATERIAL_TYPES)
    
    # Content fields (only one will be used based on type)
    content = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='materials/%Y/%m/%d/', null=True, blank=True)
    link_url = models.URLField(blank=True, null=True)
    thumbnail = models.ImageField(upload_to='thumbnails/%Y/%m/%d/', null=True, blank=True)
    
    # Metadata
    is_published = models.BooleanField(default=True)
    is_pinned = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    download_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
    
    def __str__(self):
        return self.title


class Announcement(models.Model):
    """Class announcements"""
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='announcements')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    title = models.CharField(max_length=255)
    content = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    is_published = models.BooleanField(default=True)
    is_pinned = models.BooleanField(default=False)
    
    expires_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
    
    def __str__(self):
        return self.title


class MaterialComment(models.Model):
    """Comments on study materials"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    material = models.ForeignKey(StudyMaterial, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.material.title}"