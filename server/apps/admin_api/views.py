from __future__ import annotations

from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from apps.orders.models import Order
from apps.payments.models import Payment
from apps.reviews.models import Review
from apps.users.models import CustomUser

from .serializers import (
    AdminOrderSerializer,
    AdminPaymentSerializer,
    AdminReviewSerializer,
    AdminReviewVisibilitySerializer,
    AdminUserSerializer,
)


class AdminPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination

    def get_queryset(self):
        queryset = CustomUser.objects.all().order_by("-created_at")
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(phone__icontains=search)
                | Q(full_name__icontains=search)
            )
        return queryset

    @action(detail=True, methods=["patch"])
    def approve(self, request, pk=None):
        user = self.get_object()
        user.status = CustomUser.Status.ACTIVE
        user.is_email_confirmed = True
        user.save(update_fields=["status", "is_email_confirmed", "updated_at"])
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["patch"])
    def restrict(self, request, pk=None):
        user = self.get_object()
        user.status = CustomUser.Status.RESTRICTED
        user.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(user).data)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user.status = CustomUser.Status.DELETED
        user.deleted_at = timezone.now()
        user.save(update_fields=["status", "deleted_at", "updated_at"])
        return Response(self.get_serializer(user).data, status=status.HTTP_200_OK)


class AdminOrderViewSet(viewsets.ModelViewSet):
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return Order.objects.all().order_by("-created_at")


class AdminPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdminPaymentSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination

    def get_queryset(self):
        return Payment.objects.select_related("order").order_by("-created_at")


class AdminReviewViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdminReviewSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination

    def get_queryset(self):
        return Review.objects.select_related("user", "product").order_by("-created_at")

    @action(detail=True, methods=["patch"])
    def hide(self, request, pk=None):
        review = self.get_object()
        review.is_visible = False
        review.save(update_fields=["is_visible", "updated_at"])
        return Response(self.get_serializer(review).data)

    @action(detail=True, methods=["patch"])
    def visibility(self, request, pk=None):
        review = self.get_object()
        serializer = AdminReviewVisibilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review.is_visible = serializer.validated_data["is_visible"]
        review.save(update_fields=["is_visible", "updated_at"])
        return Response(self.get_serializer(review).data)

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
