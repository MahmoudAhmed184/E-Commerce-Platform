from django.urls import URLPattern, path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ConfirmEmailView,
    CurrentUserPasswordView,
    CurrentUserView,
    LoginView,
    LogoutView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
)

urlpatterns: list[URLPattern] = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/confirm-email", ConfirmEmailView.as_view(), name="auth-confirm-email-no-slash"),
    path("auth/confirm-email/", ConfirmEmailView.as_view(), name="auth-confirm-email"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path(
        "auth/password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="auth-password-reset-confirm",
    ),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("users/me/", CurrentUserView.as_view(), name="users-me"),
    path("users/me/password/", CurrentUserPasswordView.as_view(), name="users-me-password"),
]
