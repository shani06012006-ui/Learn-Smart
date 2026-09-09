# backend/core/asgi.py

import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# django.setup() MUST happen (via get_asgi_application()) before importing
# anything that touches the app registry (e.g. consumers.py calls
# get_user_model() at import time). Importing consumers before this line
# raises AppRegistryNotReady when the ASGI app is started directly
# (e.g. `daphne core.asgi:application`), even though it can appear to work
# under `manage.py runserver` because manage.py already calls setup() first.
from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path

from apps.communication.consumers import ChatConsumer, NotificationConsumer

websocket_urlpatterns = [
    path('ws/chat/<uuid:room_id>/', ChatConsumer.as_asgi()),
    path('ws/notifications/<uuid:user_id>/', NotificationConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})