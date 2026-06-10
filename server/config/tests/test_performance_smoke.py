from __future__ import annotations

from decimal import Decimal
from time import perf_counter

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.products.models import Category, Product
from apps.reviews.models import Review
from apps.users.models import CustomUser


SMOKE_THRESHOLD_SECONDS = 0.5
SMOKE_FIXTURE_SIZE = 50


def assert_under_threshold(elapsed: float, endpoint: str) -> None:
    assert elapsed < SMOKE_THRESHOLD_SECONDS, (
        f"{endpoint} took {elapsed:.3f}s; expected under {SMOKE_THRESHOLD_SECONDS:.3f}s "
        f"with {SMOKE_FIXTURE_SIZE} fixture rows."
    )


@pytest.mark.django_db
def test_product_list_performance_smoke() -> None:
    category = Category.objects.create(name="Performance Products")
    Product.objects.bulk_create(
        [
            Product(
                category=category,
                name=f"Performance Product {index}",
                slug=f"performance-product-{index}",
                description="Performance smoke product",
                price=Decimal("10.00"),
                stock=5,
            )
            for index in range(SMOKE_FIXTURE_SIZE)
        ]
    )
    client = APIClient()

    started_at = perf_counter()
    response = client.get("/api/v1/products/products/", {"page_size": SMOKE_FIXTURE_SIZE})
    elapsed = perf_counter() - started_at

    assert response.status_code == status.HTTP_200_OK
    assert_under_threshold(elapsed, "/api/v1/products/products/")


@pytest.mark.django_db
def test_review_list_performance_smoke() -> None:
    category = Category.objects.create(name="Performance Reviews")
    product = Product.objects.create(
        category=category,
        name="Performance Reviewed Product",
        description="Performance smoke product",
        price=Decimal("10.00"),
        stock=5,
    )
    users = [
        CustomUser(
            email=f"review-perf-{index}@example.com",
            phone=f"+20100001{index:04d}",
            full_name=f"Review Perf {index}",
            status=CustomUser.Status.ACTIVE,
            is_email_confirmed=True,
        )
        for index in range(SMOKE_FIXTURE_SIZE)
    ]
    CustomUser.objects.bulk_create(users)
    Review.objects.bulk_create(
        [Review(user=user, product=product, rating=(index % 5) + 1) for index, user in enumerate(users)]
    )
    client = APIClient()

    started_at = perf_counter()
    response = client.get(f"/api/v1/products/{product.slug}/reviews/", {"page_size": SMOKE_FIXTURE_SIZE})
    elapsed = perf_counter() - started_at

    assert response.status_code == status.HTTP_200_OK
    assert_under_threshold(elapsed, f"/api/v1/products/{product.slug}/reviews/")


@pytest.mark.django_db
def test_admin_user_list_performance_smoke() -> None:
    admin_user = CustomUser.objects.create_user(
        email="admin-perf@example.com",
        phone="+201000020000",
        password="Password123",
        full_name="Admin Perf",
        role=CustomUser.Role.ADMIN,
        status=CustomUser.Status.ACTIVE,
        is_email_confirmed=True,
    )
    CustomUser.objects.bulk_create(
        [
                CustomUser(
                    email=f"user-perf-{index}@example.com",
                    phone=f"+20100003{index:04d}",
                full_name=f"User Perf {index}",
                status=CustomUser.Status.ACTIVE,
                is_email_confirmed=True,
            )
            for index in range(SMOKE_FIXTURE_SIZE)
        ]
    )
    client = APIClient()
    client.force_authenticate(user=admin_user)

    started_at = perf_counter()
    response = client.get("/api/v1/admin/users/", {"page_size": SMOKE_FIXTURE_SIZE})
    elapsed = perf_counter() - started_at

    assert response.status_code == status.HTTP_200_OK
    assert_under_threshold(elapsed, "/api/v1/admin/users/")
