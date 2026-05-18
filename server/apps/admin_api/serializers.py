"""
admin_api/serializers.py — Read serializers for admin API responses.

These are read-only serializers used to format admin list/detail responses.
Admin views don't accept complex write payloads — mutations are handled
by services.py and triggered via custom actions (approve, restrict, etc).
"""
from __future__ import annotations

from rest_framework import serializers

from apps.orders.models import Order
from apps.payments.models import Payment
from apps.reviews.models import Review
from apps.users.models import CustomUser


class AdminUserSerializer(serializers.ModelSerializer):
    """Admin view of a user account.

    Includes ``is_email_confirmed`` and ``deleted_at`` — these are
    internal fields that customers don't see, but admins need for
    account management decisions.
    """

    class Meta:
        model = CustomUser
        fields = (
            "id",
            "email",
            "phone",
            "full_name",
            "role",
            "status",
            "is_email_confirmed",
            "deleted_at",
            "created_at",
        )
        read_only_fields = fields


class AdminOrderSerializer(serializers.ModelSerializer):
    """Admin view of an order.

    The Order model stores email directly as ``email`` (not as a nested
    user field), so we alias it to ``customer_email`` for clarity in the
    API response.
    """

    customer_email = serializers.EmailField(source="email", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "customer_email",
            "status",
            "payment_status",
            "total_amount",
            "created_at",
        )
        read_only_fields = (
            "id",
            "order_number",
            "customer_email",
            "total_amount",
            "created_at",
        )


class AdminPaymentSerializer(serializers.ModelSerializer):
    """Admin view of a payment record.

    Pulls ``order_number`` and ``customer_email`` from the related order
    via dot-notation source lookups.
    """

    order_number = serializers.CharField(source="order.order_number", read_only=True)
    customer_email = serializers.EmailField(source="order.email", read_only=True)

    class Meta:
        model = Payment
        fields = (
            "id",
            "order_number",
            "customer_email",
            "amount",
            "method",
            "status",
            "provider_reference",
            "created_at",
        )
        read_only_fields = fields


class AdminReviewSerializer(serializers.ModelSerializer):
    """Admin view of a review for the moderation queue.

    Includes ``deleted_at`` so admins can see soft-deleted reviews
    and distinguish them from hidden-but-active ones.
    """

    user_name = serializers.CharField(source="user.full_name", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "user_name",
            "product_name",
            "rating",
            "comment",
            "is_visible",
            "deleted_at",
            "created_at",
        )
        read_only_fields = fields
