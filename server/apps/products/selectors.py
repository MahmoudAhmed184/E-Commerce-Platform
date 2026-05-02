"""
products/selectors.py — Query logic for product catalog (NFR-MNT-004).

All read-side queries are centralized here.  Views call selectors
instead of building querysets directly.

Note: review annotations (average_rating, review_count) are stubbed
with Value(0) until the reviews app is built by Developer 5.
"""
from django.db.models import QuerySet, Value
from django.db.models.functions import Cast
from django.db.models import FloatField, IntegerField
from .models import Product, Category


def get_active_products() -> QuerySet[Product]:
    """Return active products with related data pre-fetched.

    Annotates average_rating and review_count as stubs (0) until the
    reviews app provides the real relation.
    """
    return (
        Product.objects
        .filter(is_active=True)
        .select_related('category')
        .prefetch_related('images')
        .annotate(
            average_rating=Cast(Value(0), output_field=FloatField()),
            review_count=Cast(Value(0), output_field=IntegerField()),
        )
    )


def get_product_by_slug(slug: str) -> Product:
    """Return a single active product by slug with annotations."""
    return (
        Product.objects
        .filter(is_active=True)
        .select_related('category')
        .prefetch_related('images')
        .annotate(
            average_rating=Cast(Value(0), output_field=FloatField()),
            review_count=Cast(Value(0), output_field=IntegerField()),
        )
        .get(slug=slug)
    )


def get_active_categories() -> QuerySet[Category]:
    """Return active categories with product counts."""
    from django.db.models import Count, Q
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
