from __future__ import annotations

from decimal import Decimal

import pytest

from apps.admin_api import services
from apps.products.models import Category, Product
from apps.reviews.models import Review
from apps.users.models import CustomUser


@pytest.fixture
def user() -> CustomUser:
    return CustomUser.objects.create_user(
        email="service-user@example.com",
        phone="+201000000750",
        password="Password123",
        full_name="Service User",
        status=CustomUser.Status.PENDING,
        is_email_confirmed=False,
    )


@pytest.fixture
def product() -> Product:
    category = Category.objects.create(name="Admin Service")
    return Product.objects.create(
        category=category,
        name="Admin Service Product",
        description="Product for admin service tests",
        price=Decimal("35.00"),
        stock=4,
    )


@pytest.mark.django_db
def test_admin_user_services_mutate_account_state(user: CustomUser) -> None:
    approved = services.approve_user(user)
    approved.refresh_from_db()
    assert approved.status == CustomUser.Status.ACTIVE
    assert approved.is_email_confirmed is True

    restricted = services.restrict_user(approved)
    restricted.refresh_from_db()
    assert restricted.status == CustomUser.Status.RESTRICTED

    deleted = services.soft_delete_user(restricted)
    deleted.refresh_from_db()
    assert deleted.status == CustomUser.Status.DELETED
    assert deleted.deleted_at is not None


@pytest.mark.django_db
def test_admin_review_services_mutate_visibility_and_delete(user: CustomUser, product: Product) -> None:
    review = Review.objects.create(user=user, product=product, rating=4, is_visible=True)

    hidden = services.hide_review(review)
    hidden.refresh_from_db()
    assert hidden.is_visible is False

    restored = services.unhide_review(hidden)
    restored.refresh_from_db()
    assert restored.is_visible is True

    services.delete_review(restored)
    assert not Review.objects.filter(pk=review.pk).exists()
