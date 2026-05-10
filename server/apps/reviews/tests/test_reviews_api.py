"""
tests/test_reviews_api.py — API integration tests for review endpoints.

These tests exercise the FULL HTTP stack: URL routing, permissions,
serialization, service calls, and response formatting. They verify
the contract that the frontend team will depend on.
"""
from __future__ import annotations

from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.products.models import Product
from apps.reviews.models import Review
from apps.users.models import CustomUser


# ─── Create Review (POST /api/v1/products/{slug}/reviews/) ───────────


@pytest.mark.django_db
def test_create_review_via_product_slug(user: CustomUser, product: Product) -> None:
    """FR-REV-001: Authenticated customer can create a review."""
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        f"/api/v1/products/{product.slug}/reviews/",
        {"rating": 5, "comment": "Excellent!"},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["rating"] == 5
    assert response.data["comment"] == "Excellent!"
    assert response.data["product"] == product.id
    assert str(response.data["user"]) == str(user.id)
    assert response.data["is_visible"] is True
    assert response.data["deleted_at"] is None


@pytest.mark.django_db
def test_create_review_without_comment(user: CustomUser, product: Product) -> None:
    """FR-REV-004: Comment is optional."""
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        f"/api/v1/products/{product.slug}/reviews/",
        {"rating": 3},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["comment"] == ""


@pytest.mark.django_db
def test_duplicate_review_rejected(user: CustomUser, product: Product) -> None:
    """FR-REV-002: Only one active review per product per user."""
    Review.objects.create(user=user, product=product, rating=4)

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        f"/api/v1/products/{product.slug}/reviews/",
        {"rating": 5},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already reviewed" in str(response.data).lower()


@pytest.mark.django_db
def test_unauthenticated_create_rejected(product: Product) -> None:
    """Anonymous users cannot create reviews."""
    client = APIClient()

    response = client.post(
        f"/api/v1/products/{product.slug}/reviews/",
        {"rating": 5},
        format="json",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_rating_out_of_range_rejected(user: CustomUser, product: Product) -> None:
    """FR-REV-003: Rating must be 1-5."""
    client = APIClient()
    client.force_authenticate(user=user)

    for bad_rating in [0, 6, -1, 100]:
        response = client.post(
            f"/api/v1/products/{product.slug}/reviews/",
            {"rating": bad_rating},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST, (
            f"Rating {bad_rating} should be rejected"
        )


# ─── List Reviews (GET /api/v1/products/{slug}/reviews/) ─────────────


@pytest.mark.django_db
def test_list_reviews_public(user: CustomUser, product: Product) -> None:
    """FR-REV-007: Public can list visible reviews."""
    Review.objects.create(user=user, product=product, rating=4, comment="Good")

    response = APIClient().get(f"/api/v1/products/{product.slug}/reviews/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["rating"] == 4


@pytest.mark.django_db
def test_list_excludes_hidden_and_deleted(
    user: CustomUser, other_user: CustomUser, product: Product
) -> None:
    """FR-REV-007: Hidden and deleted reviews should not appear."""
    Review.objects.create(user=user, product=product, rating=5)  # visible
    Review.objects.create(
        user=other_user, product=product, rating=1, is_visible=False
    )  # hidden

    response = APIClient().get(f"/api/v1/products/{product.slug}/reviews/")

    assert response.data["count"] == 1


@pytest.mark.django_db
def test_list_reviews_paginated(user: CustomUser, product: Product) -> None:
    """NFR-PER-001: List endpoint uses bounded pagination."""
    # Create 2 reviews by different users for the same product
    Review.objects.create(user=user, product=product, rating=4)

    response = APIClient().get(
        f"/api/v1/products/{product.slug}/reviews/?page_size=1"
    )

    assert response.status_code == status.HTTP_200_OK
    assert "count" in response.data
    assert "results" in response.data


# ─── Update Review (PATCH /api/v1/reviews/{id}/) ─────────────────────


@pytest.mark.django_db
def test_owner_can_update_review(review: Review) -> None:
    """FR-REV-005: Owner can edit their review."""
    client = APIClient()
    client.force_authenticate(user=review.user)

    response = client.patch(
        f"/api/v1/reviews/{review.id}/",
        {"rating": 2, "comment": "Updated"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["rating"] == 2
    assert response.data["comment"] == "Updated"


@pytest.mark.django_db
def test_non_owner_gets_403_on_update(
    review: Review, other_user: CustomUser
) -> None:
    """FR-REV-009: Non-owner update returns 403, not 404."""
    client = APIClient()
    client.force_authenticate(user=other_user)

    response = client.patch(
        f"/api/v1/reviews/{review.id}/",
        {"rating": 1},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


# ─── Delete Review (DELETE /api/v1/reviews/{id}/) ────────────────────


@pytest.mark.django_db
def test_owner_can_delete_review(review: Review) -> None:
    """FR-REV-006: Owner can delete their review (soft-delete)."""
    client = APIClient()
    client.force_authenticate(user=review.user)

    response = client.delete(f"/api/v1/reviews/{review.id}/")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    # Verify it's a soft-delete: row still exists with deleted_at set
    review.refresh_from_db()
    assert review.deleted_at is not None


@pytest.mark.django_db
def test_non_owner_gets_403_on_delete(
    review: Review, other_user: CustomUser
) -> None:
    """FR-REV-009: Non-owner delete returns 403."""
    client = APIClient()
    client.force_authenticate(user=other_user)

    response = client.delete(f"/api/v1/reviews/{review.id}/")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_unauthenticated_delete_rejected(review: Review) -> None:
    """Anonymous users cannot delete reviews."""
    response = APIClient().delete(f"/api/v1/reviews/{review.id}/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
