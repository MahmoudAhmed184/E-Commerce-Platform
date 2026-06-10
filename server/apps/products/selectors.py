"""
products/selectors.py — Query logic for product catalog (NFR-MNT-004).

All read-side queries are centralized here.  Views call selectors
instead of building querysets directly.

"""
from django.db.models import Avg, Count, FloatField, Q, QuerySet, Value
from django.db.models.functions import Coalesce
from .models import Category, Product, ProductImage


VISIBLE_REVIEW_FILTER = Q(reviews__is_visible=True, reviews__deleted_at__isnull=True)


def get_active_products() -> QuerySet[Product]:
    """Return active products with related data pre-fetched.

    Annotates visible review aggregates for public catalog displays.
    """
    return (
        Product.objects
        .filter(is_active=True, category__is_active=True)
        .select_related('category')
        .prefetch_related('images')
        .annotate(
            average_rating=Coalesce(
                Avg('reviews__rating', filter=VISIBLE_REVIEW_FILTER),
                Value(0.0),
                output_field=FloatField(),
            ),
            review_count=Count('reviews', filter=VISIBLE_REVIEW_FILTER),
        )
    )


def get_filtered_active_products(
    *,
    min_price: str | None = None,
    max_price: str | None = None,
) -> QuerySet[Product]:
    queryset = get_active_products()
    if min_price is not None:
        queryset = queryset.filter(price__gte=min_price)
    if max_price is not None:
        queryset = queryset.filter(price__lte=max_price)
    return queryset


def get_product_by_slug(slug: str) -> Product:
    """Return a single active product by slug with annotations."""
    return (
        Product.objects
        .filter(is_active=True, category__is_active=True)
        .select_related('category')
        .prefetch_related('images')
        .annotate(
            average_rating=Coalesce(
                Avg('reviews__rating', filter=VISIBLE_REVIEW_FILTER),
                Value(0.0),
                output_field=FloatField(),
            ),
            review_count=Count('reviews', filter=VISIBLE_REVIEW_FILTER),
        )
        .get(slug=slug)
    )


def get_active_categories() -> QuerySet[Category]:
    """Return active categories with product counts."""
    return (
        Category.objects
        .filter(is_active=True)
        .annotate(
            product_count=Count(
                'products',
                filter=Q(products__is_active=True),
            )
        )
    )


def get_admin_categories() -> QuerySet[Category]:
    return Category.objects.annotate(product_count=Count('products')).order_by('name')


def get_admin_products() -> QuerySet[Product]:
    return Product.objects.select_related('category').prefetch_related('images').all()


def get_admin_product_images() -> QuerySet[ProductImage]:
    return ProductImage.objects.select_related('product').all()
