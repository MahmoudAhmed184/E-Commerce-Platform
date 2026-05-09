# Payment and Checkout Handoff

Date: 2026-05-04
Owner scope: D4 payment/checkout, with D3 cart/order integration dependency completed.

## Implemented Flow

1. Customer adds items to cart.
2. Checkout submits `POST /api/v1/orders/checkout/` with contact, shipping address, payment method, and item list.
3. Backend creates an order with immutable order item snapshots.
4. Backend validates stock inside a transaction and decrements stock only after validation succeeds.
5. Payment is created using one of the supported methods:
   - `cod`: order is confirmed with `cod_pending` payment status.
   - `wallet`: authenticated user wallet is debited and ledger entry is written.
   - `card`: sandbox payment is created with a provider reference and pending status.
6. Authenticated checkout clears the backend cart after successful order creation.
7. Frontend clears cart state and navigates to `/orders/{order_number}`.
8. Sandbox card provider posts to `POST /api/v1/payments/webhooks/sandbox/`.
9. Webhook signature and event idempotency are verified before status changes are applied.

## Verification Commands

Run from `server/`:

```bash
uv run pytest
DJANGO_SETTINGS_MODULE=config.settings.testing uv run python manage.py check
uv run python manage.py check_auth_security
```

Run from `client/`:

```bash
npm run build
```

## Verified Regression Coverage

- COD checkout creates a confirmed order and `cod_pending` payment.
- Card checkout creates a sandbox pending payment.
- Signed sandbox webhook marks card payment/order as paid.
- Duplicate sandbox webhook event is idempotent.
- Invalid webhook signature is rejected.
- Wallet checkout rejects insufficient balance.
- Checkout rejects insufficient stock without decrementing stock.
- Authenticated checkout clears the server-side cart.
- Authenticated order details are not public.
- Guest order details remain retrievable by order number for the confirmation page.

## Release Notes

- `PAYMENT_WEBHOOK_SECRET` must be set per environment.
- The current card flow is a sandbox provider implementation. A production provider can replace the sandbox reference generation and webhook payload contract behind the same internal payment/order status model.
- Payment-support staff should use order number and provider reference together when investigating card payment webhook issues.
- Guest order confirmation uses order number only. Do not expose authenticated customer order numbers in public links.
