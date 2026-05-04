from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models


class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="cart", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    @property
    def subtotal(self) -> Decimal:
        return sum((item.line_total for item in self.items.all()), Decimal("0.00"))

    @property
    def total(self) -> Decimal:
        return self.subtotal

    def __str__(self) -> str:
        return f"Cart for {self.user_id}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey("products.Product", related_name="cart_items", on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(fields=["cart", "product"], name="unique_cart_product"),
        ]

    @property
    def line_total(self) -> Decimal:
        return self.unit_price_snapshot * self.quantity

    def __str__(self) -> str:
        return f"{self.product_id} x {self.quantity}"
