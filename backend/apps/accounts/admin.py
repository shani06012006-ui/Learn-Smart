from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin configuration for the User model.
    """

    list_display = (
        'email',
        'username',
        'user_type',
        'is_active',
        'is_staff',
        'created_at',
    )

    list_filter = (
        'user_type',
        'is_active',
        'is_staff',
        'is_superuser',
    )

    search_fields = (
        'email',
        'username',
        'first_name',
        'last_name',
    )

    ordering = ('email',)

    fieldsets = (
        (None, {
            'fields': ('email', 'username', 'password')
        }),
        ('Personal Info', {
            'fields': (
                'first_name',
                'last_name',
                'phone',
                'profile_picture',
            )
        }),
        ('Role & Permissions', {
            'fields': (
                'user_type',
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions',
            )
        }),
        ('Important dates', {
            'fields': (
                'last_login',
                'created_at',
                'updated_at',
            )
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'username',
                'password1',
                'password2',
                'user_type',
            ),
        }),
    )