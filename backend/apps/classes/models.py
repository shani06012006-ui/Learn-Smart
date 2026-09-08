# backend/apps/classes/models.py

"""
Models for the classes app.
Handles class creation and student enrollment.
"""

import random
import string
import uuid

from django.conf import settings
from django.db import models


class Class(models.Model):
    """
    Class model representing a course/class created by a teacher.
    
    Each class has:
    - A unique join code for students to enroll
    - A teacher who created it
    - Basic information like name, subject, description
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    
    # The teacher who created this class
    # We use settings.AUTH_USER_MODEL to reference our custom User model
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_classes',
        limit_choices_to={'role': 'teacher'},  # Only teachers can create classes
    )
    
    # Basic class information
    name = models.CharField(
        max_length=255,
        help_text="Name of the class (e.g., 'Math 101')"
    )
    subject = models.CharField(
        max_length=100,
        help_text="Subject of the class (e.g., 'Mathematics')"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional description of the class"
    )
    
    # Auto-generated join code for students to enroll
    # This is what makes the platform work without complex invitations
    join_code = models.CharField(
        max_length=6,
        unique=True,
        blank=True,
        help_text="6-character code for students to join this class"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        """Metadata for the Class model"""
        ordering = ['-created_at']
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'
    
    def save(self, *args, **kwargs):
        """
        Override save to automatically generate a unique join code.
        Called when a class is created.
        """
        if not self.join_code:
            self.join_code = self.generate_unique_join_code()
        super().save(*args, **kwargs)
    
    def generate_unique_join_code(self):
        """
        Generate a unique 6-character alphanumeric join code.
        Keeps trying until it finds one that doesn't exist.
        """
        characters = string.ascii_uppercase + string.digits
        while True:
            # Generate a random 6-character code
            code = ''.join(random.choices(characters, k=6))
            # Check if this code already exists in the database
            if not Class.objects.filter(join_code=code).exists():
                return code
    
    def __str__(self):
        """String representation of the class"""
        return f"{self.name} - {self.subject} (Teacher: {self.teacher.email})"
    
    @property
    def student_count(self):
        """
        Helper property to get the number of enrolled students.
        Useful for displaying stats on the dashboard.
        """
        return self.enrollments.filter(is_active=True).count()


class Enrollment(models.Model):
    """
    Enrollment model linking students to classes.
    
    This is the "through" table that allows:
    - Multiple students to join one class
    - Multiple classes for one student
    - Tracking when a student joined
    - Ability to block/unblock a student from a class
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    
    # The student (must be a student role)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': 'student'},
    )
    
    # The class they're enrolled in
    class_obj = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    
    # Track enrollment status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the enrollment is active"
    )
    is_blocked = models.BooleanField(
        default=False,
        help_text="Whether the student is blocked from this class"
    )
    
    # Timestamps
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        """Metadata for the Enrollment model"""
        unique_together = ['student', 'class_obj']  # Prevent duplicate enrollments
        ordering = ['-enrolled_at']
        verbose_name = 'Enrollment'
        verbose_name_plural = 'Enrollments'
    
    def __str__(self):
        """String representation of the enrollment"""
        return f"{self.student.email} -> {self.class_obj.name}"