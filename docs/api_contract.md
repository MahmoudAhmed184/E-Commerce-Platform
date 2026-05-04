# API Contract

Version: 1.0
Date: 2026-05-04

This document records the shared backend/frontend contract for the implemented D1-D4 scope.

## Conventions

- Base URL: `/api/v1`
- Authentication: JWT bearer token for authenticated customer/admin endpoints.
- Money fields are decimal strings with two fractional digits.
- User roles and statuses use lowercase SRS values, for example `admin`, `customer`, `active`, and `pending_approval`.
- Paginated list responses use `{ count, next, previous, results }`.
- Validation errors return field-keyed JSON objects.

## Auth and Users

### Register

`POST /auth/register/`

Request:

```json
{
  "email": "buyer@example.com",
  "phone": "+201000000001",
  "password": "Password123",
  "full_name": "Buyer User"
}
```

Response `201`:

```json
{ "message": "Confirmation email sent." }
```

### Confirm Email

`POST /auth/confirm-email/`

Request:

```json
{ "token": "00000000-0000-0000-0000-000000000000" }
```

Response `200`:

```json
{ "message": "Email confirmed." }
```

### Login

`POST /auth/login/`

Request:

```json
{ "identifier": "buyer@example.com", "password": "Password123" }
```

Response `200`:

```json
{
  "access": "<jwt>",
  "refresh": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "buyer@example.com",
    "phone": "+201000000001",
    "full_name": "Buyer User",
    "role": "customer",
    "status": "active"
  }
}
```

### Current User

`GET /users/me/`

Response `200`:

```json
{
  "id": "uuid",
  "email": "buyer@example.com",
  "phone": "+201000000001",
  "full_name": "Buyer User",
  "role": "customer",
  "status": "active",
  "is_email_confirmed": true
}
```

## Catalog

### Product List

`GET /products/products/?search=phone&category__slug=electronics&min_price=100&max_price=900&ordering=price`

Response `200`:

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Phone",
      "slug": "phone",
      "price": "599.99",
      "stock": 10,
      "category": { "id": 1, "name": "Electronics", "slug": "electronics", "description": "", "product_count": 1 },
      "primary_image": null,
      "availability": "in_stock",
      "average_rating": 0,
      "review_count": 0
    }
  ]
}
```

### Product Detail

`GET /products/products/{slug}/`

Includes `description`, `images`, `availability`, `average_rating`, and `review_count`.

### Categories

`GET /products/categories/`

Returns a non-paginated active category list.

## Admin Catalog

Admin catalog endpoints require an admin JWT.

- `GET|POST /products/admin/products/`
- `GET|PUT|PATCH|DELETE /products/admin/products/{slug}/`
- `POST /products/admin/products/{slug}/update_stock/`
- `POST /products/admin/products/{slug}/deactivate/`
- `GET|POST /products/admin/categories/`
- `GET|PUT|PATCH|DELETE /products/admin/categories/{slug}/`
- `POST /products/admin/categories/{slug}/deactivate/`
- `GET|POST /products/admin/product-images/`

## Cart

Cart endpoints require an authenticated customer JWT.

### Get Cart

`GET /cart/`

Response `200`:

```json
{
  "id": 1,
  "items": [],
  "subtotal": "0.00",
  "total": "0.00"
}
```

### Add Item

`POST /cart/items/`

Request:

```json
{ "product": 1, "quantity": 2 }
```

Response `201` returns the updated cart.

### Update Item

`PATCH /cart/items/{item_id}/`

Request:

```json
{ "quantity": 3 }
```

Response `200` returns the updated cart.

### Remove Item

`DELETE /cart/items/{item_id}/`

Response `200` returns the updated cart.

## Orders and Checkout

### Checkout

`POST /orders/checkout/`

Supports guest checkout and authenticated checkout. Authenticated checkout clears the server-side cart after the order is created.

Request:

```json
{
  "email": "buyer@example.com",
  "phone": "+201000000001",
  "shipping_address": {
    "line1": "123 Test Street",
    "city": "Cairo",
    "state": "Cairo",
    "postal_code": "11511",
    "country": "Egypt"
  },
  "payment_method": "cod",
  "items": [{ "product": 1, "quantity": 2 }]
}
```

Response `201`:

```json
{
  "id": 1,
  "order_number": "ORD-ABC123",
  "status": "confirmed",
  "payment_status": "cod_pending",
  "subtotal": "50.00",
  "shipping_amount": "0.00",
  "tax_amount": "0.00",
  "discount_amount": "0.00",
  "total_amount": "50.00",
  "items": [
    { "id": 1, "product_name": "Product", "unit_price": "25.00", "quantity": 2, "line_total": "50.00" }
  ],
  "payment": {
    "method": "cod",
    "status": "cod_pending",
    "provider_reference": null,
    "failure_reason": ""
  },
  "created_at": "2026-05-04T00:00:00Z"
}
```

### Order Detail

`GET /orders/{order_number}/`

- Guest orders are retrievable by order number for confirmation.
- Authenticated orders are only retrievable by their owner or admin.

## Payments

### Sandbox Webhook

`POST /payments/webhooks/sandbox/`

Headers:

```text
X-Sandbox-Signature: <hmac-sha256-body-signature>
```

Request:

```json
{
  "event_id": "evt_paid_1",
  "provider_reference": "sandbox_reference",
  "status": "paid"
}
```

Response `200`:

```json
{
  "processed": true,
  "payment_status": "paid",
  "order_number": "ORD-ABC123"
}
```
