"""
ASGI config for the project.

Routes plain HTTP through Django as normal, and WebSocket connections
through Channels' JWTAuthMiddlewareStack + each app's own routing module.
Presence (accounts.routing) and chat (chat.routing, added in Module F) are
combined here but stay completely separate consumers/groups — this file is
just the traffic cop, not where their logic lives.
"""
import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

django_asgi_app = get_asgi_application()

from accounts.middleware import JWTAuthMiddlewareStack  # noqa: E402
from accounts.routing import websocket_urlpatterns as accounts_ws_urlpatterns  # noqa: E402

# chat.routing.websocket_urlpatterns is appended here once Module F (chat) exists:
#   from chat.routing import websocket_urlpatterns as chat_ws_urlpatterns
websocket_urlpatterns = accounts_ws_urlpatterns

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)
