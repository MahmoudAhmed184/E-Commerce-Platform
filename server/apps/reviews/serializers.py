"""
reviews/serializers.py — Request/response serialization for reviews.

These serializers handle VALIDATION ONLY. They do NOT create or update
database objects — that responsibility belongs to services.py (NFR-MNT-003).

The flow is:
  1. View receives HTTP request
  2. Serializer validates the incoming data
  3. View calls a service function with the validated data
  4. Service creates/updates the model
  5. View uses a read serializer to format the response
"""
from __future__ import annotations

from rest_framework import serializers

from apps.products.models import Product

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Read serializer — used for API responses.

    Includes computed display fields (user_name, product_name) so the
    frontend doesn't need separate API calls to show who wrote the review.
    """

    user_name = serializers.CharField(source="user.full_name", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "user",
            "user_name",
            "product",
            "product_name",
            "rating",
            "comment",
            "is_visible",
            "deleted_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user",
            "user_name",
            "product_name",
            "is_visible",
            "deleted_at",
            "created_at",
            "updated_at",
        )


class ReviewCreateSerializer(serializers.Serializer):
    """Write serializer for creating reviews — VALIDATION ONLY.

    Does NOT call .save() or .create(). The view passes validated data
    to ``services.create_review()`` which handles the database write.

    The ``product`` field is optional here because when creating via the
    product slug URL (``/api/v1/products/{slug}/reviews/``), the product
    is resolved from the URL and injected via serializer context.
    """

    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        required=False,
    )
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, default="", allow_blank=True)

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        # If product wasn't in the request body, pull it from context
        # (set by ProductReviewListCreateView from the URL slug).
        product = attrs.get("product") or self.context.get("product")
        if product is None:
            raise serializers.ValidationError(
                {"product": ["This field is required."]}
            )
        attrs["product"] = product

        # Verify the user has ordered the product
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            from apps.orders.models import Order
            has_ordered = Order.objects.filter(
                user=request.user,
                items__product=product,
                status=Order.Status.CONFIRMED
            ).exists()
            if not has_ordered:
                raise serializers.ValidationError(
                    {"non_field_errors": ["You must purchase this product before reviewing it."]}
                )
        return attrs


class ReviewUpdateSerializer(serializers.Serializer):
    """Write serializer for updating reviews — VALIDATION ONLY.

    Both fields are optional because PATCH requests allow partial updates.
    The view passes validated data to ``services.update_review()``.
    """

    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    comment = serializers.CharField(required=False, allow_blank=True)

