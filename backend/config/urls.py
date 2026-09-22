"""
Root URL configuration.

Route layout:
    /admin/             Django's built-in admin (developer fallback only —
                        the institution admin experience is the React app)
    /api/v1/auth/       Login, refresh, me, logout (JWT)
    /api/v1/admin/      Institution admin API (users, stats)
    /api/v1/            All other business endpoints (classes, institutions)
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Developer-only fallback. Not the product's admin UI.
    path("admin/", admin.site.urls),

    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/admin/", include("admin_api.urls")),
    path("api/v1/", include("classes.urls")),
    path("api/v1/", include("institutions.urls")),
]