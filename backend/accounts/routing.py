"""
WebSocket URL routing for presence.

Two endpoints:

  /ws/presence/         Any authenticated user connects here. Their
                        presence is broadcast to their institution's group.

  /ws/admin/presence/   Institution admins connect here to subscribe to
                        presence events for their own institution.
"""
from django.urls import path

from .consumers import AdminPresenceConsumer, PresenceConsumer

websocket_urlpatterns = [
    path("ws/presence/", PresenceConsumer.as_asgi()),
    path("ws/admin/presence/", AdminPresenceConsumer.as_asgi()),
]