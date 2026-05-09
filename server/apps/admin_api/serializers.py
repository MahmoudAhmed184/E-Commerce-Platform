from __future__ import annotations

from rest_framework import serializers

from apps.orders.models import Order
from apps.payments.models import Payment
from apps.reviews.models import Review
from apps.users.models import CustomUser


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ("id", "email", "phone", "full_name", "role", "status", "created_at")
        read_only_fields = fields


class AdminOrderSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="email", read_only=True)

    class Meta:
        model = Order
        fields = ("id", "order_number", "customer_email", "status", "payment_status", "total_amount", "created_at")
        read_only_fields = ("id", "order_number", "customer_email", "payment_status", "total_amount", "created_at")


class AdminPaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    customer_email = serializers.EmailField(source="order.email", read_only=True)

    class Meta:
        model = Payment
        fields = ("id", "order_number", "customer_email", "amount", "method", "status", "provider_reference", "created_at")
        read_only_fields = fields


class AdminReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = Review
        fields = ("id", "user_name", "product_name", "rating", "comment", "is_visible", "created_at")
        read_only_fields = fields
