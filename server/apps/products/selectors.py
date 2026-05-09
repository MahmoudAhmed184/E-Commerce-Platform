"""
products/selectors.py — Query logic for product catalog (NFR-MNT-004).

All read-side queries are centralized here.  Views call selectors
instead of building querysets directly.

"""
from django.db.models import Avg, Count, FloatField, Q, QuerySet, Value
from django.db.models.functions import Coalesce
from .models import Product, Category


def get_active_products() -> QuerySet[Product]:
    """Return active products with related data pre-fetched.

    Annotates visible review aggregates for public catalog displays.
    """
    return (
        Product.objects
        .filter(is_active=True)
        .select_related('category')
        .prefetch_related('images')
        .annotate(
            average_rating=Coalesce(
                Avg('reviews__rating', filter=Q(reviews__is_visible=True)),
                Value(0.0),
                output_field=FloatField(),
            ),
            review_count=Count('reviews', filter=Q(reviews__is_visible=True)),
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
            average_rating=Coalesce(
                Avg('reviews__rating', filter=Q(reviews__is_visible=True)),
                Value(0.0),
                output_field=FloatField(),
            ),
            review_count=Count('reviews', filter=Q(reviews__is_visible=True)),
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
