from __future__ import annotations

from decimal import Decimal

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from apps.products.models import Category, Product
from apps.reviews.models import Review
from apps.users.models import CustomUser


def set_scoped_throttle_rate(monkeypatch, scope: str, rate: str = "1/minute") -> None:
    monkeypatch.setattr(
        ScopedRateThrottle,
        "THROTTLE_RATES",
        {**ScopedRateThrottle.THROTTLE_RATES, scope: rate},
    )


@pytest.fixture
def user() -> CustomUser:
    return CustomUser.objects.create_user(
        email="reviewer@example.com",
        phone="+201000000601",
        password="Password123",
        full_name="Review User",
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )


@pytest.fixture
def product() -> Product:
    category = Category.objects.create(name="Reviews")
    return Product.objects.create(
        category=category,
        name="Reviewed Product",
        description="Ready for reviews",
        price=Decimal("15.00"),
        stock=5,
        is_active=True,
    )


@pytest.mark.django_db
def test_authenticated_user_can_create_product_review_by_slug(user: CustomUser, product: Product) -> None:
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        f"/api/v1/products/{product.slug}/reviews/",
        {"rating": 5, "comment": "Excellent."},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["product"] == product.id
    assert str(response.data["user"]) == str(user.id)


@pytest.mark.django_db
def test_public_product_reviews_only_include_visible_reviews(user: CustomUser, product: Product) -> None:
    visible = Review.objects.create(user=user, product=product, rating=4, comment="Visible")
    Review.objects.create(user=user, product=Product.objects.create(
        category=product.category,
        name="Other Product",
        description="Other",
        price=Decimal("20.00"),
        stock=1,
    ), rating=5, is_visible=True)
    visible.is_visible = True
    visible.save(update_fields=["is_visible", "updated_at"])

    response = APIClient().get(f"/api/v1/products/{product.slug}/reviews/")

    assert response.status_code == status.HTTP_200_OK
    assert [review["id"] for review in response.data["results"]] == [visible.id]


@pytest.mark.django_db
def test_review_owner_can_update_and_delete_review(user: CustomUser, product: Product) -> None:
    review = Review.objects.create(user=user, product=product, rating=3)
    client = APIClient()
    client.force_authenticate(user=user)

    update_response = client.patch(f"/api/v1/reviews/{review.id}/", {"rating": 4}, format="json")
    delete_response = client.delete(f"/api/v1/reviews/{review.id}/")

    assert update_response.status_code == status.HTTP_200_OK
    assert update_response.data["rating"] == 4
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT
    review.refresh_from_db()
    assert review.deleted_at is not None
    assert Review.objects.filter(id=review.id, deleted_at__isnull=False).exists()


@pytest.mark.django_db
def test_public_product_reviews_exclude_soft_deleted_reviews(user: CustomUser, product: Product) -> None:
    Review.objects.create(
        user=user,
        product=product,
        rating=4,
        comment="Deleted",
        deleted_at=timezone.now(),
    )

    response = APIClient().get(f"/api/v1/products/{product.slug}/reviews/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["results"] == []


@pytest.mark.django_db
def test_review_create_has_scoped_rate_limit(user: CustomUser, product: Product, monkeypatch) -> None:
    cache.clear()
    set_scoped_throttle_rate(monkeypatch, "review_write")
    client = APIClient()
    client.force_authenticate(user=user)

    first_response = client.post(
        f"/api/v1/products/{product.slug}/reviews/",
        {"rating": 0},
        format="json",
    )
    second_response = client.post(
        f"/api/v1/products/{product.slug}/reviews/",
        {"rating": 0},
        format="json",
    )

    assert first_response.status_code == status.HTTP_400_BAD_REQUEST
    assert second_response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
