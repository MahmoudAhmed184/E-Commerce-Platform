from __future__ import annotations

from decimal import Decimal

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.products.models import Category, Product
from apps.reviews.models import Review
from apps.users.models import CustomUser


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
    assert [review["id"] for review in response.data] == [visible.id]


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
    assert not Review.objects.filter(id=review.id).exists()
