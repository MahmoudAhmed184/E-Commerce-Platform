"""
products/views.py — HTTP request/response orchestration (NFR-MNT-005).

Views delegate reads to selectors and writes to services.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category, Product, ProductImage
from .selectors import get_active_products, get_active_categories
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    AdminCategorySerializer,
    AdminProductSerializer,
    AdminProductImageSerializer,
)
from . import services


# ─── Pagination ────────────────────────────────────────────────────


class StandardPagination(PageNumberPagination):
    """Bounded pagination with sensible defaults (NFR-PER-001)."""
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100


# ─── Public Read-Only ViewSets ─────────────────────────────────────


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Public category listing and detail."""
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    pagination_class = None  # categories are small lists

    def get_queryset(self):
        return get_active_categories()


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Public product listing and detail with search/filter/sort.

    Supports:
      - ``?search=`` — search by product name (FR-PRD-004)
      - ``?category__slug=`` — filter by category (FR-PRD-005)
      - ``?min_price=`` / ``?max_price=`` — price range (FR-PRD-006)
      - All three combined in one request (FR-PRD-007)
      - ``?ordering=price`` / ``-price`` / ``created_at`` etc.
    """
    lookup_field = 'slug'
    pagination_class = StandardPagination
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ['category__slug']
    search_fields = ['name']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = get_active_products()
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price is not None:
            queryset = queryset.filter(price__gte=min_price)
        if max_price is not None:
            queryset = queryset.filter(price__lte=max_price)
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer


# ─── Admin ViewSets ────────────────────────────────────────────────


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """Admin CRUD for categories (FR-ADM-009)."""
    queryset = Category.objects.all()
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'slug'
    pagination_class = StandardPagination

    @action(detail=True, methods=['post'])
    def deactivate(self, request, slug=None):
        category = self.get_object()
        services.deactivate_category(category)
        return Response({'status': 'deactivated'})


class AdminProductViewSet(viewsets.ModelViewSet):
    """Admin CRUD for products (FR-ADM-006, FR-ADM-007, FR-ADM-008)."""
    queryset = Product.objects.select_related('category').prefetch_related('images').all()
    serializer_class = AdminProductSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'slug'
    pagination_class = StandardPagination

    @action(detail=True, methods=['post'])
    def deactivate(self, request, slug=None):
        """Soft-deactivate product without deleting historical order data."""
        product = self.get_object()
        services.deactivate_product(product)
        return Response({'status': 'deactivated'})

    @action(detail=True, methods=['post'])
    def update_stock(self, request, slug=None):
        """Update stock quantity for a product."""
        product = self.get_object()
        quantity = request.data.get('quantity')
        if quantity is None:
            return Response(
                {'error': 'quantity is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            quantity = int(quantity)
            if quantity < 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response(
                {'error': 'quantity must be a non-negative integer'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        product = services.update_product_stock(product, quantity)
        serializer = self.get_serializer(product)
        return Response(serializer.data)


class AdminProductImageViewSet(viewsets.ModelViewSet):
    """Admin CRUD for product images."""
    queryset = ProductImage.objects.select_related('product').all()
    serializer_class = AdminProductImageSerializer
    permission_classes = [IsAdminUser]
