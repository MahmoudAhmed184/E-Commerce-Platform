from django.urls import path

from .views import CartItemCollectionView, CartItemDetailView, CartView, CartClearView


urlpatterns = [
    path("", CartView.as_view(), name="cart-detail"),
    path("items/", CartItemCollectionView.as_view(), name="cart-items"),
    path("items/<int:item_id>/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("clear/", CartClearView.as_view(), name="cart-clear"),
]
