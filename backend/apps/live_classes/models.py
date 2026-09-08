# backend/apps/live_classes/models.py

import uuid

from django.conf import settings
from django.db import models

from apps.classes.models import Class


class LiveClass(models.Model):
    """Live class/meeting schedule"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='live_classes')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    meeting_link = models.URLField(blank=True, null=True)
    meeting_id = models.CharField(max_length=255, blank=True, null=True)
    meeting_password = models.CharField(max_length=255, blank=True, null=True)
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_active = models.BooleanField(default=False)
    
    recording_url = models.URLField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_time']
        verbose_name_plural = 'Live Classes'
    
    def __str__(self):
        return f"{self.title} - {self.start_time}"


class LiveClassAttendance(models.Model):
    """Track attendance for live classes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    live_class = models.ForeignKey(LiveClass, on_delete=models.CASCADE, related_name='attendance')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'user_type': 'student'})
    
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['live_class', 'student']
    
    def __str__(self):
        return f"{self.student.email} - {self.live_class.title}"