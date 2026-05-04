from __future__ import annotations

from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError, transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.cart import services as cart_services
from apps.payments import services as payment_services

from . import services as order_services
from .models import Order
from .serializers import CheckoutSerializer, OrderSerializer


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    lookup_field = "order_number"

    def get_permissions(self):
        if self.action in {"checkout", "retrieve"}:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Order.objects.prefetch_related("items").select_related("payment")
        if self.action == "list":
            return queryset.filter(user=self.request.user)
        if self.action == "retrieve":
            if self.request.user.is_authenticated:
                if self.request.user.is_staff:
                    return queryset
                return queryset.filter(user=self.request.user)
            return queryset.filter(user__isnull=True)
        return queryset

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def checkout(self, request):
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
                cart_services.clear_cart_for_user(request.user)
        except ObjectDoesNotExist:
            return Response({"items": ["One or more products could not be found."]}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({"detail": "Duplicate checkout request."}, status=status.HTTP_409_CONFLICT)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
