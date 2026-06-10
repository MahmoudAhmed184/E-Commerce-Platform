from __future__ import annotations

import pytest
from django.utils import timezone

from apps.products.models import Product
from apps.reviews.models import Review
from apps.reviews.selectors import (
    get_active_reviews_for_owner_permission,
    get_product_review_aggregates,
    get_user_active_reviews,
    get_visible_product_reviews,
)
from apps.users.models import CustomUser


@pytest.mark.django_db
def test_get_visible_product_reviews_excludes_hidden_deleted_and_other_products(
    user: CustomUser,
    other_user: CustomUser,
    product: Product,
    other_product: Product,
) -> None:
    visible = Review.objects.create(user=user, product=product, rating=5)
    Review.objects.create(user=other_user, product=product, rating=1, is_visible=False)
    Review.objects.create(user=other_user, product=product, rating=2, deleted_at=timezone.now())
    Review.objects.create(user=other_user, product=other_product, rating=3)

    reviews = list(get_visible_product_reviews(product))

    assert reviews == [visible]


@pytest.mark.django_db
def test_get_product_review_aggregates_excludes_hidden_and_deleted_reviews(
    user: CustomUser,
    other_user: CustomUser,
    product: Product,
) -> None:
    Review.objects.create(user=user, product=product, rating=5)
    Review.objects.create(user=other_user, product=product, rating=3)
    Review.objects.create(
        user=CustomUser.objects.create_user(
            email="hidden-selector@example.com",
            phone="+201000000811",
            password="Password123",
            full_name="Hidden Selector",
            status=CustomUser.Status.ACTIVE,
            is_email_confirmed=True,
        ),
        product=product,
        rating=1,
        is_visible=False,
    )
    Review.objects.create(
        user=CustomUser.objects.create_user(
            email="deleted-selector@example.com",
            phone="+201000000812",
            password="Password123",
            full_name="Deleted Selector",
            status=CustomUser.Status.ACTIVE,
            is_email_confirmed=True,
        ),
        product=product,
        rating=1,
        deleted_at=timezone.now(),
    )

    aggregates = get_product_review_aggregates(product)

    assert aggregates["review_count"] == 2
    assert aggregates["average_rating"] == 4.0


@pytest.mark.django_db
def test_get_user_active_reviews_excludes_deleted_and_other_users(
    user: CustomUser,
    other_user: CustomUser,
    product: Product,
    other_product: Product,
) -> None:
    active_review = Review.objects.create(user=user, product=product, rating=4)
    Review.objects.create(user=user, product=other_product, rating=2, deleted_at=timezone.now())
    Review.objects.create(user=other_user, product=product, rating=5)

    reviews = list(get_user_active_reviews(user))

    assert reviews == [active_review]


@pytest.mark.django_db
def test_get_active_reviews_for_owner_permission_excludes_deleted_reviews(
    user: CustomUser,
    product: Product,
) -> None:
    active_review = Review.objects.create(user=user, product=product, rating=4)
    Review.objects.create(user=user, product=product, rating=2, deleted_at=timezone.now())

    reviews = list(get_active_reviews_for_owner_permission())

    assert reviews == [active_review]
