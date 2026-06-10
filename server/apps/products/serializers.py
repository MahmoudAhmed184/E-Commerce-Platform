from rest_framework import serializers
from .models import Category, Product, ProductImage, MAX_IMAGE_SIZE_MB


# ─── Public Serializers ────────────────────────────────────────────


class CategorySerializer(serializers.ModelSerializer):
    """Read-only category representation for public endpoints."""
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'product_count']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary']


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product listings (FR-PRD-002).

    Excludes description and full image list; includes only primary image URL,
    category name, price, stock availability state, average rating, and
    review count.
    """
    category = CategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True, default=0)
    review_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'price', 'stock',
            'category', 'primary_image', 'availability',
            'average_rating', 'review_count',
        ]

    def get_primary_image(self, obj) -> str | None:
        images = list(obj.images.all())
        primary = next((img for img in images if img.is_primary), None)
        if not primary and images:
            primary = images[0]
        if primary:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary.image.url)
            return primary.image.url
        return None

    def get_availability(self, obj) -> str:
        return obj.availability


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer for product detail view (FR-PRD-003).

    Includes description, all images, category, stock availability,
    average rating, and review count.
    """
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    availability = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True, default=0)
    review_count = serializers.IntegerField(read_only=True, default=0)
    user_has_ordered = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'stock',
            'category', 'images', 'availability',
            'average_rating', 'review_count', 'user_has_ordered',
        ]

    def get_availability(self, obj) -> str:
        return obj.availability

    def get_user_has_ordered(self, obj) -> bool:
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        from apps.orders.models import Order
        return Order.objects.filter(
            user=request.user,
            items__product=obj,
            status=Order.Status.CONFIRMED
        ).exists()


# ─── Admin Write Serializers ───────────────────────────────────────


class AdminCategorySerializer(serializers.ModelSerializer):
    """Admin serializer for category CRUD (FR-ADM-009)."""
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'is_active', 'product_count',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class AdminProductImageSerializer(serializers.ModelSerializer):
    """Admin serializer for product image CRUD."""

    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'image', 'alt_text', 'is_primary', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_image(self, value):
        """Validate image type and size (NFR-SEC-008)."""
        max_size = MAX_IMAGE_SIZE_MB * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(
                f'Image size must not exceed {MAX_IMAGE_SIZE_MB}MB.'
            )
        return value


class AdminProductSerializer(serializers.ModelSerializer):
    """Admin serializer for product CRUD (FR-ADM-006, FR-ADM-007).

    Accepts `category_id` for writes; returns nested category on reads.
    """
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
    )
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    availability = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'stock',
            'is_active', 'category_id', 'category', 'images', 'availability',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def get_availability(self, obj) -> str:
        return obj.availability
