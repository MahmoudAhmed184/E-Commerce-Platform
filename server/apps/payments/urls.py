from django.urls import path

from .views import SandboxPaymentWebhookView


urlpatterns = [
    path("webhooks/sandbox/", SandboxPaymentWebhookView.as_view(), name="payments-sandbox-webhook"),
]
