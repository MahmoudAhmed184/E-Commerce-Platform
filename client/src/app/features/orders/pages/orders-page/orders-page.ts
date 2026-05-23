import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule, type ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { CheckoutService, type Order } from '../../../../core/services/checkout/checkout.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
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

@Component({
  selector: 'app-orders-page',
  imports: [
    AlertBannerComponent,
    BadgeComponent,
    ButtonComponent,
    CurrencyPipe,
    EmptyStateComponent,
    ReactiveFormsModule,
    RouterLink,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-surface-page">
      <div class="mx-auto grid max-w-[var(--ui-container-xl)] gap-lg px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        <header class="flex flex-wrap items-end justify-between gap-md">
          <div class="grid gap-xs">
            <p class="type-label-sm text-text-muted">Orders</p>
            <h1 class="type-heading-xl text-text-primary">Track your orders</h1>
            <p class="type-body-md text-text-secondary">Look up a guest order or review the purchases connected to your account.</p>
          </div>

          @if (authService.isLoggedIn()) {
            <app-badge tone="success" label="Account orders" />
          } @else {
            <app-badge tone="neutral" label="Guest lookup" />
          }
        </header>

        @if (errorMessage()) {
          <app-alert-banner tone="error" title="Orders issue" [message]="errorMessage()" [dismissible]="true" (dismissed)="errorMessage.set('')" />
        }

        <section class="grid gap-lg lg:grid-cols-[minmax(var(--ui-container-aside-md),var(--ui-container-aside-xl))_minmax(0,1fr)] lg:items-start">
          <form class="grid gap-md rounded-md border-hairline border-border-default bg-surface-raised p-md shadow-xs" [formGroup]="lookupForm" (ngSubmit)="trackOrder()" aria-labelledby="track-order-title" novalidate>
            <div class="grid gap-xs">
              <p class="type-label-sm text-text-muted">Lookup</p>
              <h2 id="track-order-title" class="type-heading-lg text-text-primary">Find an order</h2>
            </div>

            <label class="grid gap-xs type-label-md text-text-primary" [for]="orderNumberInputId">
              Order number
              <input
                class="min-h-control-md rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs uppercase text-text-primary placeholder:normal-case placeholder:text-text-muted focus-visible:focus-ring aria-invalid:border-border-error"
                [id]="orderNumberInputId"
                type="text"
                formControlName="orderNumber"
                autocomplete="off"
                inputmode="text"
                placeholder="ORD-000000000000"
                [attr.aria-invalid]="showLookupError() ? 'true' : null"
                [attr.aria-describedby]="showLookupError() ? orderNumberErrorId : null"
              />
              @if (showLookupError()) {
                <span class="type-body-sm text-text-error" [id]="orderNumberErrorId">{{ lookupErrorMessage() }}</span>
              }
            </label>

            <div class="flex flex-wrap gap-sm">
              <app-button type="submit">Track order</app-button>
              @if (!authService.isLoggedIn()) {
                <a class="inline-flex min-h-control-md items-center justify-center rounded-md border-hairline border-border-default bg-surface-raised px-md py-xs type-label-md text-text-primary interactive-transition hover:bg-surface-subtle focus-visible:focus-ring" routerLink="/auth/login">
                  Sign in
                </a>
              }
            </div>
          </form>

          <section class="grid min-w-0 gap-md" aria-labelledby="order-history-title">
            <div class="flex flex-wrap items-end justify-between gap-md">
              <div class="grid gap-xs">
                <p class="type-label-sm text-text-muted">History</p>
                <h2 id="order-history-title" class="type-heading-lg text-text-primary">Recent orders</h2>
              </div>
              @if (authService.isLoggedIn()) {
                <app-badge tone="info" [label]="orderCountLabel()" />
              }
            </div>

            @if (!authService.isLoggedIn()) {
              <app-empty-state
                type="orders"
                title="Sign in for order history"
                message="Sign in to see account orders, or use an order number for guest checkout purchases."
                [action]="{ label: 'Sign in', variant: 'primary' }"
                (actionPressed)="signIn()"
              />
            } @else if (isLoading()) {
              <section class="grid gap-md" aria-label="Loading orders">
                @for (row of loadingRows; track row.id) {
                  <app-skeleton-loader shape="block" [count]="3" label="Loading order" />
                }
              </section>
            } @else if (orderRows().length === 0) {
              <app-empty-state
                type="orders"
                title="No orders yet"
                message="Orders placed at checkout will appear here."
                [action]="{ label: 'Browse products', variant: 'primary' }"
                (actionPressed)="browseProducts()"
              />
            } @else {
              <div class="grid gap-md" role="list" aria-label="Recent order list">
                @for (order of orderRows(); track order.id) {
                  <article class="grid gap-md rounded-md border-hairline border-border-default bg-surface-raised p-md shadow-xs" role="listitem" [attr.aria-labelledby]="'order-title-' + order.id">
                    <header class="flex flex-wrap items-start justify-between gap-md">
                      <div class="min-w-0">
                        <p class="type-label-sm text-text-muted">{{ order.createdLabel }}</p>
                        <h3 class="wrap-anywhere type-heading-md text-text-primary" [id]="'order-title-' + order.id">Order {{ order.orderNumber }}</h3>
                      </div>
                      <div class="flex flex-wrap gap-xs">
                        @for (badge of order.badges; track badge.id) {
                          <app-badge [tone]="badge.tone" [label]="badge.label" />
                        }
                      </div>
                    </header>

                    <dl class="grid gap-sm md:grid-cols-3">
                      <div class="min-w-0 rounded-md border-hairline border-border-default bg-surface-subtle p-sm">
                        <dt class="type-label-sm text-text-muted">Total</dt>
                        <dd class="tabular-nums type-body-md text-text-primary">{{ order.totalAmount | currency: 'USD' }}</dd>
                      </div>
                      <div class="min-w-0 rounded-md border-hairline border-border-default bg-surface-subtle p-sm">
                        <dt class="type-label-sm text-text-muted">Items</dt>
                        <dd class="type-body-md text-text-primary">{{ order.itemCountLabel }}</dd>
                      </div>
                      <div class="min-w-0 rounded-md border-hairline border-border-default bg-surface-subtle p-sm">
                        <dt class="type-label-sm text-text-muted">Payment method</dt>
                        <dd class="type-body-md text-text-primary">{{ order.paymentMethodLabel }}</dd>
                      </div>
                    </dl>

                    <div class="grid gap-xs" role="list" aria-label="Order item preview">
                      @for (item of order.items; track item.id) {
                        <div class="flex justify-between gap-md border-b-hairline border-border-default pb-xs" role="listitem">
                          <span class="min-w-0 wrap-anywhere type-body-sm text-text-secondary">{{ item.label }}</span>
                          <span class="shrink-0 tabular-nums type-body-sm text-text-primary">{{ item.amount | currency: 'USD' }}</span>
                        </div>
                      }
                      @if (order.remainingItemsLabel) {
                        <p class="type-body-sm text-text-muted">{{ order.remainingItemsLabel }}</p>
                      }
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-sm">
                      <p class="min-w-0 wrap-anywhere type-body-sm text-text-muted">{{ order.email }}</p>
                      <a class="inline-flex min-h-control-md items-center justify-center rounded-md border-hairline border-border-default bg-surface-raised px-md py-xs type-label-md text-text-primary interactive-transition hover:bg-surface-subtle focus-visible:focus-ring" [routerLink]="['/orders', order.orderNumber]">
                        View details
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
  protected readonly loadingRows = [{ id: 'orders-loading-1' }, { id: 'orders-loading-2' }, { id: 'orders-loading-3' }] as const;
  protected readonly lookupForm: OrderLookupForm = this.fb.group({
    orderNumber: ['', [requiredValidator, orderNumberPatternValidator]],
  });
  protected readonly orders = signal<readonly Order[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly orderRows = computed<readonly OrderRowView[]>(() => this.orders().map(mapOrderRow));
  protected readonly orderCountLabel = computed(() => `${this.orderRows().length} ${this.orderRows().length === 1 ? 'order' : 'orders'}`);
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

  protected signIn(): void {
    void this.router.navigateByUrl('/auth/login');
  }

  protected browseProducts(): void {
    void this.router.navigateByUrl('/products');
  }

  private loadOrders(): void {
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
    paymentMethodLabel: formatLabel(order.payment?.method ?? 'unknown'),
    badges: [
      { id: `${order.id}-status`, tone: orderStatusTone(order.status), label: `Order ${formatLabel(order.status)}` },
      { id: `${order.id}-payment`, tone: paymentStatusTone(order.payment_status), label: `Payment ${formatLabel(order.payment_status)}` },
    ],
    items: visibleItems,
    remainingItemsLabel: remainingItems > 0 ? `${remainingItems} more ${remainingItems === 1 ? 'item' : 'items'}` : null,
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

function formatDate(value: string): string {
  return value.slice(0, 10);
}
