from __future__ import annotations

import json
import mimetypes
from decimal import Decimal, InvalidOperation
from pathlib import PurePosixPath
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin, urlparse
from urllib.request import Request, urlopen

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.products.models import (
    ALLOWED_IMAGE_EXTENSIONS,
    Category,
    Product,
    ProductImage,
)


DEFAULT_BASE_URL = "https://dummyjson.com"
PRODUCT_SELECT_FIELDS = ",".join(
    [
        "id",
        "title",
        "description",
        "category",
        "price",
        "stock",
        "thumbnail",
        "images",
        "brand",
        "sku",
        "warrantyInformation",
        "shippingInformation",
        "returnPolicy",
    ]
)


class Command(BaseCommand):
    help = "Seed products and categories from the DummyJSON public products API."

    def add_arguments(self, parser):
        parser.add_argument(
            "--base-url",
            default=DEFAULT_BASE_URL,
            help=f"API base URL. Defaults to {DEFAULT_BASE_URL}.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help=(
                "Number of products to import. DummyJSON uses 0 to return all "
                "products. Default: 0."
            ),
        )
        parser.add_argument(
            "--skip",
            type=int,
            default=0,
            help="Number of API products to skip before importing. Default: 0.",
        )
        parser.add_argument(
            "--timeout",
            type=float,
            default=20.0,
            help="HTTP timeout in seconds for API and image requests. Default: 20.",
        )
        parser.add_argument(
            "--max-images-per-product",
            type=int,
            default=1,
            help="Maximum images to download for each product. Default: 1.",
        )
        parser.add_argument(
            "--skip-images",
            action="store_true",
            help="Create products without downloading image files.",
        )
        parser.add_argument(
            "--refresh-images",
            action="store_true",
            help="Replace existing images for matched products.",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing products, product images, and categories before importing.",
        )

    def handle(self, *args, **options):
        base_url = normalize_base_url(options["base_url"])
        limit = options["limit"]
        skip = options["skip"]
        timeout = options["timeout"]
        max_images_per_product = options["max_images_per_product"]
        skip_images = options["skip_images"]
        refresh_images = options["refresh_images"]

        if limit < 0:
            raise CommandError("--limit must be 0 or greater.")
        if skip < 0:
            raise CommandError("--skip must be 0 or greater.")
        if timeout <= 0:
            raise CommandError("--timeout must be greater than 0.")
        if max_images_per_product < 0:
            raise CommandError("--max-images-per-product must be 0 or greater.")

        if options["clear"]:
            self.clear_catalog()

        categories_payload = fetch_json(
            build_url(base_url, "/products/categories"),
            timeout,
        )
        categories = self.seed_categories(categories_payload)

        query = urlencode(
            {
                "limit": limit,
                "skip": skip,
                "select": PRODUCT_SELECT_FIELDS,
            }
        )
        products_payload = fetch_json(build_url(base_url, f"/products?{query}"), timeout)
        products = products_payload.get("products", [])

        if not isinstance(products, list):
            raise CommandError("Unexpected products API response: expected a products list.")

        created_count = 0
        updated_count = 0
        image_count = 0

        self.stdout.write(f"Importing {len(products)} products from {base_url}...")

        for product_data in products:
            product, created = self.seed_product(product_data, categories)
            created_count += int(created)
            updated_count += int(not created)

            if skip_images or max_images_per_product == 0:
                continue

            image_count += self.seed_images(
                product,
                product_data,
                timeout=timeout,
                max_images=max_images_per_product,
                refresh=refresh_images,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {created_count} created, {updated_count} updated, "
                f"{len(categories)} categories, {image_count} images downloaded."
            )
        )

    def clear_catalog(self) -> None:
        self.stdout.write("Clearing existing product catalog...")

        for image in ProductImage.objects.exclude(image="").iterator():
            image.image.delete(save=False)

        ProductImage.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()

    @transaction.atomic
    def seed_categories(self, payload: Any) -> dict[str, Category]:
        if not isinstance(payload, list):
            raise CommandError("Unexpected categories API response: expected a list.")

        categories: dict[str, Category] = {}

        for item in payload:
            if isinstance(item, dict):
                source_slug = str(item.get("slug") or "").strip()
                name = str(item.get("name") or source_slug).strip()
            else:
                source_slug = str(item).strip()
                name = source_slug.replace("-", " ").title()

            if not source_slug:
                continue

            slug = slugify(source_slug)
            category, _ = Category.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "description": (
                        f"Products imported from DummyJSON category '{source_slug}'."
                    ),
                    "is_active": True,
                },
            )
            categories[source_slug] = category

        return categories

    @transaction.atomic
    def seed_product(
        self,
        product_data: dict[str, Any],
        categories: dict[str, Category],
    ) -> tuple[Product, bool]:
        title = clean_text(product_data.get("title"))
        if not title:
            raise CommandError(f"Product is missing a title: {product_data!r}")

        category_slug = clean_text(product_data.get("category")) or "uncategorized"
        category = categories.get(category_slug)

        if category is None:
            category, _ = Category.objects.update_or_create(
                slug=slugify(category_slug),
                defaults={
                    "name": category_slug.replace("-", " ").title(),
                    "description": (
                        f"Products imported from DummyJSON category '{category_slug}'."
                    ),
                    "is_active": True,
                },
            )
            categories[category_slug] = category

        product_slug = source_product_slug(product_data, title)
        description = build_description(product_data)

        product, created = Product.objects.update_or_create(
            slug=product_slug,
            defaults={
                "name": title,
                "category": category,
                "description": description,
                "price": parse_price(product_data.get("price")),
                "stock": parse_stock(product_data.get("stock")),
                "is_active": True,
            },
        )

        return product, created

    def seed_images(
        self,
        product: Product,
        product_data: dict[str, Any],
        *,
        timeout: float,
        max_images: int,
        refresh: bool,
    ) -> int:
        if product.images.exists() and not refresh:
            return 0

        if refresh:
            for image in product.images.exclude(image="").iterator():
                image.image.delete(save=False)
            product.images.all().delete()

        image_urls = collect_image_urls(product_data)[:max_images]
        downloaded = 0

        for index, image_url in enumerate(image_urls):
            try:
                content, filename = download_image(image_url, timeout)
            except CommandError as exc:
                self.stderr.write(
                    self.style.WARNING(f"Skipping image for {product.name}: {exc}")
                )
                continue

            image = ProductImage(
                product=product,
                alt_text=f"{product.name} image {index + 1}",
                is_primary=index == 0,
            )
            image.image.save(filename, ContentFile(content), save=True)
            downloaded += 1

        return downloaded


def normalize_base_url(base_url: str) -> str:
    return base_url.rstrip("/") + "/"


def build_url(base_url: str, path: str) -> str:
    return urljoin(base_url, path.lstrip("/"))


def fetch_json(url: str, timeout: float) -> Any:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "stack-commerce-seeder/1.0",
        },
    )

    try:
        with urlopen(request, timeout=timeout) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            return json.loads(response.read().decode(charset))
    except HTTPError as exc:
        raise CommandError(f"API request failed with HTTP {exc.code}: {url}") from exc
    except URLError as exc:
        raise CommandError(f"API request failed: {url} ({exc.reason})") from exc
    except TimeoutError as exc:
        raise CommandError(f"API request timed out: {url}") from exc
    except json.JSONDecodeError as exc:
        raise CommandError(f"API response was not valid JSON: {url}") from exc


def clean_text(value: Any) -> str:
    return str(value or "").strip()


def build_description(product_data: dict[str, Any]) -> str:
    parts = [clean_text(product_data.get("description"))]

    for label, key in [
        ("Brand", "brand"),
        ("SKU", "sku"),
        ("Warranty", "warrantyInformation"),
        ("Shipping", "shippingInformation"),
        ("Returns", "returnPolicy"),
    ]:
        value = clean_text(product_data.get(key))
        if value:
            parts.append(f"{label}: {value}.")

    return "\n\n".join(part for part in parts if part)


def source_product_slug(product_data: dict[str, Any], title: str) -> str:
    source_id = clean_text(product_data.get("id"))
    title_slug = slugify(title) or "product"

    if source_id:
        return f"dummyjson-{source_id}-{title_slug}"

    return title_slug


def parse_price(value: Any) -> Decimal:
    try:
        price = Decimal(str(value))
    except (InvalidOperation, TypeError) as exc:
        raise CommandError(f"Invalid product price: {value!r}") from exc

    if price < 0:
        raise CommandError(f"Invalid negative product price: {value!r}")

    return price.quantize(Decimal("0.01"))


def parse_stock(value: Any) -> int:
    try:
        stock = int(value)
    except (TypeError, ValueError) as exc:
        raise CommandError(f"Invalid product stock: {value!r}") from exc

    if stock < 0:
        return 0

    return stock


def collect_image_urls(product_data: dict[str, Any]) -> list[str]:
    image_urls: list[str] = []
    thumbnail = clean_text(product_data.get("thumbnail"))

    if thumbnail:
        image_urls.append(thumbnail)

    images = product_data.get("images")
    if isinstance(images, list):
        image_urls.extend(clean_text(image) for image in images)

    return list(dict.fromkeys(image_url for image_url in image_urls if image_url))


def download_image(url: str, timeout: float) -> tuple[bytes, str]:
    request = Request(url, headers={"User-Agent": "stack-commerce-seeder/1.0"})

    try:
        with urlopen(request, timeout=timeout) as response:
            content = response.read()
            content_type = response.headers.get_content_type()
    except HTTPError as exc:
        raise CommandError(f"image request failed with HTTP {exc.code}: {url}") from exc
    except URLError as exc:
        raise CommandError(f"image request failed: {url} ({exc.reason})") from exc
    except TimeoutError as exc:
        raise CommandError(f"image request timed out: {url}") from exc

    if not content:
        raise CommandError(f"image response was empty: {url}")

    return content, image_filename(url, content_type)


def image_filename(url: str, content_type: str) -> str:
    path = PurePosixPath(urlparse(url).path)
    stem = slugify(path.stem) or "product-image"
    extension = path.suffix.lower().lstrip(".")

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        guessed_extension = (mimetypes.guess_extension(content_type) or ".jpg").lstrip(
            "."
        )
        extension = guessed_extension if guessed_extension in ALLOWED_IMAGE_EXTENSIONS else "jpg"

    return f"{stem}.{extension}"
