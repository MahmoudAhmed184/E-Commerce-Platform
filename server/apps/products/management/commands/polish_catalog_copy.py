from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.products.catalog_copy import (
    professional_category_description,
    professional_product_description_from_existing,
)
from apps.products.models import Category, Product


class Command(BaseCommand):
    help = "Rewrite existing product and category descriptions with professional catalog copy."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview how many records would be updated without saving changes.",
        )

    def handle(self, *args, **options):
        dry_run = bool(options["dry_run"])
        category_count = 0
        product_count = 0

        for category in Category.objects.all().iterator():
            updated_description = professional_category_description(category.slug, category.name)
            if category.description == updated_description:
                continue

            category_count += 1
            if not dry_run:
                category.description = updated_description
                category.save(update_fields=["description", "updated_at"])

        for product in Product.objects.select_related("category").iterator():
            updated_description = professional_product_description_from_existing(
                name=product.name,
                category_name=product.category.name,
                description=product.description,
            )
            if product.description == updated_description:
                continue

            product_count += 1
            if not dry_run:
                product.description = updated_description
                product.save(update_fields=["description", "updated_at"])

        action = "Would update" if dry_run else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} {category_count} categories and {product_count} products."
            )
        )
