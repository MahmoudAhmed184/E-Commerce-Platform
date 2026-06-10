import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideCheckCheck, LucideCircleX, LucideCreditCard, LucideEye, LucideReceiptText, LucideRefreshCw, LucideTriangleAlert } from '@lucide/angular';
import { finalize, forkJoin } from 'rxjs';

import { AlertDialogComponent } from '../../../../shared/components/alert-dialog/alert-dialog.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { SheetComponent } from '../../../../shared/components/sheet/sheet.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TooltipComponent } from '../../../../shared/components/tooltip/tooltip.component';
import type { UiAction, UiTableColumn } from '../../../../shared/components/ui.types';
import { AdminService, type AdminOrder, type AdminPayment } from '../../../../core/services/admin/admin.service';

interface AdminOrderRowView {
  readonly id: number;
  readonly idString: string;
  readonly orderNumber: string;
  readonly customerEmail: string;
  readonly totalAmountLabel: string;
  readonly statusLabel: string;
  readonly statusTone: 'success' | 'warning' | 'error' | 'info';
  readonly paymentStatusLabel: string;
  readonly paymentStatusTone: 'success' | 'warning' | 'error' | 'info';
  readonly paymentMethodLabel: string;
  readonly createdLabel: string;
}

interface AdminPaymentRowView {
  readonly id: number;
  readonly idString: string;
  readonly orderNumber: string;
  readonly customerEmail: string;
  readonly amountLabel: string;
  readonly methodLabel: string;
  readonly statusLabel: string;
  readonly statusTone: 'success' | 'warning' | 'error' | 'info';
}

interface AdminOrderDetailView {
  readonly orderNumber: string;
  readonly customerEmail: string;
  readonly totalAmount: string;
  readonly statusLabel: string;
  readonly paymentStatusLabel: string;
  readonly paymentMethodLabel: string;
  readonly createdLabel: string;
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    AlertDialogComponent,
    AlertBannerComponent,
    BadgeComponent,
    ButtonComponent,
    LucideCheckCheck,
    LucideCircleX,
    LucideCreditCard,
    LucideEye,
    LucideReceiptText,
    LucideRefreshCw,
    LucideTriangleAlert,
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    SearchBarComponent,
    SheetComponent,
    SkeletonLoaderComponent,
    TooltipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="admin-page">
      <header class="admin-page-header">
        <div class="admin-page-heading">
          <p class="admin-kicker">Commerce operations</p>
          <h2 class="admin-title">{{ pageKind === 'payments' ? 'Payments' : 'Orders' }}</h2>
          <p class="admin-description">Review order status, payment method, fulfillment readiness, and cash-on-delivery records.</p>
        </div>
        <app-search-bar
          scope="Order"
          placeholder="Search orders or customers"
          [query]="query()"
          [resultCount]="recordCount()"
          [suggestions]="[]"
          [loading]="isLoading()"
          (queryChange)="query.set($event)"
          (cleared)="query.set('')"
        />
      </header>

      <nav class="admin-tabs" aria-label="Order workspace tabs">
        <a
          class="admin-tab-link focus-visible:focus-ring"
          routerLink="/admin/orders"
          routerLinkActive="admin-tab-link-active"
          ariaCurrentWhenActive="page"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          Orders
        </a>
        <a
          class="admin-tab-link focus-visible:focus-ring"
          routerLink="/admin/payments"
          routerLinkActive="admin-tab-link-active"
          ariaCurrentWhenActive="page"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          Payments
        </a>
      </nav>

      <dl class="admin-stat-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Orders loaded</dt>
            <span class="admin-stat-icon" data-tone="info" aria-hidden="true">
              <svg lucideReceiptText class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ recordsUnavailable() ? '-' : filteredOrderRows().length }}</dd>
          <dd class="type-body-sm text-text-secondary">Matching current search</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Open orders</dt>
            <span class="admin-stat-icon" data-tone="warning" aria-hidden="true">
              <svg lucideRefreshCw class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ recordsUnavailable() ? '-' : openOrderCount() }}</dd>
          <dd class="type-body-sm text-text-secondary">Need fulfillment movement</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Payments</dt>
            <span class="admin-stat-icon" data-tone="success" aria-hidden="true">
              <svg lucideCreditCard class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ recordsUnavailable() ? '-' : filteredPaymentRows().length }}</dd>
          <dd class="type-body-sm text-text-secondary">Transaction records</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Payment issues</dt>
            <span class="admin-stat-icon" data-tone="error" aria-hidden="true">
              <svg lucideTriangleAlert class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ recordsUnavailable() ? '-' : failedPaymentCount() }}</dd>
          <dd class="type-body-sm text-text-secondary">Failed records loaded</dd>
        </div>
      </dl>

      @if (statusMessage()) {
        <app-alert-banner tone="success" [title]="'Order updated'" [message]="statusMessage()" [dismissible]="true" (dismissed)="statusMessage.set('')" />
      }
      @if (errorMessage()) {
        <app-alert-banner tone="error" [title]="'Order issue'" [message]="errorMessage()" [dismissible]="true" (dismissed)="errorMessage.set('')" />
      }

      @if (recordsUnavailable()) {
        <section class="admin-panel" aria-labelledby="records-unavailable-title">
          <div class="admin-panel-header">
            <div>
              <p class="type-label-sm text-text-muted">Records</p>
              <h3 id="records-unavailable-title" class="admin-panel-title">Records unavailable</h3>
              <p class="admin-panel-copy">Orders and payments could not be loaded from the server.</p>
            </div>
            <app-button variant="secondary" size="sm" (pressed)="loadRecords()">Retry</app-button>
          </div>
        </section>
      } @else if (!isLoading() && filteredOrderRows().length === 0 && filteredPaymentRows().length === 0) {
        <section class="admin-panel" aria-labelledby="records-empty-title">
          <div class="admin-panel-header">
            <div>
              <p class="type-label-sm text-text-muted">Records</p>
              <h3 id="records-empty-title" class="admin-panel-title">No records found</h3>
              <p class="admin-panel-copy">Clear the search or wait for new orders and payment records.</p>
            </div>
            @if (query()) {
              <app-button variant="secondary" size="sm" (pressed)="query.set('')">Clear search</app-button>
            }
          </div>
        </section>
      } @else {
        @if (pageKind === 'payments') {
          <ng-container [ngTemplateOutlet]="paymentsPanel" />
          <ng-container [ngTemplateOutlet]="ordersPanel" />
        } @else {
          <ng-container [ngTemplateOutlet]="ordersPanel" />
          <ng-container [ngTemplateOutlet]="paymentsPanel" />
        }
      }

      <ng-template #ordersPanel>
        <section class="admin-panel" aria-labelledby="orders-table-title">
          <div class="admin-panel-header">
            <div>
              <p class="type-label-sm text-text-muted">Orders</p>
              <h3 id="orders-table-title" class="admin-panel-title">Fulfillment queue</h3>
              <p class="admin-panel-copy">Confirm, inspect, or cancel orders from the current activity window.</p>
            </div>
            <app-badge tone="info" [label]="filteredOrderRows().length + ' rows'" />
          </div>
          <div class="admin-table-wrap">
            @if (isLoading()) {
              <div class="p-md">
                <app-skeleton-loader shape="block" [count]="5" label="Loading orders" />
              </div>
            } @else {
              <table class="admin-table admin-table-orders">
                <caption class="sr-only">Orders</caption>
                <thead>
                  <tr>
                    @for (column of orderColumns; track column.id) {
                      <th>{{ column.header }}</th>
                    }
                    <th class="admin-table-action">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of filteredOrderRows(); track order.id) {
                    <tr>
                      <td>
                        <button class="rounded-sm type-label-md text-text-primary underline-offset-4 hover:underline focus-visible:focus-ring" type="button" (click)="detailOrderId.set(order.id)">
                          {{ order.orderNumber }}
                        </button>
                      </td>
                      <td class="admin-table-token">{{ order.customerEmail }}</td>
                      <td class="admin-table-number">{{ order.totalAmountLabel }}</td>
                      <td class="admin-table-status"><app-badge [tone]="order.statusTone" [label]="order.statusLabel" /></td>
                      <td class="admin-table-status"><app-badge [tone]="order.paymentStatusTone" [label]="order.paymentStatusLabel" /></td>
                      <td><app-badge variant="outline" [label]="order.paymentMethodLabel" /></td>
                      <td class="admin-table-date">{{ order.createdLabel }}</td>
                      <td class="admin-table-action">
                        <div class="admin-row-actions" role="group" [attr.aria-label]="'Actions for ' + order.orderNumber">
                          <app-tooltip content="View order">
                            <button class="admin-icon-action" data-tone="info" type="button" [attr.aria-label]="'View ' + order.orderNumber" (click)="handleOrderAction(order.idString, 'view-order-detail')">
                              <svg lucideEye class="size-icon-sm" aria-hidden="true"></svg>
                            </button>
                          </app-tooltip>
                          <app-tooltip content="Confirm order">
                            <button class="admin-icon-action" data-tone="success" type="button" [attr.aria-label]="'Confirm ' + order.orderNumber" (click)="handleOrderAction(order.idString, 'confirm-order')">
                              <svg lucideCheckCheck class="size-icon-sm" aria-hidden="true"></svg>
                            </button>
                          </app-tooltip>
                          <app-tooltip content="Cancel order">
                            <button class="admin-icon-action" data-tone="danger" type="button" [attr.aria-label]="'Cancel ' + order.orderNumber" (click)="handleOrderAction(order.idString, 'cancel-order')">
                              <svg lucideCircleX class="size-icon-sm" aria-hidden="true"></svg>
                            </button>
                          </app-tooltip>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td class="p-xl text-center type-body-md text-text-muted" colspan="8">No order rows to display.</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </section>
      </ng-template>

      <ng-template #paymentsPanel>
        <section class="admin-panel" aria-labelledby="payments-title">
          <div class="admin-panel-header">
            <div>
              <div>
                <p class="type-label-sm text-text-muted">Payments</p>
                <h3 id="payments-title" class="admin-panel-title">Recent payment activity</h3>
                <p class="admin-panel-copy">Review payment method, status, and linked order context.</p>
              </div>
            </div>
            <app-badge tone="info" [label]="paymentRecordLabel()" />
          </div>
          <div class="admin-table-wrap">
            @if (isLoading()) {
              <div class="p-md">
                <app-skeleton-loader shape="block" [count]="5" label="Loading payments" />
              </div>
            } @else {
              <table class="admin-table admin-table-orders">
                <caption class="sr-only">Payments</caption>
                <thead>
                  <tr>
                    @for (column of paymentColumns; track column.id) {
                      <th>{{ column.header }}</th>
                    }
                    <th class="admin-table-action">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (payment of filteredPaymentRows(); track payment.id) {
                    <tr>
                      <td class="admin-table-token">{{ payment.orderNumber }}</td>
                      <td class="admin-table-token">{{ payment.customerEmail }}</td>
                      <td class="admin-table-number">{{ payment.amountLabel }}</td>
                      <td><app-badge variant="outline" [label]="payment.methodLabel" /></td>
                      <td class="admin-table-status"><app-badge [tone]="payment.statusTone" [label]="payment.statusLabel" /></td>
                      <td class="admin-table-action">
                        <div class="admin-row-actions" role="group" [attr.aria-label]="'Actions for payment ' + payment.orderNumber">
                          <app-tooltip content="View order">
                            <button class="admin-icon-action" data-tone="info" type="button" [attr.aria-label]="'View order for payment ' + payment.orderNumber" (click)="handlePaymentAction(payment.idString, 'view-order-detail')">
                              <svg lucideEye class="size-icon-sm" aria-hidden="true"></svg>
                            </button>
                          </app-tooltip>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td class="p-xl text-center type-body-md text-text-muted" colspan="6">No payment rows to display.</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </section>
      </ng-template>

      <app-sheet
        [title]="'Order detail'"
        description="Review the order, payment method, and current order status."
        [open]="!!detailOrder()"
        size="md"
        (closed)="detailOrderId.set(null)"
      >
	        @if (detailOrder(); as order) {
	          <div class="grid gap-md">
	            <div>
	              <p class="type-label-sm text-text-muted">{{ order.orderNumber }}</p>
	              <h3 class="type-heading-lg text-text-primary">{{ order.customerEmail }}</h3>
	            </div>
	            <dl class="grid gap-sm">
	              <div class="flex justify-between gap-md border-b-hairline border-border-default pb-xs">
	                <dt class="type-body-sm text-text-muted">Order total</dt>
	                <dd class="type-body-sm text-text-primary">{{ order.totalAmount }}</dd>
	              </div>
	              <div class="flex justify-between gap-md border-b-hairline border-border-default pb-xs">
	                <dt class="type-body-sm text-text-muted">Status</dt>
	                <dd class="type-body-sm text-text-primary">{{ order.statusLabel }}</dd>
	              </div>
	              <div class="flex justify-between gap-md border-b-hairline border-border-default pb-xs">
	                <dt class="type-body-sm text-text-muted">Payment</dt>
	                <dd class="type-body-sm text-text-primary">{{ order.paymentStatusLabel }}</dd>
	              </div>
	              <div class="flex justify-between gap-md border-b-hairline border-border-default pb-xs">
	                <dt class="type-body-sm text-text-muted">Method</dt>
	                <dd class="type-body-sm text-text-primary">{{ order.paymentMethodLabel }}</dd>
	              </div>
	              <div class="flex justify-between gap-md">
	                <dt class="type-body-sm text-text-muted">Created</dt>
	                <dd class="type-body-sm text-text-primary">{{ order.createdLabel }}</dd>
	              </div>
	            </dl>
	          </div>
        }
      </app-sheet>

      <app-alert-dialog
        [open]="!!cancelOrderId()"
        [title]="'Cancel order'"
        description="Cancel this order only after payment and delivery checks have been reviewed."
        [destructive]="true"
        [confirmAction]="cancelConfirmAction()"
        [cancelAction]="{ label: 'Keep order', variant: 'secondary' }"
        (confirmPressed)="confirmCancelOrder()"
        (cancelPressed)="cancelOrderId.set(null)"
        (closed)="cancelOrderId.set(null)"
      />
    </section>
  `,
})
export class AdminOrdersPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminService = inject(AdminService);

  protected readonly pageKind = this.route.snapshot.routeConfig?.path === 'payments' ? 'payments' : 'orders';
  protected readonly orderColumns: readonly UiTableColumn[] = [
    { id: 'orderNumber', header: 'Order', sortable: true },
    { id: 'customer', header: 'Customer', sortable: true },
    { id: 'total', header: 'Total', sortable: true },
    { id: 'status', header: 'Status', sortable: true },
    { id: 'payment', header: 'Payment', sortable: true },
    { id: 'method', header: 'Method' },
    { id: 'created', header: 'Date', sortable: true },
  ];
  protected readonly paymentColumns: readonly UiTableColumn[] = [
    { id: 'orderNumber', header: 'Order', sortable: true },
    { id: 'customer', header: 'Customer', sortable: true },
    { id: 'amount', header: 'Amount', sortable: true },
    { id: 'method', header: 'Method' },
    { id: 'status', header: 'Status', sortable: true },
  ];
  protected readonly orders = signal<readonly AdminOrder[]>([]);
  protected readonly payments = signal<readonly AdminPayment[]>([]);
  protected readonly query = signal('');
  protected readonly detailOrderId = signal<number | null>(null);
  protected readonly cancelOrderId = signal<number | null>(null);
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);

  protected readonly filteredOrderRows = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.orders()
      .filter((order) => !query || `${order.order_number} ${order.customer_email}`.toLowerCase().includes(query))
      .map((order) => toOrderRow(order));
  });
  protected readonly filteredPaymentRows = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.payments()
      .filter((payment) => !query || `${payment.order_number} ${payment.customer_email}`.toLowerCase().includes(query))
      .map((payment) => toPaymentRow(payment));
  });
  protected readonly detailOrder = computed(() => {
    const order = this.orders().find((entry) => entry.id === this.detailOrderId());

    if (!order) {
      return null;
    }

    return {
      orderNumber: order.order_number,
      customerEmail: order.customer_email,
      totalAmount: currencyValue(order.total_amount),
      statusLabel: formatLabel(order.status),
      paymentStatusLabel: formatLabel(order.payment_status),
      paymentMethodLabel: formatLabel(order.payment_method || 'unknown'),
      createdLabel: formatDate(order.created_at),
    } satisfies AdminOrderDetailView;
  });
  protected readonly recordCount = computed(() => this.filteredOrderRows().length + this.filteredPaymentRows().length);
  protected readonly paymentRecordLabel = computed(() => `${this.filteredPaymentRows().length} records`);
  protected readonly recordsUnavailable = computed(() => !!this.errorMessage() && this.orders().length === 0 && this.payments().length === 0 && !this.isLoading());
  protected readonly openOrderCount = computed(() =>
    this.orders().filter((order) => !['cancelled', 'completed', 'delivered'].includes(order.status)).length,
  );
  protected readonly failedPaymentCount = computed(() => this.payments().filter((payment) => payment.status === 'failed').length);
  protected readonly cancelConfirmAction = computed<UiAction>(() => ({ label: 'Cancel order', variant: 'danger', loading: this.isSaving() }));

  ngOnInit(): void {
    this.loadRecords();
  }

  protected handleOrderAction(orderId: string, actionId: string): void {
    const numericId = Number(orderId);
    if (actionId === 'view-order-detail') {
      this.detailOrderId.set(numericId);
    } else if (actionId === 'confirm-order') {
      this.updateOrderStatus(numericId, 'confirmed', 'Order confirmed.');
    } else if (actionId === 'cancel-order') {
      this.cancelOrderId.set(numericId);
    }
  }

  protected handlePaymentAction(paymentId: string, actionId: string): void {
    if (actionId !== 'view-order-detail') {
      return;
    }

    const payment = this.payments().find((item) => item.id === Number(paymentId));
    if (!payment) {
      return;
    }

    const order = this.orders().find((item) => item.order_number === payment.order_number);
    this.detailOrderId.set(order?.id ?? null);
  }

  protected confirmCancelOrder(): void {
    const orderId = this.cancelOrderId();
    if (orderId === null) {
      return;
    }

    this.updateOrderStatus(orderId, 'cancelled', 'Order cancelled.');
    this.cancelOrderId.set(null);
  }

  protected loadRecords(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);
    forkJoin({
      orders: this.adminService.getOrders({ page: 1, page_size: 50 }),
      payments: this.adminService.getPayments({ page: 1, page_size: 50 }),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ orders, payments }) => {
          this.orders.set(orders.results);
          this.payments.set(payments.results);
        },
        error: () => this.errorMessage.set('Orders and payments could not be loaded.'),
      });
  }

  private updateOrderStatus(orderId: number, status: string, successMessage: string): void {
    this.errorMessage.set('');
    this.isSaving.set(true);
    this.adminService
      .updateOrderStatus(orderId, status)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.statusMessage.set(successMessage);
          this.loadRecords();
        },
        error: () => this.errorMessage.set('The order update could not be completed.'),
      });
  }
}

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

function formatDate(value: string): string {
  return value.slice(0, 10);
}

function currencyValue(amount: string): string {
  return `$${Number(amount).toFixed(2)}`;
}

function statusTone(value: string): 'success' | 'warning' | 'error' | 'info' {
  switch (value) {
    case 'paid':
    case 'confirmed':
    case 'completed':
    case 'delivered':
      return 'success';
    case 'failed':
    case 'cancelled':
      return 'error';
    case 'pending':
    case 'cod_pending':
    case 'processing':
      return 'warning';
    default:
      return 'info';
  }
}

function toOrderRow(order: AdminOrder): AdminOrderRowView {
  return {
    id: order.id,
    idString: String(order.id),
    orderNumber: order.order_number,
    customerEmail: order.customer_email,
    totalAmountLabel: currencyValue(order.total_amount),
    statusLabel: formatLabel(order.status),
    statusTone: statusTone(order.status),
    paymentStatusLabel: formatLabel(order.payment_status),
    paymentStatusTone: statusTone(order.payment_status),
    paymentMethodLabel: formatLabel(order.payment_method || 'unknown'),
    createdLabel: formatDate(order.created_at),
  };
}

function toPaymentRow(payment: AdminPayment): AdminPaymentRowView {
  return {
    id: payment.id,
    idString: String(payment.id),
    orderNumber: payment.order_number,
    customerEmail: payment.customer_email,
    amountLabel: currencyValue(payment.amount),
    methodLabel: formatLabel(payment.method),
    statusLabel: formatLabel(payment.status),
    statusTone: statusTone(payment.status),
  };
}
