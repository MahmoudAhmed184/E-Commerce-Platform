import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CheckoutService, type Order } from '../../../../core/services/checkout/checkout.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import type { UiOrderSummaryCharge, UiPriceLine } from '../../../../core/models/commerce-ui/commerce-ui.model';
import type { UiTone } from '../../../../shared/components/ui.types';
import { OrderSummaryCardComponent } from '../../../../shared/components/order-summary-card/order-summary-card.component';

interface ConfirmationBadge {
  id: string;
  tone: UiTone;
  label: string;
}

interface ConfirmationAddressLine {
  id: string;
  text: string;
}

interface ConfirmationOrder {
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
  paymentStatus: 'pending' | 'paid' | 'cod_pending' | 'failed';
  paymentStatusLabel: string;
  email: string;
  phone: string;
  address: readonly ConfirmationAddressLine[];
  lines: readonly UiPriceLine[];
  subtotal: number;
  charges: readonly UiOrderSummaryCharge[];
  total: number;
  badges: readonly ConfirmationBadge[];
  supportMessage: string;
}

type ConfirmationState =
  | { kind: 'loading' }
  | { kind: 'loaded'; order: ConfirmationOrder }
  | { kind: 'error'; message: string };

@Component({
  selector: 'app-order-confirmation',
  imports: [
    AlertBannerComponent,
    BadgeComponent,
    CurrencyPipe,
    ErrorStateComponent,
    OrderSummaryCardComponent,
    RouterLink,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-surface-page">
      <div class="mx-auto grid max-w-[var(--ui-container-xl)] gap-lg px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        @if (state().kind === 'loading') {
          <section class="grid gap-lg lg:grid-cols-[var(--ui-layout-checkout-grid)]" aria-label="Loading order confirmation">
            <app-skeleton-loader [rows]="4" label="Loading order summary" />
            <app-skeleton-loader shape="block" [count]="4" label="Loading order totals" />
          </section>
        } @else if (order(); as currentOrder) {
          <section class="grid gap-md rounded-md border-hairline border-border-default bg-surface-raised p-lg shadow-xs" aria-labelledby="confirmation-title">
            <div class="flex flex-wrap items-center gap-xs">
              @for (badge of currentOrder.badges; track badge.id) {
                <app-badge [tone]="badge.tone" [label]="badge.label" />
              }
            </div>
            <div class="grid gap-xs">
              <p class="type-label-sm text-text-muted">Order confirmation</p>
              <h1 id="confirmation-title" class="type-heading-xl text-text-primary">Order {{ currentOrder.orderNumber }}</h1>
              <p class="type-body-md text-text-secondary">{{ processingCopy() }}</p>
            </div>
            <app-alert-banner tone="info" title="Keep this order number" [message]="currentOrder.supportMessage" />
          </section>

          <section class="grid gap-lg lg:grid-cols-[var(--ui-layout-checkout-grid)] lg:items-start">
            <div class="grid gap-md">
              <section class="grid gap-md rounded-md border-hairline border-border-default bg-surface-raised p-md shadow-xs" aria-labelledby="items-title">
                <h2 id="items-title" class="type-heading-lg text-text-primary">Items</h2>
                <div class="grid gap-sm">
                  @for (line of currentOrder.lines; track line.id) {
                    <article class="flex justify-between gap-md border-b-hairline border-border-default pb-sm">
                      <div>
                        <h3 class="type-label-md text-text-primary">{{ line.label }}</h3>
                        <p class="type-body-sm text-text-muted">Quantity included in this line total</p>
                      </div>
                      <p class="type-label-md text-text-primary">{{ line.amount | currency: 'USD' }}</p>
                    </article>
                  }
                </div>
              </section>

              <section class="grid gap-md rounded-md border-hairline border-border-default bg-surface-raised p-md shadow-xs" aria-labelledby="delivery-title">
                <h2 id="delivery-title" class="type-heading-lg text-text-primary">Delivery</h2>
                <address class="grid gap-2xs not-italic type-body-md text-text-secondary">
                  @for (line of currentOrder.address; track line.id) {
                    <span>{{ line.text }}</span>
                  }
                </address>
                <dl class="grid gap-sm md:grid-cols-2">
                  <div>
                    <dt class="type-label-sm text-text-muted">Email</dt>
                    <dd class="type-body-md text-text-primary">{{ currentOrder.email }}</dd>
                  </div>
                  <div>
                    <dt class="type-label-sm text-text-muted">Phone</dt>
                    <dd class="type-body-md text-text-primary">{{ currentOrder.phone }}</dd>
                  </div>
                </dl>
              </section>
            </div>

            <div class="grid gap-md">
              <app-order-summary-card
                [lines]="currentOrder.lines"
                [subtotal]="currentOrder.subtotal"
                [charges]="currentOrder.charges"
                [total]="currentOrder.total"
                currency="USD"
                [paymentStatus]="currentOrder.paymentStatusLabel"
                [sticky]="true"
              />

              <a
                class="inline-flex min-h-touch-min items-center justify-center rounded-md bg-surface-primary px-lg py-sm type-label-lg text-text-on-primary interactive-transition hover:bg-surface-primary-hover focus-visible:focus-ring"
                routerLink="/products"
              >
                Continue shopping
              </a>
            </div>
          </section>
        } @else {
          <app-error-state
            statusCode="404"
            title="Order not found"
            [message]="errorMessage()"
            homeLink="/products"
          />
        }
      </div>
    </main>
  `,
})
export class OrderConfirmationPage implements OnInit {
  private readonly checkoutService = inject(CheckoutService);
  private readonly route = inject(ActivatedRoute);

  protected readonly state = signal<ConfirmationState>({ kind: 'loading' });
  protected readonly order = computed(() => {
    const state = this.state();
    return state.kind === 'loaded' ? state.order : null;
  });
  protected readonly errorMessage = computed(() => {
    const state = this.state();
    return state.kind === 'error' ? state.message : 'Use the order number from your confirmation email or return to products.';
  });
  protected readonly processingCopy = computed(() => {
    const order = this.order();
    if (!order) {
      return '';
    }
    if (order.paymentStatus === 'cod_pending') {
      return 'Your order is confirmed. Payment will be collected when the shipment arrives.';
    }
    if (order.paymentStatus === 'paid') {
      return 'Your payment is confirmed and your order is being prepared for delivery.';
    }
    if (order.paymentStatus === 'pending') {
      return 'Your order was created and payment confirmation is still pending.';
    }
    return 'Payment needs attention. Contact support with your order number.';
  });

  ngOnInit(): void {
    const orderNumber = this.route.snapshot.paramMap.get('orderNumber');
    if (!orderNumber) {
      this.state.set({ kind: 'error', message: 'Use the order number from your confirmation email or return to products.' });
      return;
    }

    this.state.set({ kind: 'loading' });
    const guestAccessToken = this.route.snapshot.queryParamMap.get('guest_access_token');
    this.checkoutService.getOrder(orderNumber, guestAccessToken).subscribe({
      next: (order) => this.state.set({ kind: 'loaded', order: mapConfirmationOrder(order) }),
      error: () => this.state.set({ kind: 'error', message: 'This order could not be loaded. Check the order number and try again.' }),
    });
  }
}

function mapConfirmationOrder(order: Order): ConfirmationOrder {
  return {
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentStatusLabel: label(order.payment_status),
    email: order.email,
    phone: order.phone,
    address: mapAddressLines(order),
    lines: order.items.map((item) => ({
      id: String(item.id),
      label: `${item.product_name} x ${item.quantity}`,
      amount: Number(item.line_total),
    })),
    subtotal: Number(order.subtotal),
    charges: [
      { label: 'Shipping', amount: Number(order.shipping_amount), tone: Number(order.shipping_amount) === 0 ? 'success' : 'neutral' },
      { label: 'Tax', amount: Number(order.tax_amount), tone: 'neutral' },
      { label: 'Discount', amount: Number(order.discount_amount) * -1, tone: Number(order.discount_amount) > 0 ? 'success' : 'neutral' },
    ],
    total: Number(order.total_amount),
    badges: [
      { id: 'order-status', tone: order.status === 'confirmed' ? 'success' : 'warning', label: `Order ${order.status}` },
      { id: 'payment-status', tone: order.payment_status === 'failed' ? 'error' : 'info', label: `Payment ${label(order.payment_status)}` },
    ],
    supportMessage: `Use ${order.order_number} for delivery updates, returns, or support requests.`,
  };
}

function label(value: string): string {
  return value.replace(/_/g, ' ');
}

function mapAddressLines(order: Order): readonly ConfirmationAddressLine[] {
  const address = order.shipping_address;
  const lines = [
    { id: 'line1', text: address.line1 },
    { id: 'region', text: [address.city, address.state, address.postal_code].filter(Boolean).join(', ') },
    { id: 'country', text: countryLabel(address.country) },
  ];

  return lines.filter((line) => line.text.trim().length > 0);
}

function countryLabel(countryCode: string): string {
  const countries: Record<string, string> = {
    US: 'United States',
    CA: 'Canada',
    GB: 'United Kingdom',
  };

  return countries[countryCode] ?? countryCode;
}
