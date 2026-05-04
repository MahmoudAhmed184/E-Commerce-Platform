from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.products.models import Product

from .models import Review
from .serializers import ReviewCreateSerializer, ReviewSerializer, ReviewUpdateSerializer


class ProductReviewListCreateView(generics.ListCreateAPIView):
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_product(self) -> Product:
        return get_object_or_404(Product.objects.filter(is_active=True), slug=self.kwargs["product_slug"])

    def get_queryset(self):
        return (
            Review.objects.filter(product=self.get_product(), is_visible=True)
            .select_related("user", "product")
            .order_by("-created_at")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.request.method == "POST":
            context["product"] = self.get_product()
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class ReviewViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user).select_related("user", "product")

    def get_serializer_class(self):
        if self.action in {"partial_update", "update"}:
            return ReviewUpdateSerializer
        return ReviewCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        review = self.get_object()
        serializer = self.get_serializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response(ReviewSerializer(review).data)
