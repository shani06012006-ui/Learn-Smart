"""
Root URL configuration.

Route layout:
    /admin/             Django's built-in admin (developer fallback only â€”
                        the institution admin experience is the React app)
    /api/v1/auth/       Login, refresh, me, logout (JWT)
    /api/v1/admin/      Institution admin API (users, stats)
    /api/v1/            All other business endpoints (classes, institutions)
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Developer-only fallback. Not the product's admin UI.
    path("admin/", admin.site.urls),

    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/admin/", include("admin_api.urls")),
path("api/v1/admin/", include("attendance.urls")),
    path("api/v1/", include("classes.urls")),
    path("api/v1/", include("institutions.urls")),
    path("api/v1/chat/", include("chat.urls")),
    path("api/v1/leaves/", include("leaves.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
