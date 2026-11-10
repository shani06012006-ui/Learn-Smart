#backend/accounts/urls.py

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
from .teacher_onboarding_views import (
    TeacherOnboardingCompleteView,
    TeacherOnboardingValidateView,
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
    SetupPasswordView,
    StudentPinLoginView,
    TeacherStudentDetailView,
    TeacherRegeneratePinView,
)

urlpatterns = [
    # Auth
    path("login/", LoginView.as_view(), name="auth-login"),
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("register/verify/", RegisterVerifyView.as_view(), name="auth-register-verify"),
    path("register/resend/", RegisterResendView.as_view(), name="auth-register-resend"),
    path("google/", GoogleLoginView.as_view(), name="auth-google"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("ws-ticket/", WsTicketView.as_view(), name="auth-ws-ticket"),

    # Students
    path("students/", StudentListView.as_view(), name="auth-students"),
    path("students/create/", TeacherStudentCreateView.as_view(), name="auth-students-create"),
    path("students/<uuid:student_id>/", TeacherStudentDetailView.as_view(), name="auth-student-detail"),
    path("students/<uuid:student_id>/regenerate-pin/", TeacherRegeneratePinView.as_view(), name="auth-student-regenerate-pin"),

    # OTP
    path("request-otp/", RequestOTPView.as_view(), name="auth-request-otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="auth-verify-otp"),

    # Student activation (unchanged)
    path("activation/validate/", ActivationValidateView.as_view(), name="auth-activation-validate"),
    path("activation/complete/", ActivationCompleteView.as_view(), name="auth-activation-complete"),
    path("activation/request/", ActivationRequestView.as_view(), name="auth-activation-request"),

    # Teacher onboarding (one-time setup link)
    path("onboarding/teacher/validate/", TeacherOnboardingValidateView.as_view(), name="auth-teacher-onboarding-validate"),
    path("onboarding/teacher/complete/", TeacherOnboardingCompleteView.as_view(), name="auth-teacher-onboarding-complete"),

    # Setup Password & PIN
    path("setup-password/", SetupPasswordView.as_view(), name="auth-setup-password"),
    path("student-login/", StudentPinLoginView.as_view(), name="student-pin-login"),
]