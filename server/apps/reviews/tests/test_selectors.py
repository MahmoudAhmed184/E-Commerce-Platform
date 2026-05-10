"""
tests/test_selectors.py — Unit tests for reviews/selectors.py.

Tests verify query logic in isolation: filtering, aggregation, and scoping.
"""
from __future__ import annotations

from django.utils import timezone
import pytest

from apps.products.models import Product
from apps.reviews.models import Review
from apps.reviews.selectors import (
    get_product_review_aggregates,
    get_user_active_reviews,
    get_visible_product_reviews,
)
from apps.users.models import CustomUser


@pytest.mark.django_db
class TestGetVisibleProductReviews:

    def test_returns_visible_reviews(self, user: CustomUser, product: Product) -> None:
        review = Review.objects.create(user=user, product=product, rating=5)
        results = list(get_visible_product_reviews(product))
        assert len(results) == 1
        assert results[0].id == review.id

    def test_excludes_hidden(self, user: CustomUser, product: Product) -> None:
        Review.objects.create(user=user, product=product, rating=2, is_visible=False)
        assert list(get_visible_product_reviews(product)) == []

    def test_excludes_deleted(self, user: CustomUser, product: Product) -> None:
        Review.objects.create(user=user, product=product, rating=3, deleted_at=timezone.now())
        assert list(get_visible_product_reviews(product)) == []

    def test_excludes_other_products(self, user: CustomUser, product: Product, other_product: Product) -> None:
        Review.objects.create(user=user, product=product, rating=5)
        Review.objects.create(user=user, product=other_product, rating=4)
        results = list(get_visible_product_reviews(product))
        assert len(results) == 1

    def test_newest_first(self, user: CustomUser, other_user: CustomUser, product: Product) -> None:
        old = Review.objects.create(user=user, product=product, rating=3)
        new = Review.objects.create(user=other_user, product=product, rating=5)
        results = list(get_visible_product_reviews(product))
        assert results[0].id == new.id
        assert results[1].id == old.id


@pytest.mark.django_db
class TestGetProductReviewAggregates:

    def test_correct_average_and_count(self, user: CustomUser, other_user: CustomUser, product: Product) -> None:
        Review.objects.create(user=user, product=product, rating=4)
        Review.objects.create(user=other_user, product=product, rating=2)
        agg = get_product_review_aggregates(product)
        assert agg["average_rating"] == 3.0
        assert agg["review_count"] == 2

    def test_excludes_hidden(self, user: CustomUser, other_user: CustomUser, product: Product) -> None:
        Review.objects.create(user=user, product=product, rating=5)
        Review.objects.create(user=other_user, product=product, rating=1, is_visible=False)
        agg = get_product_review_aggregates(product)
        assert agg["average_rating"] == 5.0
        assert agg["review_count"] == 1

    def test_excludes_deleted(self, user: CustomUser, other_user: CustomUser, product: Product) -> None:
        Review.objects.create(user=user, product=product, rating=5)
        Review.objects.create(user=other_user, product=product, rating=1, deleted_at=timezone.now())
        agg = get_product_review_aggregates(product)
        assert agg["average_rating"] == 5.0
        assert agg["review_count"] == 1

    def test_no_reviews_returns_zero(self, product: Product) -> None:
        agg = get_product_review_aggregates(product)
        assert agg["average_rating"] == 0.0
        assert agg["review_count"] == 0


@pytest.mark.django_db
class TestGetUserActiveReviews:

    def test_returns_only_users_reviews(self, user: CustomUser, other_user: CustomUser, product: Product, other_product: Product) -> None:
        user_review = Review.objects.create(user=user, product=product, rating=4)
        Review.objects.create(user=other_user, product=other_product, rating=5)
        results = list(get_user_active_reviews(user))
        assert len(results) == 1
        assert results[0].id == user_review.id

    def test_excludes_soft_deleted(self, user: CustomUser, product: Product) -> None:
        Review.objects.create(user=user, product=product, rating=3, deleted_at=timezone.now())
        assert list(get_user_active_reviews(user)) == []
