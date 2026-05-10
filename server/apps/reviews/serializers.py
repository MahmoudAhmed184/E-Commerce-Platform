"""
reviews/serializers.py — Validation-only serializers (NFR-MNT-005).

Serializers handle input parsing and validation.  They do NOT call
``save()`` or ``create()`` — that responsibility belongs to
``services.py`` (NFR-MNT-003).  Views orchestrate the flow:
validate → call service → return response.

WHY NO ``create()`` OVERRIDE?
------------------------------
The previous version had ``ReviewCreateSerializer.create()`` that
called ``Review.objects.create(...)`` directly.  That mixed
"validation" with "persistence", which breaks the services/selectors
pattern the project uses.  Now:
• Serializer validates → ``serializer.validated_data``
• View calls ``services.create_review(**validated_data)``
• Service handles the database write + business rules
"""
from __future__ import annotations

from rest_framework import serializers

from apps.products.models import Product

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Read serializer — used for all API responses that return a review.

    Includes computed ``user_name`` and ``product_name`` so the
    frontend doesn't need a separate request to resolve those.
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
    """Write serializer — validates data for creating a review.

    ``product`` is optional in the request body because it can also
    come from the URL (e.g. ``/api/v1/products/<slug>/reviews/``).
    The view injects it via serializer context.

    NOTE: This is a plain ``Serializer``, NOT a ``ModelSerializer``.
    We don't want DRF to auto-generate a ``create()`` method that
    would bypass our service layer.
    """

    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        required=False,
    )
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, default="", allow_blank=True)

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        # If the product wasn't in the request body, pull it from
        # the view context (set by ProductReviewListCreateView).
        product = attrs.get("product") or self.context.get("product")
        if product is None:
            raise serializers.ValidationError(
                {"product": ["This field is required."]}
            )
        attrs["product"] = product
        return attrs


class ReviewUpdateSerializer(serializers.Serializer):
    """Write serializer — validates data for updating a review.

    Only ``rating`` and ``comment`` can be changed by the customer.
    Using a plain ``Serializer`` (not ModelSerializer) keeps the
    boundary clear: this file validates, ``services.py`` persists.
    """

    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    comment = serializers.CharField(required=False, allow_blank=True)
