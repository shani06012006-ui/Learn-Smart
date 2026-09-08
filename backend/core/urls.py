# backend/core/urls.py

"""
Main URL configuration for the project.
Includes all app URLs.
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.classes.urls')),
]