import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import { AlertDialogComponent } from '../../../../shared/components/alert-dialog/alert-dialog.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { DropdownMenuComponent } from '../../../../shared/components/dropdown-menu/dropdown-menu.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { SheetComponent } from '../../../../shared/components/sheet/sheet.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import type { UiAction, UiMenuItem, UiTableColumn } from '../../../../shared/components/ui.types';
import { AdminService, type AdminOrder, type AdminPayment } from '../../../../core/services/admin/admin.service';

interface AdminOrderRowView {
  readonly id: number;
  readonly idString: string;
  readonly orderNumber: string;
  readonly customerEmail: string;
  readonly totalAmountLabel: string;
  readonly statusLabel: string;
  readonly paymentStatusLabel: string;
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
    DropdownMenuComponent,
    EmptyStateComponent,
    SearchBarComponent,
    SheetComponent,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="grid gap-lg">
      <header class="grid gap-md lg:grid-cols-[var(--ui-layout-search-header-grid)] lg:items-end">
        <div class="grid gap-xs">
          <p class="type-label-sm text-text-muted">Admin</p>
          <h2 class="type-heading-xl text-text-primary">Orders and payments</h2>
          <p class="type-body-md text-text-secondary">Review order status, payment method, fulfillment readiness, and cash-on-delivery records.</p>
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

      @if (statusMessage()) {
        <app-alert-banner tone="success" title="Order updated" [message]="statusMessage()" [dismissible]="true" (dismissed)="statusMessage.set('')" />
      }
      @if (errorMessage()) {
        <app-alert-banner tone="error" title="Order issue" [message]="errorMessage()" [dismissible]="true" (dismissed)="errorMessage.set('')" />
      }

	      @if (!isLoading() && filteredOrderRows().length === 0 && filteredPaymentRows().length === 0) {
        <app-empty-state
          type="admin"
          title="No records found"
          message="Clear the search or wait for new orders and payment records."
          [action]="{ label: 'Clear search', variant: 'secondary' }"
          (actionPressed)="query.set('')"
        />
      } @else {
        <section class="overflow-x-auto rounded-md border-hairline border-border-default bg-surface-raised shadow-xs" aria-labelledby="orders-table-title">
          <h3 id="orders-table-title" class="sr-only">Orders</h3>
          @if (isLoading()) {
            <div class="p-md">
              <app-skeleton-loader shape="block" [count]="5" label="Loading orders" />
            </div>
          } @else {
            <table class="w-full min-w-container-md border-collapse text-start">
              <caption class="sr-only">Orders</caption>
              <thead class="bg-surface-subtle text-text-secondary">
                <tr>
                  @for (column of orderColumns; track column.id) {
                    <th class="p-sm text-start type-label-sm">{{ column.header }}</th>
                  }
                  <th class="p-sm text-end type-label-sm">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y-hairline divide-border-default">
	                @for (order of filteredOrderRows(); track order.id) {
	                  <tr class="interactive-transition hover:bg-surface-subtle">
	                    <td class="p-sm type-body-sm text-text-primary">{{ order.orderNumber }}</td>
	                    <td class="p-sm type-body-sm text-text-primary">{{ order.customerEmail }}</td>
	                    <td class="p-sm type-body-sm text-text-primary">{{ order.totalAmountLabel }}</td>
	                    <td class="p-sm type-body-sm text-text-primary">{{ order.statusLabel }}</td>
	                    <td class="p-sm type-body-sm text-text-primary">{{ order.paymentStatusLabel }}</td>
	                    <td class="p-sm type-body-sm text-text-primary">{{ order.paymentMethodLabel }}</td>
	                    <td class="p-sm type-body-sm text-text-primary">{{ order.createdLabel }}</td>
	                    <td class="p-sm text-end">
	                      <app-dropdown-menu label="Row actions" [items]="orderActions" (selected)="handleOrderAction(order.idString, $event)" />
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
        </section>

        @defer (on viewport) {
          <section class="grid gap-md" aria-labelledby="payments-title">
            <div class="flex flex-wrap items-center justify-between gap-md">
              <div>
                <p class="type-label-sm text-text-muted">Payments</p>
                <h3 id="payments-title" class="type-heading-lg text-text-primary">Recent payment activity</h3>
              </div>
              <app-badge tone="info" [label]="paymentRecordLabel()" />
            </div>
            <div class="overflow-x-auto rounded-md border-hairline border-border-default bg-surface-raised shadow-xs">
              @if (isLoading()) {
                <div class="p-md">
                  <app-skeleton-loader shape="block" [count]="5" label="Loading payments" />
                </div>
              } @else {
                <table class="w-full min-w-container-md border-collapse text-start">
                  <caption class="sr-only">Payments</caption>
                  <thead class="bg-surface-subtle text-text-secondary">
                    <tr>
                      @for (column of paymentColumns; track column.id) {
                        <th class="p-sm text-start type-label-sm">{{ column.header }}</th>
                      }
                      <th class="p-sm text-end type-label-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y-hairline divide-border-default">
                    @for (payment of filteredPaymentRows(); track payment.id) {
                      <tr class="interactive-transition hover:bg-surface-subtle">
                        <td class="p-sm type-body-sm text-text-primary">{{ payment.orderNumber }}</td>
                        <td class="p-sm type-body-sm text-text-primary">{{ payment.customerEmail }}</td>
                        <td class="p-sm type-body-sm text-text-primary">{{ payment.amountLabel }}</td>
                        <td class="p-sm type-body-sm text-text-primary">{{ payment.methodLabel }}</td>
                        <td class="p-sm type-body-sm text-text-primary">{{ payment.statusLabel }}</td>
                        <td class="p-sm text-end">
                          <app-dropdown-menu label="Row actions" [items]="paymentActions" (selected)="handlePaymentAction(payment.idString, $event)" />
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
        } @placeholder {
          <section class="grid gap-md" aria-label="Loading payment activity">
            <app-skeleton-loader shape="block" [count]="4" label="Loading payment activity" />
          </section>
        }
      }

      <app-sheet
        title="Order detail"
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
        title="Cancel order"
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
  private readonly adminService = inject(AdminService);

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
  protected readonly orderActions: readonly UiMenuItem[] = [
    { id: 'view-order-detail', label: 'View order detail' },
    { id: 'confirm-order', label: 'Confirm order' },
    { id: 'cancel-order', label: 'Cancel order', destructive: true },
  ];
  protected readonly paymentActions: readonly UiMenuItem[] = [{ id: 'view-order-detail', label: 'View order detail' }];

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
  protected readonly cancelConfirmAction = computed<UiAction>(() => ({ label: 'Cancel order', variant: 'danger', loading: this.isSaving() }));

  ngOnInit(): void {
    this.loadRecords();
  }

  protected handleOrderAction(orderId: string, action: UiMenuItem): void {
    const numericId = Number(orderId);
    if (action.id === 'view-order-detail') {
      this.detailOrderId.set(numericId);
    } else if (action.id === 'confirm-order') {
      this.updateOrderStatus(numericId, 'confirmed', 'Order confirmed.');
    } else if (action.id === 'cancel-order') {
      this.cancelOrderId.set(numericId);
    }
  }

  protected handlePaymentAction(paymentId: string, action: UiMenuItem): void {
    if (action.id !== 'view-order-detail') {
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

  private loadRecords(): void {
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

function toOrderRow(order: AdminOrder): AdminOrderRowView {
  return {
    id: order.id,
    idString: String(order.id),
    orderNumber: order.order_number,
    customerEmail: order.customer_email,
    totalAmountLabel: currencyValue(order.total_amount),
    statusLabel: formatLabel(order.status),
    paymentStatusLabel: formatLabel(order.payment_status),
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
  };
}
