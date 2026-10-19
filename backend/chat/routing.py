# backend/chat/routing.py
from django.urls import re_path
from .consumers import ThreadChatConsumer, NotificationConsumer

websocket_urlpatterns = [
    re_path(r"^ws/chat/thread/(?P<thread_id>[^/]+)/$", ThreadChatConsumer.as_asgi()),
    
    re_path(r"^ws/notifications/$", NotificationConsumer.as_asgi()),  
]