from django.urls import path

from .views import LoginView, LogoutView, MeView, RefreshView, WsTicketView

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("ws-ticket/", WsTicketView.as_view(), name="auth-ws-ticket"),
]