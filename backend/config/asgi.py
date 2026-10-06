"""
ASGI config for the project.
"""
import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

django_asgi_app = get_asgi_application()

from accounts.middleware import JWTAuthMiddlewareStack  # noqa: E402
from accounts.routing import websocket_urlpatterns as accounts_ws  # noqa: E402
from chat.routing import websocket_urlpatterns as chat_ws  # noqa: E402
from leaves.routing import websocket_urlpatterns as leaves_ws  # noqa: E402

websocket_urlpatterns = accounts_ws + chat_ws + leaves_ws


application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        ),
    }
)
