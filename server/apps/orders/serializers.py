from __future__ import annotations

from rest_framework import serializers

from apps.payments.models import Payment

from .models import Order, OrderItem


class CheckoutAddressSerializer(serializers.Serializer):
    line1 = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=100)


class CheckoutItemSerializer(serializers.Serializer):
    product = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=99)


class CheckoutSerializer(serializers.Serializer):
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    shipping_address = CheckoutAddressSerializer()
    payment_method = serializers.ChoiceField(choices=Payment.Method.choices)
    items = CheckoutItemSerializer(many=True)


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("id", "product_name", "unit_price", "quantity", "line_total")


class PaymentSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ("method", "status", "provider_reference", "failure_reason")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSummarySerializer(read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "status",
            "payment_status",
            "subtotal",
            "shipping_amount",
            "tax_amount",
            "discount_amount",
            "total_amount",
            "items",
            "payment",
            "created_at",
        )
