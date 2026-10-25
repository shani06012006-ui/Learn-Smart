from django.urls import path
from . import views

app_name = "notifications"

urlpatterns = [
    # Get the list of notifications for the bell popover
    path("", views.NotificationListView.as_view(), name="notification-list"),
    
    # Mark ALL notifications as read
    path("read-all/", views.NotificationMarkAllReadView.as_view(), name="notification-mark-all-read"),
    
    # Mark a SINGLE notification as read (NEW)
    path("<uuid:pk>/read/", views.NotificationMarkReadView.as_view(), name="notification-mark-read"),
]