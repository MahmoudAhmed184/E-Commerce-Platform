from django.urls import URLPattern, path

from .views import ConfirmEmailView, RegisterView

urlpatterns: list[URLPattern] = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/confirm-email/", ConfirmEmailView.as_view(), name="auth-confirm-email"),
]
