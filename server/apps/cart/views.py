from __future__ import annotations

from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsActiveAccount

from . import services
from .serializers import AddCartItemSerializer, CartSerializer, UpdateCartItemSerializer


class CartView(APIView):
    permission_classes = [IsAuthenticated, IsActiveAccount]

    def get(self, request):
        cart = services.get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={"request": request}).data)


class CartItemCollectionView(APIView):
    permission_classes = [IsAuthenticated, IsActiveAccount]

    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = services.add_item(
            user=request.user,
            product_id=serializer.validated_data["product"].id,
            quantity=serializer.validated_data["quantity"],
        )
        return Response(CartSerializer(cart, context={"request": request}).data, status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    permission_classes = [IsAuthenticated, IsActiveAccount]

    def patch(self, request, item_id: int):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            cart = services.update_item(
                user=request.user,
                item_id=item_id,
                quantity=serializer.validated_data["quantity"],
            )
        except ObjectDoesNotExist:
            return Response({"detail": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CartSerializer(cart, context={"request": request}).data)

    def delete(self, request, item_id: int):
        try:
            cart = services.remove_item(user=request.user, item_id=item_id)
        except ObjectDoesNotExist:
            return Response({"detail": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CartSerializer(cart, context={"request": request}).data)
