from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from apps.users.permissions import IsAdminRole

from . import selectors, services
from .serializers import AdminOrderSerializer, AdminPaymentSerializer, AdminReviewSerializer, AdminUserSerializer


class AdminPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]
    pagination_class = AdminPagination

    def get_queryset(self):
        return selectors.get_admin_users(self.request.query_params.get("search"))

    @action(detail=True, methods=["patch"])
    def approve(self, request, pk=None):
        user = services.approve_user(self.get_object())
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["patch"])
    def restrict(self, request, pk=None):
        user = services.restrict_user(self.get_object())
        return Response(self.get_serializer(user).data)

    def destroy(self, request, *args, **kwargs):
        user = services.soft_delete_user(self.get_object())
        return Response(self.get_serializer(user).data, status=status.HTTP_200_OK)


class AdminOrderViewSet(viewsets.ModelViewSet):
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAdminRole]
    pagination_class = AdminPagination
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return selectors.get_admin_orders()


class AdminPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdminPaymentSerializer
    permission_classes = [IsAdminRole]
    pagination_class = AdminPagination

    def get_queryset(self):
        return selectors.get_admin_payments()


class AdminReviewViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdminReviewSerializer
    permission_classes = [IsAdminRole]
    pagination_class = AdminPagination

    def get_queryset(self):
        return selectors.get_admin_reviews()

    @action(detail=True, methods=["patch"])
    def hide(self, request, pk=None):
        review = services.hide_review(self.get_object())
        return Response(self.get_serializer(review).data)

    @action(detail=True, methods=["patch"])
    def unhide(self, request, pk=None):
        review = services.unhide_review(self.get_object())
        return Response(self.get_serializer(review).data)

    def destroy(self, request, *args, **kwargs):
        services.delete_review(self.get_object())
        return Response(status=status.HTTP_204_NO_CONTENT)
