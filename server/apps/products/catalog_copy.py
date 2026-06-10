from __future__ import annotations

from typing import Any


METADATA_LABELS = ("Brand", "SKU", "Warranty", "Shipping", "Returns")
PROFESSIONAL_COPY_MARKER = "Current availability, checkout validation, and order support"

CATEGORY_DESCRIPTIONS: dict[str, str] = {
    "beauty": "Beauty essentials selected for daily routines, gifting, and personal care, with clear availability and dependable checkout support.",
    "fragrances": "Signature scents and everyday fragrances organized for easy comparison, confident selection, and careful delivery.",
    "furniture": "Furniture pieces for practical living spaces, with product details that help customers compare size, style, and value.",
    "groceries": "Pantry, household, and everyday grocery items selected for convenient ordering and reliable fulfillment.",
    "home-decoration": "Home decor accents that make it easier to refresh rooms with useful details, transparent pricing, and simple ordering.",
    "kitchen-accessories": "Kitchen tools and accessories selected for everyday cooking, storage, serving, and home organization.",
    "laptops": "Laptop options for work, study, and entertainment, presented with clear availability and straightforward product details.",
    "mens-shirts": "Men's shirts selected for everyday wear, seasonal updates, and simple size and style comparison.",
    "mens-shoes": "Men's footwear for daily use and smarter outfits, organized for quick browsing and confident checkout.",
    "mens-watches": "Men's watches selected for practical style, gifting, and reliable everyday use.",
    "mobile-accessories": "Mobile accessories for charging, protection, connectivity, and everyday device support.",
    "motorcycle": "Motorcycle products and accessories selected for utility, maintenance, and rider convenience.",
    "skin-care": "Skin care products organized for routine building, comparison, and confident replenishment.",
    "smartphones": "Smartphones selected for communication, entertainment, and productivity, with clear product information and stock visibility.",
    "sports-accessories": "Sports accessories for training, recreation, and active routines, with practical details for quick selection.",
    "sunglasses": "Sunglasses for daily wear, travel, and outdoor plans, selected for style, comfort, and easy comparison.",
    "tablets": "Tablets for browsing, work, study, and entertainment, with clear availability and practical purchase details.",
    "tops": "Tops for everyday outfits and seasonal wardrobe updates, organized for fast browsing and simple checkout.",
    "vehicle": "Vehicle products and accessories selected for maintenance, convenience, and practical everyday use.",
    "womens-bags": "Women's bags selected for daily carry, travel, and occasion wear, with clear product details and availability.",
    "womens-dresses": "Women's dresses for everyday plans, occasions, and seasonal style updates, organized for confident browsing.",
    "womens-jewellery": "Women's jewellery selected for gifting, daily styling, and special occasions, with clear product presentation.",
    "womens-shoes": "Women's shoes for everyday wear, work, and occasions, selected for quick comparison and confident ordering.",
    "womens-watches": "Women's watches selected for practical styling, gifting, and reliable everyday use.",
}


def professional_category_description(slug: str, name: str) -> str:
    normalized_slug = slug.strip().lower()
    if normalized_slug in CATEGORY_DESCRIPTIONS:
        return CATEGORY_DESCRIPTIONS[normalized_slug]

    display_name = name.strip() or normalized_slug.replace("-", " ").title() or "This department"
    return (
        f"{display_name} products selected for clear comparison, transparent pricing, "
        "current availability, and a straightforward checkout experience."
    )


def metadata_from_product_data(product_data: dict[str, Any]) -> dict[str, str]:
    return {
        "Brand": clean_text(product_data.get("brand")),
        "SKU": clean_text(product_data.get("sku")),
        "Warranty": clean_text(product_data.get("warrantyInformation")),
        "Shipping": clean_text(product_data.get("shippingInformation")),
        "Returns": clean_text(product_data.get("returnPolicy")),
    }


def professional_product_description(
    *,
    name: str,
    category_name: str,
    source_description: str = "",
    metadata: dict[str, str] | None = None,
) -> str:
    display_name = name.strip() or "This product"
    display_category = category_name.strip().lower() or "the catalog"
    cleaned_source = source_description.strip().rstrip(".")

    sentences = [
        (
            f"{display_name} is a practical choice in {display_category}, selected for clear value, "
            "everyday use, and a straightforward shopping experience."
        )
    ]

    if cleaned_source:
        sentences.append(ensure_sentence(cleaned_source))

    sentences.append(
        "Current availability, checkout validation, and order support help make the purchase process simple from cart to delivery."
    )

    details = detail_sentence(metadata or {})
    if details:
        sentences.append(details)

    return " ".join(sentences)


def professional_product_description_from_existing(
    *,
    name: str,
    category_name: str,
    description: str,
) -> str:
    if PROFESSIONAL_COPY_MARKER in description:
        return description

    source_description, metadata = split_existing_description(description)
    return professional_product_description(
        name=name,
        category_name=category_name,
        source_description=source_description,
        metadata=metadata,
    )


def clean_text(value: Any) -> str:
    return str(value or "").strip()


def ensure_sentence(value: str) -> str:
    cleaned = " ".join(value.split()).strip()
    if not cleaned:
        return ""
    if cleaned.endswith((".", "!", "?")):
        return cleaned
    return f"{cleaned}."


def split_existing_description(description: str) -> tuple[str, dict[str, str]]:
    metadata: dict[str, str] = {}
    narrative_parts: list[str] = []

    for raw_part in description.splitlines():
        part = raw_part.strip()
        if not part:
            continue

        label, _, value = part.partition(":")
        normalized_label = label.strip()
        if normalized_label in METADATA_LABELS and value.strip():
            metadata[normalized_label] = value.strip().rstrip(".")
            continue

        narrative_parts.append(part)

    return " ".join(narrative_parts), metadata


def detail_sentence(metadata: dict[str, str]) -> str:
    parts = [
        f"{label}: {metadata[label].strip().rstrip('.')}"
        for label in METADATA_LABELS
        if metadata.get(label, "").strip()
    ]
    if not parts:
        return ""

    return f"Product details include {', '.join(parts)}."
