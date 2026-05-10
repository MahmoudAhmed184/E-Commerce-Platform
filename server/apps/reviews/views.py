"""
reviews/views.py — HTTP request/response handlers for reviews (NFR-MNT-005).

Views are intentionally kept THIN. They handle:
  1. Parsing incoming requests
  2. Permission checking
  3. Calling the right serializer for validation
  4. Delegating to selectors (reads) or services (writes)
  5. Formatting the response

No business logic or raw querysets live here.
"""
from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import generics, status, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.products.models import Product

from .models import Review
from .permissions import IsReviewOwner
from .selectors import get_user_active_reviews, get_visible_product_reviews
from .serializers import ReviewCreateSerializer, ReviewSerializer, ReviewUpdateSerializer
from .services import create_review, delete_review, update_review


class ReviewPagination(PageNumberPagination):
    """Bounded pagination for review lists (NFR-PER-001).

    Default page size is 10, but the client can request up to 50 per page
    using the ``page_size`` query parameter.
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class ProductReviewListCreateView(generics.ListCreateAPIView):
    """List visible reviews for a product, or create a new review.

    GET  /api/v1/products/{product_slug}/reviews/  → public, paginated list
    POST /api/v1/products/{product_slug}/reviews/  → authenticated, create review
    """

    pagination_class = ReviewPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_product(self) -> Product:
        """Resolve the product from the URL slug."""
        return get_object_or_404(
            Product.objects.filter(is_active=True),
            slug=self.kwargs["product_slug"],
        )

    def get_queryset(self):
        """Delegate to the selector — views don't build querysets directly."""
        return get_visible_product_reviews(self.get_product())

    def get_serializer_context(self):
        """Inject the product into serializer context for POST requests.

        This way the serializer knows which product the review is for
        without the client needing to send a product ID in the body
        (it's already in the URL slug).
        """
        context = super().get_serializer_context()
        if self.request.method == "POST":
            context["product"] = self.get_product()
        return context

    def create(self, request, *args, **kwargs):
        """Validate with serializer, then delegate to service for DB write."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Service handles the actual creation + IntegrityError handling
        review = create_review(
            user=request.user,
            product=serializer.validated_data["product"],
            rating=serializer.validated_data["rating"],
            comment=serializer.validated_data.get("comment", ""),
        )

        # Use the read serializer for the response
        return Response(
            ReviewSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )


class ReviewViewSet(viewsets.ModelViewSet):
    """CRUD operations on the current user's own reviews.

    PATCH  /api/v1/reviews/{id}/  → update own review
    DELETE /api/v1/reviews/{id}/  → soft-delete own review

    The ``IsReviewOwner`` permission ensures that:
      - If you try to edit someone else's review, you get 403 (not 404).
      - This is more honest and helps frontend developers show the right error.
    """

    permission_classes = [IsAuthenticated, IsReviewOwner]
    http_method_names = ["patch", "delete", "head", "options"]
    pagination_class = ReviewPagination

    def get_queryset(self):
        """Return all active (non-deleted) reviews.

        We intentionally return ALL reviews here (not just the user's)
        so that ``get_object()`` can find the review by ID. If we filtered
        by ``user=request.user``, a non-owner would get 404 instead of 403.

        Object-level ownership is enforced by the ``IsReviewOwner`` permission
        class, which checks ``obj.user_id == request.user.id`` and returns
        403 Forbidden for non-owners.
        """
        return (
            Review.objects.filter(deleted_at__isnull=True)
            .select_related("user", "product")
        )

    def get_serializer_class(self):
        if self.action in {"partial_update", "update"}:
            return ReviewUpdateSerializer
        return ReviewSerializer

    def partial_update(self, request, *args, **kwargs):
        """Validate with serializer, then delegate to service for DB write."""
        review = self.get_object()  # triggers IsReviewOwner check
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = update_review(review, **serializer.validated_data)
        return Response(ReviewSerializer(review).data)

    def destroy(self, request, *args, **kwargs):
        """Soft-delete the review via the service layer."""
        review = self.get_object()  # triggers IsReviewOwner check
        delete_review(review)
        return Response(status=status.HTTP_204_NO_CONTENT)

