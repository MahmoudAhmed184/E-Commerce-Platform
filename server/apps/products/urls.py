from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, AdminCategoryViewSet, AdminProductViewSet, AdminProductImageViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'admin/categories', AdminCategoryViewSet, basename='admin-category')
router.register(r'admin/products', AdminProductViewSet, basename='admin-product')
router.register(r'admin/product-images', AdminProductImageViewSet, basename='admin-product-image')

urlpatterns = [
    path('', include(router.urls)),
]
