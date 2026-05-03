"""
products/tests.py — Automated tests covering services, selectors,
and API endpoints (NFR-TST-001, NFR-TST-002).
"""

from io import StringIO
from decimal import Decimal
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import CustomUser

from . import services
from .models import Category, Product, ProductImage
from .selectors import get_active_categories, get_active_products, get_product_by_slug

# ─── Helpers ───────────────────────────────────────────────────────


def make_category(**kwargs):
    defaults = {"name": "Electronics", "is_active": True}
    defaults.update(kwargs)
    return Category.objects.create(**defaults)


def make_product(category, **kwargs):
    defaults = {
        "name": "Test Product",
        "description": "A test product",
        "price": Decimal("99.99"),
        "stock": 10,
        "is_active": True,
    }
    defaults.update(kwargs)
    return Product.objects.create(category=category, **defaults)


def make_admin():
    return CustomUser.objects.create_superuser(
        email="admin@test.com",
        password="adminpass",
        full_name="Admin User",
        phone="01000000000",
    )


# ─── Services Tests ────────────────────────────────────────────────


class ProductServicesTest(TestCase):
    def setUp(self):
        self.category = make_category()

    def test_create_product(self):
        product = services.create_product(
            name="New Phone",
            description="A phone",
            price=Decimal("500.00"),
            stock=20,
            category=self.category,
        )
        self.assertEqual(product.name, "New Phone")
        self.assertTrue(product.pk)
        self.assertTrue(product.slug)

    def test_update_product(self):
        product = make_product(self.category)
        updated = services.update_product(product, price=Decimal("199.99"))
        self.assertEqual(updated.price, Decimal("199.99"))

    def test_deactivate_product(self):
        product = make_product(self.category)
        services.deactivate_product(product)
        product.refresh_from_db()
        self.assertFalse(product.is_active)

    def test_update_stock(self):
        product = make_product(self.category, stock=5)
        services.update_product_stock(product, 100)
        product.refresh_from_db()
        self.assertEqual(product.stock, 100)

    def test_decrement_stock(self):
        product = make_product(self.category, stock=10)
        services.decrement_stock(product, 3)
        product.refresh_from_db()
        self.assertEqual(product.stock, 7)

    def test_decrement_stock_raises_when_insufficient(self):
        product = make_product(self.category, stock=2)
        with self.assertRaises(ValueError):
            services.decrement_stock(product, 5)

    def test_create_category(self):
        cat = services.create_category(name="Clothing")
        self.assertEqual(cat.name, "Clothing")
        self.assertTrue(cat.slug)

    def test_deactivate_category(self):
        cat = make_category(name="Old Cat")
        services.deactivate_category(cat)
        cat.refresh_from_db()
        self.assertFalse(cat.is_active)


# ─── Seeder Tests ─────────────────────────────────────────────────


class ProductSeederCommandTest(TestCase):
    @patch("apps.products.management.commands.seed_products.fetch_json")
    def test_seed_products_imports_dummyjson_products(self, fetch_json):
        fetch_json.side_effect = [
            [
                {
                    "slug": "beauty",
                    "name": "Beauty",
                    "url": "https://dummyjson.com/products/category/beauty",
                }
            ],
            {
                "products": [
                    {
                        "id": 1,
                        "title": "Essence Mascara Lash Princess",
                        "description": "A volumizing mascara.",
                        "category": "beauty",
                        "price": 9.99,
                        "stock": 99,
                        "brand": "Essence",
                        "sku": "RCH45Q1A",
                        "thumbnail": "https://example.com/mascara.webp",
                        "images": ["https://example.com/mascara-1.webp"],
                    }
                ],
                "total": 1,
                "skip": 0,
                "limit": 1,
            },
        ]

        output = StringIO()
        call_command("seed_products", "--skip-images", stdout=output)

        category = Category.objects.get(slug="beauty")
        product = Product.objects.get(slug="dummyjson-1-essence-mascara-lash-princess")

        self.assertEqual(category.name, "Beauty")
        self.assertEqual(product.category, category)
        self.assertEqual(product.price, Decimal("9.99"))
        self.assertEqual(product.stock, 99)
        self.assertIn("Brand: Essence.", product.description)
        self.assertEqual(ProductImage.objects.count(), 0)
        self.assertIn("Seed complete: 1 created", output.getvalue())


# ─── Selectors Tests ───────────────────────────────────────────────


class ProductSelectorsTest(TestCase):
    def setUp(self):
        self.category = make_category()
        self.active = make_product(self.category, name="Active Product")
        self.inactive = make_product(
            self.category, name="Inactive Product", is_active=False
        )

    def test_get_active_products_excludes_inactive(self):
        qs = get_active_products()
        names = list(qs.values_list("name", flat=True))
        self.assertIn("Active Product", names)
        self.assertNotIn("Inactive Product", names)

    def test_get_active_categories(self):
        inactive_cat = make_category(name="Old Category", is_active=False)
        qs = get_active_categories()
        ids = list(qs.values_list("id", flat=True))
        self.assertIn(self.category.pk, ids)
        self.assertNotIn(inactive_cat.pk, ids)

    def test_get_product_by_slug(self):
        product = get_product_by_slug(self.active.slug)
        self.assertEqual(product.pk, self.active.pk)

    def test_get_product_by_slug_404_for_inactive(self):
        from django.core.exceptions import ObjectDoesNotExist

        with self.assertRaises(ObjectDoesNotExist):
            get_product_by_slug(self.inactive.slug)

    def test_product_availability_in_stock(self):
        self.assertEqual(self.active.availability, "in_stock")

    def test_product_availability_out_of_stock(self):
        product = make_product(self.category, name="No Stock", stock=0)
        self.assertEqual(product.availability, "out_of_stock")


# ─── Public Product API Tests ───────────────────────────────────────


class ProductAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat_electronics = make_category(name="Electronics")
        self.cat_clothing = make_category(name="Clothing")
        self.phone = make_product(
            self.cat_electronics, name="Smartphone", price=Decimal("599.99"), stock=50
        )
        self.laptop = make_product(
            self.cat_electronics, name="Laptop", price=Decimal("999.99"), stock=10
        )
        self.shirt = make_product(
            self.cat_clothing, name="T-Shirt", price=Decimal("19.99"), stock=200
        )
        self.inactive = make_product(
            self.cat_electronics, name="Old Phone", is_active=False
        )

    # FR-PRD-001: paginated product list
    def test_list_products_returns_200(self):
        response = self.client.get("/api/v1/products/products/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_products_is_paginated(self):
        response = self.client.get("/api/v1/products/products/")
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)

    # FR-PRD-002: only active, with availability
    def test_list_excludes_inactive(self):
        response = self.client.get("/api/v1/products/products/")
        names = [p["name"] for p in response.data["results"]]
        self.assertNotIn("Old Phone", names)

    def test_list_includes_availability(self):
        response = self.client.get("/api/v1/products/products/")
        for item in response.data["results"]:
            self.assertIn("availability", item)
            self.assertIn(item["availability"], ["in_stock", "out_of_stock"])

    def test_list_no_description_field(self):
        response = self.client.get("/api/v1/products/products/")
        for item in response.data["results"]:
            self.assertNotIn("description", item)

    # FR-PRD-003: product detail
    def test_product_detail_returns_200(self):
        response = self.client.get(f"/api/v1/products/products/{self.phone.slug}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_product_detail_has_description(self):
        response = self.client.get(f"/api/v1/products/products/{self.phone.slug}/")
        self.assertIn("description", response.data)

    def test_product_detail_inactive_returns_404(self):
        response = self.client.get(f"/api/v1/products/products/{self.inactive.slug}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # FR-PRD-004: search by name
    def test_search_by_name(self):
        response = self.client.get("/api/v1/products/products/?search=Smartphone")
        names = [p["name"] for p in response.data["results"]]
        self.assertIn("Smartphone", names)
        self.assertNotIn("T-Shirt", names)

    # FR-PRD-005: filter by category
    def test_filter_by_category(self):
        response = self.client.get(
            f"/api/v1/products/products/?category__slug={self.cat_clothing.slug}"
        )
        names = [p["name"] for p in response.data["results"]]
        self.assertIn("T-Shirt", names)
        self.assertNotIn("Smartphone", names)

    # FR-PRD-006: filter by price range
    def test_filter_by_min_price(self):
        response = self.client.get("/api/v1/products/products/?min_price=900")
        names = [p["name"] for p in response.data["results"]]
        self.assertIn("Laptop", names)
        self.assertNotIn("Smartphone", names)

    def test_filter_by_max_price(self):
        response = self.client.get("/api/v1/products/products/?max_price=100")
        names = [p["name"] for p in response.data["results"]]
        self.assertIn("T-Shirt", names)
        self.assertNotIn("Laptop", names)

    # FR-PRD-007: combined filters
    def test_combined_filters(self):
        response = self.client.get(
            f"/api/v1/products/products/?search=Laptop&category__slug={self.cat_electronics.slug}&min_price=500"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [p["name"] for p in response.data["results"]]
        self.assertIn("Laptop", names)

    # FR-PRD-008: out-of-stock display
    def test_out_of_stock_still_listed(self):
        make_product(self.cat_electronics, name="No Stock", stock=0)
        response = self.client.get("/api/v1/products/products/")
        availabilities = [p["availability"] for p in response.data["results"]]
        self.assertIn("out_of_stock", availabilities)

    # FR-PRD-010: product belongs to category
    def test_product_has_category(self):
        response = self.client.get(f"/api/v1/products/products/{self.phone.slug}/")
        self.assertIn("category", response.data)
        self.assertEqual(response.data["category"]["name"], "Electronics")


# ─── Category API Tests ─────────────────────────────────────────────


class CategoryAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = make_category(name="Electronics")
        make_category(name="Inactive Cat", is_active=False)

    def test_list_categories(self):
        response = self.client.get("/api/v1/products/categories/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_only_active_categories(self):
        response = self.client.get("/api/v1/products/categories/")
        # categories have no pagination (small list)
        names = [c["name"] for c in response.data]
        self.assertIn("Electronics", names)
        self.assertNotIn("Inactive Cat", names)


# ─── Admin API Tests ────────────────────────────────────────────────


class AdminProductAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_admin()
        self.client.force_authenticate(user=self.admin)
        self.category = make_category()

    def test_admin_create_product(self):
        data = {
            "name": "New Laptop",
            "description": "A powerful laptop",
            "price": "1299.99",
            "stock": 15,
            "category_id": self.category.pk,
        }
        response = self.client.post("/api/v1/products/admin/products/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Laptop")

    def test_admin_update_product(self):
        product = make_product(self.category)
        data = {
            "name": "Updated Name",
            "description": product.description,
            "price": str(product.price),
            "stock": product.stock,
            "category_id": self.category.pk,
        }
        response = self.client.put(
            f"/api/v1/products/admin/products/{product.slug}/", data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Name")

    def test_admin_deactivate_product(self):
        product = make_product(self.category)
        response = self.client.post(
            f"/api/v1/products/admin/products/{product.slug}/deactivate/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertFalse(product.is_active)

    def test_admin_update_stock(self):
        product = make_product(self.category, stock=5)
        response = self.client.post(
            f"/api/v1/products/admin/products/{product.slug}/update_stock/",
            {"quantity": 50},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertEqual(product.stock, 50)

    def test_admin_update_stock_requires_quantity(self):
        product = make_product(self.category)
        response = self.client.post(
            f"/api/v1/products/admin/products/{product.slug}/update_stock/", {}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_cannot_access_admin_endpoints(self):
        user = CustomUser.objects.create_user(
            email="user@test.com",
            password="pass",
            full_name="Regular User",
            phone="01111111111",
        )
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/v1/products/admin/products/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_create_category(self):
        response = self.client.post(
            "/api/v1/products/admin/categories/",
            {"name": "Sports", "description": "Sports gear"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_deactivate_category(self):
        cat = make_category(name="ToDeactivate")
        response = self.client.post(
            f"/api/v1/products/admin/categories/{cat.slug}/deactivate/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cat.refresh_from_db()
        self.assertFalse(cat.is_active)
