from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.products.models import Product

from .models import Cart, CartItem


def get_or_create_cart(user: object) -> Cart:
    cart = Cart.objects.filter(user=user, status=Cart.Status.ACTIVE).order_by("-updated_at", "-pk").first()
    if cart is None:
        cart = Cart.objects.create(user=user, status=Cart.Status.ACTIVE)
    else:
        Cart.objects.filter(user=user, status=Cart.Status.ACTIVE).exclude(pk=cart.pk).update(
            status=Cart.Status.ABANDONED,
            updated_at=timezone.now(),
        )
    cart = Cart.objects.prefetch_related("items__product__images").get(pk=cart.pk)
    return cart


@transaction.atomic
def add_item(*, user: object, product_id: int, quantity: int) -> Cart:
    cart = get_or_create_cart(user)
    product = Product.objects.select_for_update().get(pk=product_id, is_active=True, category__is_active=True)
    item, created = CartItem.objects.select_for_update().get_or_create(
        cart=cart,
        product=product,
        defaults={"quantity": 0, "unit_price_snapshot": product.price},
    )
    new_quantity = quantity if created else item.quantity + quantity
    validate_quantity(product=product, quantity=new_quantity)
    item.quantity = new_quantity
    item.unit_price_snapshot = product.price
    item.save(update_fields=["quantity", "unit_price_snapshot", "updated_at"])
    cart.save(update_fields=["updated_at"])
    return get_or_create_cart(user)


@transaction.atomic
def update_item(*, user: object, item_id: int, quantity: int) -> Cart:
    cart = get_or_create_cart(user)
    item = CartItem.objects.select_for_update().select_related("product__category").get(pk=item_id, cart=cart)
    validate_quantity(product=item.product, quantity=quantity)
    item.quantity = quantity
    item.unit_price_snapshot = item.product.price
    item.save(update_fields=["quantity", "unit_price_snapshot", "updated_at"])
    cart.save(update_fields=["updated_at"])
    return get_or_create_cart(user)


@transaction.atomic
def remove_item(*, user: object, item_id: int) -> Cart:
    cart = get_or_create_cart(user)
    CartItem.objects.get(pk=item_id, cart=cart).delete()
    cart.save(update_fields=["updated_at"])
    return get_or_create_cart(user)


@transaction.atomic
def convert_active_cart_for_user(user: object) -> None:
    if not getattr(user, "is_authenticated", False):
        return
    Cart.objects.filter(user=user, status=Cart.Status.ACTIVE).update(
        status=Cart.Status.CONVERTED,
        updated_at=timezone.now(),
    )


def validate_quantity(*, product: Product, quantity: int) -> None:
    if quantity < 1:
        raise ValidationError({"quantity": ["Quantity must be at least 1."]})
    if not product.is_active or not product.category.is_active:
        raise ValidationError({"product": ["This product is no longer available."]})
    if product.stock < quantity:
        raise ValidationError({"quantity": [f"Only {product.stock} item(s) are available."]})
