# backend/core/asgi.py

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Import consumers
from apps.communication.consumers import ChatConsumer, NotificationConsumer

websocket_urlpatterns = [
    path('ws/chat/<uuid:room_id>/', ChatConsumer.as_asgi()),
    path('ws/notifications/<uuid:user_id>/', NotificationConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})