from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminOrderViewSet, AdminPaymentViewSet, AdminReviewViewSet, AdminUserViewSet


router = DefaultRouter()
router.register("users", AdminUserViewSet, basename="admin-user")
router.register("orders", AdminOrderViewSet, basename="admin-order")
router.register("payments", AdminPaymentViewSet, basename="admin-payment")
router.register("reviews", AdminReviewViewSet, basename="admin-review")

urlpatterns = [
    path("", include(router.urls)),
]
