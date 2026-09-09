# backend/apps/exams/models.py

import uuid

from django.conf import settings
from django.db import models

from apps.classes.models import Class


class Exam(models.Model):
    """Exam/Quiz model"""
    EXAM_TYPES = (
        ('quiz', 'Quiz'),
        ('exam', 'Exam'),
        ('practice', 'Practice Test'),
        ('assignment', 'Assignment'),
    )
    
    DIFFICULTY_LEVELS = (
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='exams')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPES)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_LEVELS, default='medium')
    
    total_marks = models.IntegerField()
    passing_percentage = models.FloatField(default=40)
    
    duration_minutes = models.IntegerField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    is_published = models.BooleanField(default=False)
    allow_retake = models.BooleanField(default=False)
    max_attempts = models.IntegerField(default=1)
    shuffle_questions = models.BooleanField(default=True)
    show_result_immediately = models.BooleanField(default=False)
    instructions = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def total_questions(self):
        return self.questions.count()
    
    @property
    def total_attempts(self):
        return self.attempts.filter(status='completed').count()


class Question(models.Model):
    """Question model for exams"""
    QUESTION_TYPES = (
        ('mcq', 'Multiple Choice'),
        ('short', 'Short Answer'),
        ('long', 'Long Answer'),
        ('true_false', 'True/False'),
        ('fill_blank', 'Fill in the Blank'),
        ('matching', 'Matching'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions')
    
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    marks = models.IntegerField()
    difficulty = models.CharField(max_length=10, choices=Exam.DIFFICULTY_LEVELS, default='medium')
    
    options = models.JSONField(default=list, blank=True)
    correct_answer = models.TextField()
    explanation = models.TextField(blank=True, null=True)
    
    order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}"


class ExamAttempt(models.Model):
    """Student attempt at an exam"""
    STATUS_CHOICES = (
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
        ('graded', 'Graded'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exam_attempts',
        limit_choices_to={'user_type': 'student'}
    )
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    total_marks_obtained = models.FloatField(default=0)
    total_correct = models.IntegerField(default=0)
    total_wrong = models.IntegerField(default=0)
    total_unanswered = models.IntegerField(default=0)
    
    teacher_feedback = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['student', 'exam']
    
    def __str__(self):
        return f"{self.student.email} - {self.exam.title}"


class StudentAnswer(models.Model):
    """Individual answer for each question in an exam attempt"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    
    answer_text = models.TextField(blank=True, null=True)
    selected_option = models.IntegerField(null=True, blank=True)
    
    is_correct = models.BooleanField(null=True, blank=True)
    marks_obtained = models.FloatField(default=0)
    
    ai_feedback = models.TextField(blank=True, null=True)
    ai_confidence = models.FloatField(null=True, blank=True)
    
    time_taken_seconds = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['attempt', 'question']
    
    def __str__(self):
        return f"{self.attempt.student.email} - Q{self.question.order}"