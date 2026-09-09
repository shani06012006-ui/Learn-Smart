# backend/apps/classes/models.py

import random
import string
import uuid

from django.conf import settings
from django.db import models


class Class(models.Model):
    """
    Class model representing a course/class created by a teacher.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_classes',
        limit_choices_to={'user_type': 'teacher'},
    )
    
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    join_code = models.CharField(
        max_length=6,
        unique=True,
        blank=True,
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.join_code:
            self.join_code = self.generate_unique_join_code()
        super().save(*args, **kwargs)
    
    def generate_unique_join_code(self):
        characters = string.ascii_uppercase + string.digits
        while True:
            code = ''.join(random.choices(characters, k=6))
            if not Class.objects.filter(join_code=code).exists():
                return code
    
    def __str__(self):
        return f"{self.name} - {self.subject} (Teacher: {self.teacher.email})"
    
    @property
    def student_count(self):
        return self.enrollments.filter(is_active=True).count()


class Enrollment(models.Model):
    """
    Enrollment model linking students to classes.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'user_type': 'student'},
    )
    
    class_obj = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    
    is_active = models.BooleanField(default=True)
    is_blocked = models.BooleanField(default=False)
    
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'class_obj']
        ordering = ['-enrolled_at']
    
    def __str__(self):
        return f"{self.student.email} -> {self.class_obj.name}"