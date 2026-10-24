from django.urls import path

from .activation_views import (
    ActivationCompleteView,
    ActivationRequestView,
    ActivationValidateView,
)
from .registration_views import (
    RegisterResendView,
    RegisterVerifyView,
    RegisterView,
)
from .views import (
    GoogleLoginView,
    LoginView,
    LogoutView,
    MeView,
    RefreshView,
    StudentListView,
    TeacherStudentCreateView,
    WsTicketView,
    RequestOTPView,
    VerifyOTPView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("register/verify/", RegisterVerifyView.as_view(), name="auth-register-verify"),
    path("register/resend/", RegisterResendView.as_view(), name="auth-register-resend"),
    path("google/", GoogleLoginView.as_view(), name="auth-google"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("ws-ticket/", WsTicketView.as_view(), name="auth-ws-ticket"),
    path("students/", StudentListView.as_view(), name="auth-students"),
    path("students/create/", TeacherStudentCreateView.as_view(), name="auth-students-create"),
    path("request-otp/", RequestOTPView.as_view(), name="auth-request-otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="auth-verify-otp"),
    # Student account activation (one-time link sent after an admin creates a student)
    path("activation/validate/", ActivationValidateView.as_view(), name="auth-activation-validate"),
    path("activation/complete/", ActivationCompleteView.as_view(), name="auth-activation-complete"),
    path("activation/request/", ActivationRequestView.as_view(), name="auth-activation-request"),
]