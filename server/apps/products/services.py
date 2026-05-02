"""
products/services.py — Business logic for product catalog (NFR-MNT-003).

All write operations are centralised here.  Views delegate to services
instead of mutating models directly.
"""
from django.db import transaction
from .models import Product, Category, ProductImage


def create_product(*, name: str, description: str, price, stock: int,
                   category: Category, is_active: bool = True) -> Product:
    """Create a new product (FR-ADM-006)."""
    product = Product(
        name=name,
        description=description,
        price=price,
        stock=stock,
        category=category,
        is_active=is_active,
    )
    product.full_clean()
    product.save()
    return product


def update_product(product: Product, **fields) -> Product:
    """Update product fields (FR-ADM-007)."""
    allowed = {'name', 'description', 'price', 'stock', 'category',
               'is_active'}
    update_fields = []
    for key, value in fields.items():
        if key in allowed:
            setattr(product, key, value)
            update_fields.append(key)
    if update_fields:
        product.full_clean()
        product.save(update_fields=update_fields + ['updated_at'])
    return product


def deactivate_product(product: Product) -> Product:
    """Soft-deactivate a product (FR-ADM-008).

    Historical order data is preserved because the product row is not
    deleted — only its ``is_active`` flag is set to False.
    """
    product.is_active = False
    product.save(update_fields=['is_active', 'updated_at'])
    return product


@transaction.atomic
def update_product_stock(product: Product, quantity: int) -> Product:
    """Set absolute stock quantity with row-level lock."""
    product = Product.objects.select_for_update().get(pk=product.pk)
    product.stock = quantity
    product.save(update_fields=['stock', 'updated_at'])
    return product


@transaction.atomic
def decrement_stock(product: Product, quantity: int) -> Product:
    """Atomically decrement stock (FR-ORD-004).

    Raises ``ValueError`` if the requested quantity exceeds available stock.
    """
    product = Product.objects.select_for_update().get(pk=product.pk)
    if quantity > product.stock:
        raise ValueError(
            f'Requested quantity {quantity} exceeds available stock '
            f'{product.stock} for "{product.name}".'
        )
    product.stock -= quantity
    product.save(update_fields=['stock', 'updated_at'])
    return product


def create_category(*, name: str, description: str = '',
                    is_active: bool = True) -> Category:
    """Create a category (FR-ADM-009)."""
    category = Category(name=name, description=description, is_active=is_active)
    category.full_clean()
    category.save()
    return category


def update_category(category: Category, **fields) -> Category:
    """Update a category (FR-ADM-009)."""
    allowed = {'name', 'description', 'is_active'}
    update_fields = []
    for key, value in fields.items():
        if key in allowed:
            setattr(category, key, value)
            update_fields.append(key)
    if update_fields:
        category.full_clean()
        category.save(update_fields=update_fields + ['updated_at'])
    return category


def deactivate_category(category: Category) -> Category:
    """Soft-deactivate a category (FR-ADM-009)."""
    category.is_active = False
    category.save(update_fields=['is_active', 'updated_at'])
    return category
