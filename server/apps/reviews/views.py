"""
reviews/views.py — HTTP orchestration for reviews (NFR-MNT-005).

Views stay thin.  They handle:
  1. Request parsing (DRF serializers)
  2. Permission checking (DRF permissions)
  3. Delegating reads to ``selectors.py``
  4. Delegating writes to ``services.py``
  5. Building the HTTP response

No business logic or raw ORM calls belong here.
"""
from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.mixins import DestroyModelMixin, UpdateModelMixin
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from apps.products.models import Product
from apps.products.selectors import get_active_products
from apps.users.permissions import IsActiveAccount

from . import selectors, services
from .permissions import IsReviewOwner
from .serializers import ReviewCreateSerializer, ReviewSerializer, ReviewUpdateSerializer


# ── Pagination ────────────────────────────────────────────────────


class ReviewPagination(PageNumberPagination):
    """Bounded pagination for review lists (NFR-PER-001).

    Default 10 reviews per page, max 50.  The frontend can request
    a different page size via ``?page_size=20``.
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


# ── Product-scoped endpoints ─────────────────────────────────────
#    /api/v1/products/<product_slug>/reviews/


class ProductReviewListCreateView(generics.ListCreateAPIView):
    """List visible reviews for a product (GET) or create one (POST).

    GET  → Public.  Returns paginated visible reviews (FR-REV-007).
    POST → Authenticated.  Creates a review (FR-REV-001).
    """

    serializer_class = ReviewSerializer
    pagination_class = ReviewPagination

    def get_throttles(self):
        if self.request.method == "POST":
            self.throttle_scope = "review_write"
        return super().get_throttles()

    # -- Permissions --------------------------------------------------

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsActiveAccount()]
        return [AllowAny()]

    # -- Helpers ------------------------------------------------------

    def get_product(self) -> Product:
        """Resolve the product from the URL slug."""
        return get_object_or_404(
            get_active_products(),
            slug=self.kwargs["product_slug"],
        )

    # -- GET (list) ---------------------------------------------------

    def get_queryset(self):
        """Delegate to ``selectors.get_visible_product_reviews``."""
        return selectors.get_visible_product_reviews(self.get_product())

    # -- POST (create) ------------------------------------------------

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.request.method == "POST":
            context["product"] = self.get_product()
        return context

    def create(self, request, *args, **kwargs):
        """Validate input → call service → return read serializer."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Delegate the actual creation to the service layer.
        review = services.create_review(
            user=request.user,
            **serializer.validated_data,
        )

        # Return the created review through the read serializer so
        # the response includes computed fields like user_name.
        return Response(
            ReviewSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )


# ── Owner-scoped endpoints ───────────────────────────────────────
#    /api/v1/reviews/<id>/


class ReviewViewSet(UpdateModelMixin, DestroyModelMixin, GenericViewSet):
    """Update or delete the authenticated user's own review.

    PATCH  → Update rating/comment (FR-REV-005).
    DELETE → Soft-delete the review (FR-REV-006).

    Ownership is enforced by ``IsReviewOwner``.  If the user tries
    to modify someone else's review, the API returns **403 Forbidden**
    instead of a misleading 404 (FR-REV-009).

    WHY NOT A FULL ModelViewSet?
    ----------------------------
    We only need ``partial_update`` and ``destroy`` here.  List and
    create are handled by ``ProductReviewListCreateView`` under the
    product-scoped URL.  Using mixins explicitly keeps the surface
    area small and intentional.
    """

    permission_classes = [IsAuthenticated, IsActiveAccount, IsReviewOwner]
    http_method_names = ["patch", "delete", "head", "options"]
    throttle_scope = "review_write"

    def get_queryset(self):
        """Return all active (non-deleted) reviews.

        We do NOT filter by ``user=request.user`` here, because
        ``IsReviewOwner`` handles the ownership check.  Filtering
        by user would turn a permission error into a 404, which is
        misleading.
        """
        return selectors.get_active_reviews_for_owner_permission()

    def get_serializer_class(self):
        return ReviewUpdateSerializer

    def partial_update(self, request, *args, **kwargs):
        """Validate input → call service → return read serializer."""
        review = self.get_object()  # also triggers permission check
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = services.update_review(review, **serializer.validated_data)

        return Response(ReviewSerializer(review).data)

    def destroy(self, request, *args, **kwargs):
        """Soft-delete the review via ``services.delete_review``."""
        review = self.get_object()  # also triggers permission check
        services.delete_review(review)
        return Response(status=status.HTTP_204_NO_CONTENT)
