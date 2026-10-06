from django.urls import path

from .consumers import LeavesConsumer

websocket_urlpatterns = [
    path("ws/leaves/", LeavesConsumer.as_asgi()),
]
