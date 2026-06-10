from __future__ import annotations

from rest_framework import serializers

from apps.products.models import Product

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_price = serializers.DecimalField(source="product.price", max_digits=10, decimal_places=2, read_only=True)
    primary_image = serializers.SerializerMethodField()
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = (
            "id",
            "product",
            "product_name",
            "product_slug",
            "product_price",
            "primary_image",
            "quantity",
            "unit_price_snapshot",
            "line_total",
        )
        read_only_fields = fields

    def get_primary_image(self, obj: CartItem) -> str | None:
        images = list(obj.product.images.all())
        primary = next((img for img in images if img.is_primary), None)
        if not primary and images:
            primary = images[0]
        if not primary:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(primary.image.url)
        return primary.image.url


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ("id", "status", "items", "subtotal", "total")


class AddCartItemSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True, category__is_active=True))
    quantity = serializers.IntegerField(min_value=1, max_value=99)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=99)
