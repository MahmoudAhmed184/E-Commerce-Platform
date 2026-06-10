import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  type FormControl,
  type FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  type ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideCircleAlert,
  LucideClock3,
  LucideInbox,
  LucideLogIn,
  LucidePackageCheck,
  LucideReceiptText,
  LucideSearch,
  LucideShoppingBag,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { CheckoutService, type Order } from '../../../../core/services/checkout/checkout.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import type { UiTone } from '../../../../shared/components/ui.types';

type OrderLookupForm = FormGroup<{
  orderNumber: FormControl<string>;
}>;

interface OrderBadgeView {
  readonly id: string;
  readonly tone: UiTone;
  readonly label: string;
}

interface OrderItemPreview {
  readonly id: number;
  readonly label: string;
  readonly amount: number;
}

interface OrderRowView {
  readonly id: number;
  readonly orderNumber: string;
  readonly createdLabel: string;
  readonly totalAmount: number;
  readonly itemCountLabel: string;
  readonly email: string;
  readonly paymentMethodLabel: string;
  readonly badges: readonly OrderBadgeView[];
  readonly items: readonly OrderItemPreview[];
  readonly remainingItemsLabel: string | null;
}

const visibleItemLimit = 3;
const requiredValidator: ValidatorFn = (control) => Validators.required(control);
const orderNumberPatternValidator = Validators.pattern(/^ORD-[A-Z0-9]{12}$/i);
const orderDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

@Component({
  selector: 'app-orders-page',
  imports: [
    AlertBannerComponent,
    BadgeComponent,
    ButtonComponent,
    CurrencyPipe,
    LucideArrowRight,
    LucideCircleAlert,
    LucideClock3,
    LucideInbox,
    LucideLogIn,
    LucidePackageCheck,
    LucideReceiptText,
    LucideSearch,
    LucideShoppingBag,
    ReactiveFormsModule,
    RouterLink,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-[var(--ui-layout-min-screen-minus-header)] bg-surface-page">
      <div
        class="mx-auto grid max-w-[var(--ui-container-xl)] gap-lg px-gutter-xs py-lg md:px-gutter-sm md:py-xl lg:px-gutter-lg"
      >
        <header
          class="surface-panel surface-depth-raised grid gap-md rounded-md p-md md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-lg"
        >
          <div class="grid max-w-[70ch] gap-sm">
            <div class="flex items-start gap-sm">
              <span
                class="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-primary-subtle text-text-info"
                aria-hidden="true"
              >
                <svg lucidePackageCheck class="size-icon-md"></svg>
              </span>
              <div class="grid gap-2xs">
                <p class="type-label-sm text-text-muted">Orders</p>
                <h1 class="type-heading-xl text-text-primary [text-wrap:balance]">Track orders</h1>
              </div>
            </div>
            <p class="type-body-md text-text-secondary">
              Use a secure checkout confirmation link for guest orders, or sign in to review
              account order history.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-sm md:justify-end">
            @if (authService.isLoggedIn()) {
              <app-badge tone="success" label="Account connected" />
            } @else {
              <app-badge tone="neutral" label="Secure link required" />
            }
            <a
              class="inline-flex min-h-touch-min items-center gap-xs rounded-md border-hairline border-border-default bg-surface-raised px-md py-xs type-label-md text-text-primary interactive-transition hover:bg-surface-subtle focus-visible:focus-ring"
              routerLink="/products"
            >
              <svg lucideShoppingBag class="size-icon-sm" aria-hidden="true"></svg>
              Browse products
            </a>
          </div>
        </header>

        <section
          class="grid gap-lg lg:grid-cols-[minmax(19rem,23rem)_minmax(0,1fr)] lg:items-start"
        >
          <aside class="grid gap-md lg:sticky lg:top-xl">
            <form
              class="surface-panel surface-depth-raised grid gap-md rounded-md p-md"
              [formGroup]="lookupForm"
              (ngSubmit)="trackOrder()"
              aria-labelledby="track-order-title"
              novalidate
            >
              <div class="flex items-start gap-sm">
                <span
                  class="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-icon-default"
                  aria-hidden="true"
                >
                  <svg lucideSearch class="size-icon-sm"></svg>
                </span>
                <div class="grid gap-2xs">
                  <p class="type-label-sm text-text-muted">Lookup</p>
                  <h2 id="track-order-title" class="type-heading-md text-text-primary">
                    Find an order
                  </h2>
                </div>
              </div>

              <label class="grid gap-xs type-label-md text-text-primary" [for]="orderNumberInputId">
                Order number
                <input
                  class="min-h-touch-min w-full rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs type-body-sm uppercase text-text-primary shadow-xs interactive-transition placeholder:normal-case placeholder:text-text-muted focus-visible:border-border-focus focus-visible:focus-ring disabled:state-disabled aria-invalid:border-border-error"
                  [id]="orderNumberInputId"
                  name="orderNumber"
                  type="text"
                  formControlName="orderNumber"
                  autocomplete="off"
                  inputmode="text"
                  spellcheck="false"
                  placeholder="ORD-000000000000"
                  [attr.aria-invalid]="showLookupError() ? 'true' : null"
                  [attr.aria-describedby]="
                    showLookupError() ? orderNumberErrorId : orderNumberHelperId
                  "
                />
                @if (showLookupError()) {
                  <span class="type-body-sm text-text-error" [id]="orderNumberErrorId">{{
                    lookupErrorMessage()
                  }}</span>
                } @else {
                  <span class="type-body-sm text-text-muted" [id]="orderNumberHelperId"
                    >Signed-in customers can find this in the checkout confirmation. Guest orders
                    require the secure checkout link.</span
                  >
                }
              </label>

              <app-button type="submit" [fullWidth]="true">Track order</app-button>

              @if (!authService.isLoggedIn()) {
                <app-button variant="secondary" [routerLink]="['/auth/login']" [fullWidth]="true">
                  Sign in
                </app-button>
              }
            </form>

            <section
              class="surface-panel surface-depth-flat grid gap-sm rounded-md p-md"
              aria-labelledby="lookup-note-title"
            >
              <div class="flex items-center gap-xs text-text-primary">
                <svg lucideReceiptText class="size-icon-sm"></svg>
                <h2 id="lookup-note-title" class="type-heading-sm">Order number format</h2>
              </div>
              <p class="type-body-sm text-text-secondary">
                Vendra order numbers start with
                <span class="type-code-sm text-text-primary">ORD-</span> followed by 12 letters or
                numbers.
              </p>
            </section>
          </aside>

          <section
            class="surface-panel surface-depth-raised min-w-0 overflow-hidden rounded-md"
            aria-labelledby="order-history-title"
          >
            <header
              class="flex flex-wrap items-center justify-between gap-md border-b-hairline border-border-default p-md md:p-lg"
            >
              <div class="flex min-w-0 items-start gap-sm">
                <span
                  class="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-icon-default"
                  aria-hidden="true"
                >
                  <svg lucideClock3 class="size-icon-sm"></svg>
                </span>
                <div class="grid gap-2xs">
                  <p class="type-label-sm text-text-muted">History</p>
                  <h2 id="order-history-title" class="type-heading-md text-text-primary">
                    Recent orders
                  </h2>
                </div>
              </div>
              @if (authService.isLoggedIn()) {
                <app-badge tone="info" [label]="orderCountLabel()" />
              }
            </header>

            @if (!authService.isLoggedIn()) {
              <section class="grid gap-md p-md md:grid-cols-[1fr_auto] md:items-center md:p-lg">
                <div class="flex min-w-0 items-start gap-sm">
                  <span
                    class="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-primary-subtle text-text-info"
                    aria-hidden="true"
                  >
                    <svg lucideLogIn class="size-icon-md"></svg>
                  </span>
                  <div class="grid gap-xs">
                    <h3 class="type-heading-md text-text-primary">Sign in for order history</h3>
                    <p class="max-w-[64ch] type-body-md text-text-secondary">
                      Account orders appear here after login. Guest orders open from the secure
                      checkout confirmation link created after purchase.
                    </p>
                  </div>
                </div>
                <app-button [routerLink]="['/auth/login']">Sign in</app-button>
              </section>
            } @else if (isLoading()) {
              <section
                class="grid divide-y-hairline divide-border-default"
                aria-label="Loading orders"
              >
                @for (row of loadingRows; track row.id) {
                  <article class="grid gap-md p-md md:p-lg">
                    <div class="grid gap-sm md:grid-cols-[minmax(0,1fr)_12rem] md:items-start">
                      <app-skeleton-loader [rows]="2" label="Loading order heading" />
                      <app-skeleton-loader shape="block" [count]="1" label="Loading order status" />
                    </div>
                    <app-skeleton-loader shape="block" [count]="2" label="Loading order details" />
                  </article>
                }
              </section>
            } @else if (errorMessage()) {
              <section class="grid gap-md p-md md:p-lg">
                <app-alert-banner
                  tone="error"
                  title="Orders could not sync"
                  [message]="errorMessage()"
                  [action]="{ label: 'Retry', variant: 'secondary' }"
                  (actionPressed)="loadOrders()"
                />
                <div class="flex items-start gap-sm rounded-md bg-surface-subtle p-md">
                  <svg
                    lucideCircleAlert
                    class="mt-2xs size-icon-sm shrink-0 text-text-error"
                    aria-hidden="true"
                  ></svg>
                  <p class="type-body-sm text-text-secondary">
                    Order-number lookup for account orders is still available while history is
                    unavailable.
                  </p>
                </div>
              </section>
            } @else if (orderRows().length === 0) {
              <section class="grid justify-items-center gap-md px-md py-xl text-center md:px-lg">
                <span
                  class="inline-flex size-12 items-center justify-center rounded-md bg-surface-subtle text-icon-muted"
                  aria-hidden="true"
                >
                  <svg lucideInbox class="size-icon-md"></svg>
                </span>
                <div class="grid max-w-[48ch] gap-xs">
                  <h3 class="type-heading-md text-text-primary">No account orders yet</h3>
                  <p class="type-body-md text-text-secondary">
                    Orders placed while signed in will appear here with payment and delivery status.
                  </p>
                </div>
                <app-button [routerLink]="['/products']">Browse products</app-button>
              </section>
            } @else {
              <div
                class="divide-y-hairline divide-border-default"
                role="list"
                aria-label="Recent order list"
              >
                @for (order of orderRows(); track order.id) {
                  <article
                    class="grid gap-md p-md interactive-transition hover:bg-surface-subtle/30 md:p-lg"
                    role="listitem"
                    [attr.aria-labelledby]="'order-title-' + order.id"
                  >
                    <header class="grid gap-md md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                      <div class="flex min-w-0 items-start gap-sm">
                        <span
                          class="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-primary-subtle text-text-info"
                          aria-hidden="true"
                        >
                          <svg lucidePackageCheck class="size-icon-sm"></svg>
                        </span>
                        <div class="min-w-0">
                          <p class="type-label-sm text-text-muted">{{ order.createdLabel }}</p>
                          <h3
                            class="wrap-anywhere type-heading-md text-text-primary [text-wrap:balance]"
                            [id]="'order-title-' + order.id"
                          >
                            Order <span translate="no">{{ order.orderNumber }}</span>
                          </h3>
                          <p class="min-w-0 wrap-anywhere type-body-sm text-text-muted">
                            {{ order.email }}
                          </p>
                        </div>
                      </div>
                      <div class="flex flex-wrap gap-xs md:justify-end">
                        @for (badge of order.badges; track badge.id) {
                          <app-badge [tone]="badge.tone" [label]="badge.label" />
                        }
                      </div>
                    </header>

                    <dl
                      class="grid overflow-hidden rounded-md border-hairline border-border-default bg-surface-subtle/40 sm:grid-cols-3"
                    >
                      <div class="min-w-0 p-sm sm:border-e-hairline sm:border-border-default">
                        <dt class="type-label-sm text-text-muted">Total</dt>
                        <dd class="tabular-nums type-label-lg text-text-primary">
                          {{ order.totalAmount | currency: 'USD' }}
                        </dd>
                      </div>
                      <div
                        class="min-w-0 border-t-hairline border-border-default p-sm sm:border-e-hairline sm:border-t-0"
                      >
                        <dt class="type-label-sm text-text-muted">Items</dt>
                        <dd class="type-label-lg text-text-primary">{{ order.itemCountLabel }}</dd>
                      </div>
                      <div
                        class="min-w-0 border-t-hairline border-border-default p-sm sm:border-t-0"
                      >
                        <dt class="type-label-sm text-text-muted">Payment method</dt>
                        <dd class="type-label-lg text-text-primary">
                          {{ order.paymentMethodLabel }}
                        </dd>
                      </div>
                    </dl>

                    <div
                      class="divide-y-hairline divide-border-default overflow-hidden rounded-md border-hairline border-border-default bg-surface-subtle/40"
                      role="list"
                      aria-label="Order item preview"
                    >
                      @for (item of order.items; track item.id) {
                        <div
                          class="grid grid-cols-[minmax(0,1fr)_auto] gap-md px-sm py-xs"
                          role="listitem"
                        >
                          <span class="min-w-0 wrap-anywhere type-body-sm text-text-secondary">{{
                            item.label
                          }}</span>
                          <span class="shrink-0 tabular-nums type-body-sm text-text-primary">{{
                            item.amount | currency: 'USD'
                          }}</span>
                        </div>
                      }
                      @if (order.remainingItemsLabel) {
                        <p class="px-sm py-xs type-body-sm text-text-muted">
                          {{ order.remainingItemsLabel }}
                        </p>
                      }
                    </div>

                    <div class="flex justify-end">
                      <a
                        class="inline-flex min-h-touch-min items-center gap-xs rounded-md border-hairline border-border-default bg-surface-raised px-md py-xs type-label-md text-text-primary interactive-transition hover:bg-surface-subtle focus-visible:focus-ring"
                        [routerLink]="['/orders', order.orderNumber]"
                        [attr.aria-label]="'View details for order ' + order.orderNumber"
                      >
                        View details
                        <svg lucideArrowRight class="size-icon-sm" aria-hidden="true"></svg>
                      </a>
                    </div>
                  </article>
                }
              </div>
            }
          </section>
        </section>
      </div>
    </main>
  `,
})
export class OrdersPage implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);

  protected readonly orderNumberInputId = 'order-number-lookup';
  protected readonly orderNumberErrorId = 'order-number-lookup-error';
  protected readonly orderNumberHelperId = 'order-number-lookup-helper';
  protected readonly loadingRows = [
    { id: 'orders-loading-1' },
    { id: 'orders-loading-2' },
    { id: 'orders-loading-3' },
  ] as const;
  protected readonly lookupForm: OrderLookupForm = this.fb.group({
    orderNumber: ['', [requiredValidator, orderNumberPatternValidator]],
  });
  protected readonly orders = signal<readonly Order[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly orderRows = computed<readonly OrderRowView[]>(() =>
    this.orders().map(mapOrderRow),
  );
  protected readonly orderCountLabel = computed(
    () => `${this.orderRows().length} ${this.orderRows().length === 1 ? 'order' : 'orders'}`,
  );
  protected showLookupError(): boolean {
    const control = this.lookupForm.controls.orderNumber;
    return control.touched && control.invalid;
  }

  protected lookupErrorMessage(): string {
    const control = this.lookupForm.controls.orderNumber;
    if (control.hasError('required')) {
      return 'Order number is required.';
    }
    return 'Enter an order number like ORD-000000000000.';
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  protected trackOrder(): void {
    if (this.lookupForm.invalid) {
      this.lookupForm.markAllAsTouched();
      return;
    }

    const orderNumber = this.lookupForm.controls.orderNumber.getRawValue().trim().toUpperCase();
    void this.router.navigate(['/orders', orderNumber]);
  }

  protected loadOrders(): void {
    if (!this.authService.isLoggedIn()) {
      this.orders.set([]);
      return;
    }

    this.errorMessage.set('');
    this.isLoading.set(true);
    this.checkoutService
      .getOrders()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (orders) => this.orders.set(orders),
        error: () => this.errorMessage.set('We could not load your orders. Try again.'),
      });
  }
}

function mapOrderRow(order: Order): OrderRowView {
  const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);
  const visibleItems = order.items.slice(0, visibleItemLimit).map((item) => ({
    id: item.id,
    label: `${item.product_name} x ${item.quantity}`,
    amount: Number(item.line_total),
  }));
  const remainingItems = Math.max(order.items.length - visibleItemLimit, 0);

  return {
    id: order.id,
    orderNumber: order.order_number,
    createdLabel: formatDate(order.created_at),
    totalAmount: Number(order.total_amount),
    itemCountLabel: `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`,
    email: order.email,
    paymentMethodLabel: formatPaymentMethod(order.payment?.method ?? 'unknown'),
    badges: [
      {
        id: `${order.id}-status`,
        tone: orderStatusTone(order.status),
        label: `Order ${formatStatusLabel(order.status)}`,
      },
      {
        id: `${order.id}-payment`,
        tone: paymentStatusTone(order.payment_status),
        label: `Payment ${formatPaymentStatus(order.payment_status)}`,
      },
    ],
    items: visibleItems,
    remainingItemsLabel:
      remainingItems > 0
        ? `${remainingItems} more ${remainingItems === 1 ? 'item' : 'items'}`
        : null,
  };
}

function orderStatusTone(status: Order['status']): UiTone {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'cancelled':
    case 'failed':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return assertNever(status);
  }
}

function paymentStatusTone(status: Order['payment_status']): UiTone {
  switch (status) {
    case 'paid':
      return 'success';
    case 'failed':
      return 'error';
    case 'cod_pending':
      return 'info';
    case 'pending':
      return 'warning';
    default:
      return assertNever(status);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled order state: ${String(value)}`);
}

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

function formatStatusLabel(value: Order['status']): string {
  return titleCase(formatLabel(value));
}

function formatPaymentStatus(value: Order['payment_status']): string {
  if (value === 'cod_pending') {
    return 'COD pending';
  }
  return titleCase(formatLabel(value));
}

function formatPaymentMethod(value: string): string {
  switch (value) {
    case 'card':
      return 'Card';
    case 'cod':
      return 'Cash on delivery';
    case 'wallet':
      return 'Wallet';
    default:
      return titleCase(formatLabel(value));
  }
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }
  return orderDateFormatter.format(date);
}
