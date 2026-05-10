from __future__ import annotations

from django.db import IntegrityError
from rest_framework import serializers

from apps.products.models import Product

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
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
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user", "user_name", "product_name", "is_visible", "created_at", "updated_at")


class ReviewCreateSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True), required=False)

    class Meta:
        model = Review
        fields = ("product", "rating", "comment")

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        product = attrs.get("product") or self.context.get("product")
        if product is None:
            raise serializers.ValidationError({"product": ["This field is required."]})
        attrs["product"] = product
        return attrs

    def create(self, validated_data: dict[str, object]) -> Review:
        try:
            return Review.objects.create(user=self.context["request"].user, **validated_data)
        except IntegrityError as exc:
            raise serializers.ValidationError({"product": ["You have already reviewed this product."]}) from exc


class ReviewUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("rating", "comment")
