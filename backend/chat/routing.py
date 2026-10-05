"""
Chat WebSocket routing.

Routes:
  /ws/chat/thread/<uuid:thread_id>/   -> ThreadChatConsumer

Imported into config/asgi.py so its websocket_urlpatterns merge with
whatever accounts.routing exposes.
"""
from django.urls import path

from .consumers import ThreadChatConsumer

websocket_urlpatterns = [
    path(
        "ws/chat/thread/<uuid:thread_id>/",
        ThreadChatConsumer.as_asgi(),
    ),
]