from __future__ import annotations

import hashlib
import hmac

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .serializers import PaymentWebhookSerializer


class SandboxPaymentWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "payment_webhook"

    def post(self, request):
        signature = request.headers.get("X-Sandbox-Signature", "")
        expected_signature = hmac.new(
            settings.PAYMENT_WEBHOOK_SECRET.encode("utf-8"),
            request.body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(signature, expected_signature):
            return Response({"detail": "Invalid webhook signature."}, status=status.HTTP_403_FORBIDDEN)

        serializer = PaymentWebhookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payment, processed = services.apply_provider_webhook(
                event_id=serializer.validated_data["event_id"],
                provider_reference=serializer.validated_data["provider_reference"],
                status=serializer.validated_data["status"],
                payload=dict(serializer.validated_data),
            )
        except ObjectDoesNotExist:
            return Response({"detail": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "processed": processed,
                "payment_status": payment.status,
                "order_number": payment.order.order_number,
            }
        )
