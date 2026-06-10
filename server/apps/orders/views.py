from __future__ import annotations

from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError, transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.cart import services as cart_services
from apps.payments import services as payment_services
from apps.users.permissions import IsActiveAccount, enforce_active_account, has_admin_role

from . import selectors
from . import services as order_services
from .serializers import CheckoutSerializer, CheckoutSummaryRequestSerializer, CheckoutSummarySerializer, OrderSerializer


class OrderPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    lookup_field = "order_number"
    pagination_class = OrderPagination
    guest_access_token_param = "guest_access_token"

    def get_throttles(self):
        if self.action in {"checkout", "summary"}:
            self.throttle_scope = "checkout"
        return super().get_throttles()

    def get_permissions(self):
        if self.action in {"checkout", "retrieve", "summary"}:
            return [AllowAny()]
        return [IsAuthenticated(), IsActiveAccount()]

    def get_queryset(self):
        if self.action == "list":
            return selectors.get_user_orders(self.request.user)
        if self.action == "retrieve":
            order_number = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)
            if self.request.user.is_authenticated:
                enforce_active_account(self.request.user)
                if has_admin_role(self.request.user):
                    return selectors.get_admin_retrievable_orders()
                return selectors.get_user_retrievable_orders(
                    self.request.user,
                    include_guest_context=self._has_guest_order_context(order_number),
                )
            if self._has_guest_order_context(order_number):
                return selectors.get_guest_orders()
            return selectors.get_no_orders()
        return selectors.get_order_base_queryset()

    def _has_guest_order_context(self, order_number: str | None) -> bool:
        return order_services.is_valid_guest_order_access_token(
            order_number=order_number,
            token=self.request.query_params.get(self.guest_access_token_param),
        )

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def summary(self, request):
        enforce_active_account(request.user)
        serializer = CheckoutSummaryRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            summary = order_services.build_checkout_summary(items=serializer.validated_data["items"])
        except ObjectDoesNotExist:
            return Response({"items": ["One or more products could not be found."]}, status=status.HTTP_400_BAD_REQUEST)

        return Response(CheckoutSummarySerializer(summary).data)

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def checkout(self, request):
        enforce_active_account(request.user)
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            with transaction.atomic():
                order = order_services.create_checkout_order(
                    user=request.user,
                    email=data["email"],
                    phone=data["phone"],
                    shipping_address=data["shipping_address"],
                    items=data["items"],
                )
                payment_services.create_payment_for_order(
                    order=order,
                    method=data["payment_method"],
                    user=request.user,
                    idempotency_key=request.headers.get("Idempotency-Key"),
                )
                cart_services.convert_active_cart_for_user(request.user)
        except ObjectDoesNotExist:
            return Response({"items": ["One or more products could not be found."]}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({"detail": "Duplicate checkout request."}, status=status.HTTP_409_CONFLICT)

        return Response(
            OrderSerializer(order, context={"include_guest_access_token": True}).data,
            status=status.HTTP_201_CREATED,
        )
