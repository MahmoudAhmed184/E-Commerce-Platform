from django.urls import URLPattern, path

from .views import ConfirmEmailView, CookieTokenRefreshView, CurrentUserView, LoginView, LogoutView, RegisterView

urlpatterns: list[URLPattern] = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/confirm-email/", ConfirmEmailView.as_view(), name="auth-confirm-email"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/token/refresh/", CookieTokenRefreshView.as_view(), name="token-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("users/me/", CurrentUserView.as_view(), name="users-me"),
]
