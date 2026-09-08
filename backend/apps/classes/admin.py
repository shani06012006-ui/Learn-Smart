# backend/apps/classes/admin.py

"""
Admin interface configuration for the classes app.
"""

from django.contrib import admin

from .models import Class, Enrollment


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    """Admin configuration for Class model"""
    
    list_display = ('name', 'subject', 'teacher', 'join_code', 'student_count', 'created_at')
    list_filter = ('subject', 'created_at')
    search_fields = ('name', 'subject', 'teacher__email', 'join_code')
    readonly_fields = ('join_code', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {
            'fields': ('name', 'subject', 'description', 'teacher')
        }),
        ('Access', {
            'fields': ('join_code',),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    """Admin configuration for Enrollment model"""
    
    list_display = ('student', 'class_obj', 'is_active', 'is_blocked', 'enrolled_at')
    list_filter = ('is_active', 'is_blocked', 'enrolled_at')
    search_fields = ('student__email', 'class_obj__name')
    readonly_fields = ('enrolled_at', 'updated_at')
    ordering = ('-enrolled_at',)
    
    fieldsets = (
        (None, {
            'fields': ('student', 'class_obj')
        }),
        ('Status', {
            'fields': ('is_active', 'is_blocked')
        }),
        ('Timestamps', {
            'fields': ('enrolled_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )