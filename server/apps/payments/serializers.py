from __future__ import annotations

from rest_framework import serializers

from .models import Payment


class PaymentWebhookSerializer(serializers.Serializer):
    event_id = serializers.CharField(max_length=128)
    provider_reference = serializers.CharField(max_length=128)
    status = serializers.ChoiceField(choices=(Payment.Status.PAID, Payment.Status.FAILED))
    failure_reason = serializers.CharField(max_length=255, required=False, allow_blank=True)
