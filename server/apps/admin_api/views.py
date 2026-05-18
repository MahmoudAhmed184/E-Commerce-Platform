"""
admin_api/views.py — HTTP handlers for admin operations (NFR-MNT-005).

Views are thin — they handle HTTP plumbing and delegate to:
  - ``selectors.py`` for all read queries
  - ``services.py`` for all write operations

All endpoints require ``IsAdminUser`` permission (FR-ADM-012).
Non-admin requests get an automatic 403 from DRF.
"""
from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .selectors import (
    get_admin_dashboard_stats,
    get_admin_orders,
    get_admin_payments,
    get_admin_reviews,
    get_admin_users,
)
from .serializers import (
    AdminOrderSerializer,
    AdminPaymentSerializer,
    AdminReviewSerializer,
    AdminUserSerializer,
)
from .services import (
    admin_delete_review,
    admin_hide_review,
    admin_unhide_review,
    approve_user,
    restrict_user,
    soft_delete_user,
)


class AdminPagination(PageNumberPagination):
    """Bounded pagination for admin list endpoints (NFR-PER-001).

    Larger default page size than customer-facing endpoints because
    admins typically want to see more records at once.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# ─── Dashboard (FR-ADM-002) ─────────────────────────────────────────


class AdminDashboardAPIView(APIView):
    """Admin dashboard statistics.
    
    GET /api/v1/admin/dashboard/
    """
    
    permission_classes = [IsAdminUser]
    
    def get(self, request, *args, **kwargs):
        stats = get_admin_dashboard_stats()
        # Serialize the recent records using existing serializers
        stats["recent_orders"] = AdminOrderSerializer(stats["recent_orders"], many=True).data
        stats["recent_payments"] = AdminPaymentSerializer(stats["recent_payments"], many=True).data
        stats["recent_reviews"] = AdminReviewSerializer(stats["recent_reviews"], many=True).data
        return Response(stats)


# ─── User Management (FR-ADM-001 to FR-ADM-005) ─────────────────────


class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin user management endpoints.

    GET    /api/v1/admin/users/                 → list/search users
    GET    /api/v1/admin/users/{id}/            → user detail
    PATCH  /api/v1/admin/users/{id}/approve/    → approve pending user
    PATCH  /api/v1/admin/users/{id}/restrict/   → restrict user
    DELETE /api/v1/admin/users/{id}/            → soft-delete user
    """

    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination

    def get_queryset(self):
        """Delegate to selector with optional search param."""
        search = self.request.query_params.get("search")
        return get_admin_users(search=search)

    @action(detail=True, methods=["patch"])
    def approve(self, request, pk=None):
        """Approve a pending user account (FR-ADM-003).

        Only users with ``status=pending_approval`` can be approved.
        Returns 400 with a clear message for other statuses.
        """
        user = self.get_object()
        # service.approve_user() validates the status and raises
        # ValidationError if not pending — DRF auto-formats as 400
        user = approve_user(user)
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["patch"])
    def restrict(self, request, pk=None):
        """Restrict a user account (FR-ADM-004).

        Cannot restrict an already soft-deleted user.
        """
        user = self.get_object()
        user = restrict_user(user)
        return Response(self.get_serializer(user).data)

    def destroy(self, request, *args, **kwargs):
        """Soft-delete a user account (FR-ADM-005).

        Returns the updated user data (not 204) so the admin UI can
        immediately show the new status without a refetch.
        """
        user = self.get_object()
        user = soft_delete_user(user)
        return Response(self.get_serializer(user).data, status=status.HTTP_200_OK)


# ─── Order & Payment Status (FR-ADM-010) ─────────────────────────────


class AdminOrderViewSet(viewsets.ModelViewSet):
    """Admin order management endpoints.

    GET   /api/v1/admin/orders/            → list orders (filterable)
    GET   /api/v1/admin/orders/{id}/       → order detail
    PATCH /api/v1/admin/orders/{id}/       → update order status

    Supports query parameters:
      - ``status`` — filter by order status (pending, confirmed, etc)
      - ``payment_status`` — filter by payment status (pending, paid, etc)
    """

    serializer_class = AdminOrderSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        """Delegate to selector with optional status filters."""
        return get_admin_orders(
            status=self.request.query_params.get("status"),
            payment_status=self.request.query_params.get("payment_status"),
        )


class AdminPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin payment viewing endpoints.

    GET /api/v1/admin/payments/        → list payments (filterable)
    GET /api/v1/admin/payments/{id}/   → payment detail

    Supports query parameter:
      - ``status`` — filter by payment status (pending, paid, failed, etc)
    """

    serializer_class = AdminPaymentSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination

    def get_queryset(self):
        """Delegate to selector with optional status filter."""
        return get_admin_payments(
            status=self.request.query_params.get("status"),
        )


# ─── Review Moderation (FR-ADM-011) ──────────────────────────────────


class AdminReviewViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin review moderation endpoints.

    GET    /api/v1/admin/reviews/             → list all reviews
    GET    /api/v1/admin/reviews/{id}/        → review detail
    PATCH  /api/v1/admin/reviews/{id}/hide/   → hide from public
    PATCH  /api/v1/admin/reviews/{id}/unhide/ → restore visibility
    DELETE /api/v1/admin/reviews/{id}/        → soft-delete review
    """

    serializer_class = AdminReviewSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination

    def get_queryset(self):
        """Delegate to selector — returns ALL reviews for moderation."""
        return get_admin_reviews()

    @action(detail=True, methods=["patch"])
    def hide(self, request, pk=None):
        """Hide a review from public display (FR-ADM-011).

        Sets ``is_visible=False`` via the review service layer.
        """
        review = self.get_object()
        review = admin_hide_review(review)
        return Response(self.get_serializer(review).data)

    @action(detail=True, methods=["patch"])
    def unhide(self, request, pk=None):
        """Restore a hidden review's visibility.

        Useful when an admin accidentally hides a legitimate review.
        """
        review = self.get_object()
        review = admin_unhide_review(review)
        return Response(self.get_serializer(review).data)

    def destroy(self, request, *args, **kwargs):
        """Soft-delete a review via admin moderation (FR-ADM-011).

        Uses ``services.admin_delete_review()`` which delegates to
        ``reviews.services.delete_review()`` — consistent soft-delete
        pattern from P2-BE-REV-001.
        """
        review = self.get_object()
        admin_delete_review(review)
        return Response(status=status.HTTP_204_NO_CONTENT)

