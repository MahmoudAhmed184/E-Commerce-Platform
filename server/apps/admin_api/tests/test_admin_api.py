"""
tests/test_admin_api.py — API integration tests for admin endpoints.

Tests exercise the full HTTP stack: URL routing, permissions,
serialization, service calls, and response formatting.
"""
from __future__ import annotations

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from django.utils import timezone

from apps.orders.models import Order
from apps.payments.models import Payment
from apps.reviews.models import Review
from apps.users.models import CustomUser


# ─── Permission Tests (FR-ADM-012) ───────────────────────────────────


@pytest.mark.django_db
class TestAdminPermissions:
    """FR-ADM-012: Non-admin users get 403 on all admin endpoints."""

    ADMIN_ENDPOINTS = [
        "/api/v1/admin/users/",
        "/api/v1/admin/orders/",
        "/api/v1/admin/payments/",
        "/api/v1/admin/reviews/",
    ]

    def test_unauthenticated_gets_401(self) -> None:
        client = APIClient()
        for url in self.ADMIN_ENDPOINTS:
            response = client.get(url)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED, (
                f"{url} should return 401 for unauthenticated users"
            )

    def test_non_admin_gets_403(self, non_admin_user: CustomUser) -> None:
        client = APIClient()
        client.force_authenticate(user=non_admin_user)
        for url in self.ADMIN_ENDPOINTS:
            response = client.get(url)
            assert response.status_code == status.HTTP_403_FORBIDDEN, (
                f"{url} should return 403 for non-admin users"
            )


# ─── User Management Tests (FR-ADM-001 to FR-ADM-005) ────────────────


@pytest.mark.django_db
class TestAdminUserList:

    def test_list_users_paginated(self, admin_user: CustomUser) -> None:
        """FR-ADM-001: Admin can view paginated user list."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.get("/api/v1/admin/users/")

        assert response.status_code == status.HTTP_200_OK
        assert "count" in response.data
        assert "results" in response.data

    def test_search_by_email(
        self, admin_user: CustomUser, active_customer: CustomUser
    ) -> None:
        """FR-ADM-002: Search users by email."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.get(f"/api/v1/admin/users/?search={active_customer.email}")

        assert response.status_code == status.HTTP_200_OK
        emails = [u["email"] for u in response.data["results"]]
        assert active_customer.email in emails

    def test_search_by_phone(
        self, admin_user: CustomUser, active_customer: CustomUser
    ) -> None:
        """FR-ADM-002: Search users by phone."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.get(f"/api/v1/admin/users/?search={active_customer.phone}")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1


@pytest.mark.django_db
class TestAdminUserApprove:

    def test_approve_pending_user(
        self, admin_user: CustomUser, pending_customer: CustomUser
    ) -> None:
        """FR-ADM-003: Approve changes pending to active."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.patch(
            f"/api/v1/admin/users/{pending_customer.id}/approve/"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == CustomUser.Status.ACTIVE
        assert response.data["is_email_confirmed"] is True

    def test_approve_non_pending_returns_400(
        self, admin_user: CustomUser, active_customer: CustomUser
    ) -> None:
        """Approve guard: only pending_approval users can be approved."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.patch(
            f"/api/v1/admin/users/{active_customer.id}/approve/"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "pending_approval" in str(response.data).lower()


@pytest.mark.django_db
class TestAdminUserRestrict:

    def test_restrict_active_user(
        self, admin_user: CustomUser, active_customer: CustomUser
    ) -> None:
        """FR-ADM-004: Restrict changes status to restricted."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.patch(
            f"/api/v1/admin/users/{active_customer.id}/restrict/"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == CustomUser.Status.RESTRICTED

    def test_restrict_deleted_user_returns_400(
        self, admin_user: CustomUser, active_customer: CustomUser
    ) -> None:
        """Restrict guard: cannot restrict soft-deleted users."""
        active_customer.status = CustomUser.Status.DELETED
        active_customer.deleted_at = timezone.now()
        active_customer.save(update_fields=["status", "deleted_at"])

        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.patch(
            f"/api/v1/admin/users/{active_customer.id}/restrict/"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestAdminUserActivate:

    def test_activate_restricted_user(
        self, admin_user: CustomUser, active_customer: CustomUser
    ) -> None:
        active_customer.status = CustomUser.Status.RESTRICTED
        active_customer.is_active = False
        active_customer.save(update_fields=["status", "is_active"])

        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.patch(
            f"/api/v1/admin/users/{active_customer.id}/activate/"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == CustomUser.Status.ACTIVE
        assert response.data["is_active"] is True
        assert response.data["is_email_confirmed"] is True

    def test_activate_deleted_user(
        self, admin_user: CustomUser, active_customer: CustomUser
    ) -> None:
        active_customer.status = CustomUser.Status.DELETED
        active_customer.deleted_at = timezone.now()
        active_customer.is_active = False
        active_customer.save(update_fields=["status", "deleted_at", "is_active"])

        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.patch(
            f"/api/v1/admin/users/{active_customer.id}/activate/"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == CustomUser.Status.ACTIVE
        assert response.data["is_active"] is True
        assert response.data["is_email_confirmed"] is True
        assert response.data["deleted_at"] is None


@pytest.mark.django_db
class TestAdminUserSoftDelete:

    def test_soft_delete_user(
        self, admin_user: CustomUser, active_customer: CustomUser
    ) -> None:
        """FR-ADM-005: Soft-delete sets status and deleted_at."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.delete(
            f"/api/v1/admin/users/{active_customer.id}/"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == CustomUser.Status.DELETED
        assert response.data["deleted_at"] is not None

        # Row still exists
        active_customer.refresh_from_db()
        assert active_customer.status == CustomUser.Status.DELETED


# ─── Order & Payment Tests (FR-ADM-010) ──────────────────────────────


@pytest.mark.django_db
class TestAdminOrders:

    def test_list_orders(self, admin_user: CustomUser, order: Order) -> None:
        """FR-ADM-010: Admin can view orders."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.get("/api/v1/admin/orders/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1
        assert response.data["results"][0]["order_number"] == order.order_number

    def test_filter_orders_by_status(
        self, admin_user: CustomUser, order: Order
    ) -> None:
        """FR-ADM-010: Filter orders by status."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        # The order fixture defaults to 'pending' status
        response = client.get("/api/v1/admin/orders/?status=pending")
        assert response.data["count"] >= 1

        response = client.get("/api/v1/admin/orders/?status=confirmed")
        assert response.data["count"] == 0


@pytest.mark.django_db
class TestAdminPayments:

    def test_list_payments(
        self, admin_user: CustomUser, payment: Payment
    ) -> None:
        """FR-ADM-010: Admin can view payments."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.get("/api/v1/admin/payments/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1
        assert response.data["results"][0]["order_number"] == payment.order.order_number

    def test_filter_payments_by_status(
        self, admin_user: CustomUser, payment: Payment
    ) -> None:
        """FR-ADM-010: Filter payments by status."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.get("/api/v1/admin/payments/?status=pending")
        assert response.data["count"] >= 1

        response = client.get("/api/v1/admin/payments/?status=paid")
        assert response.data["count"] == 0


# ─── Review Moderation Tests (FR-ADM-011) ────────────────────────────


@pytest.mark.django_db
class TestAdminReviewModeration:

    def test_list_reviews(self, admin_user: CustomUser, review: Review) -> None:
        """Admin can view all reviews."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.get("/api/v1/admin/reviews/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_hide_review(self, admin_user: CustomUser, review: Review) -> None:
        """FR-ADM-011: Admin can hide a review."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.patch(f"/api/v1/admin/reviews/{review.id}/hide/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_visible"] is False

    def test_unhide_review(self, admin_user: CustomUser, review: Review) -> None:
        """Admin can restore a hidden review's visibility."""
        review.is_visible = False
        review.save(update_fields=["is_visible"])

        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.patch(f"/api/v1/admin/reviews/{review.id}/unhide/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_visible"] is True

    def test_delete_review_is_soft_delete(
        self, admin_user: CustomUser, review: Review
    ) -> None:
        """FR-ADM-011: Admin delete uses soft-delete."""
        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.delete(f"/api/v1/admin/reviews/{review.id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        # Verify soft-delete: row still exists with deleted_at set
        review.refresh_from_db()
        assert review.deleted_at is not None
