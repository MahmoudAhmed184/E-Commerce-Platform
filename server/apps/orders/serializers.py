from __future__ import annotations

from rest_framework import serializers

from apps.payments.models import Payment

from . import services as order_services
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


class CheckoutSummaryRequestSerializer(serializers.Serializer):
    items = CheckoutItemSerializer(many=True)


class CheckoutSummaryItemSerializer(serializers.Serializer):
    product = serializers.IntegerField()
    product_name = serializers.CharField()
    product_slug = serializers.CharField()
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    quantity = serializers.IntegerField()
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2)


class CheckoutSummarySerializer(serializers.Serializer):
    items = CheckoutSummaryItemSerializer(many=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    shipping_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)


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
    guest_access_token = serializers.SerializerMethodField()

    def get_guest_access_token(self, order: Order) -> str | None:
        if order.user_id is not None or not self.context.get("include_guest_access_token"):
            return None
        return order_services.build_guest_order_access_token(order)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "guest_access_token",
            "email",
            "phone",
            "shipping_address",
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
