import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';

import { CheckoutService, Order } from '../../../checkout/services/checkout.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-slate-950 tracking-tight">My Orders</h1>
        <a routerLink="/products" class="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
          Continue Shopping &rarr;
        </a>
      </div>

      @if (isLoading()) {
        <div class="mt-20 flex justify-center"><app-loading-spinner size="md" /></div>
      } @else if (error()) {
        <div class="mt-8"><app-error-message [message]="error()" /></div>
      } @else if (orders().length === 0) {
        <div class="mt-12 flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
          <div class="text-4xl text-slate-300 mb-4">📦</div>
          <p class="text-lg font-medium text-slate-900">No orders yet</p>
          <p class="text-sm text-slate-500 mb-6">You haven't placed any orders yet.</p>
          <a routerLink="/products" class="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">
            Browse Products
          </a>
        </div>
      } @else {
        <div class="mt-8 space-y-6">
          @for (o of orders(); track o.id) {
            <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Order Number</p>
                  <p class="font-mono text-sm font-bold text-slate-900">{{ o.order_number }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Date Placed</p>
                  <p class="text-sm text-slate-600">{{ o.created_at | date:'mediumDate' }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Amount</p>
                  <p class="text-sm font-semibold text-slate-900">&#36;{{ o.total_amount }}</p>
                </div>
                <div class="flex gap-2">
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    [class.bg-green-100]="o.status === 'confirmed'"
                    [class.text-green-800]="o.status === 'confirmed'"
                    [class.bg-yellow-100]="o.status === 'pending'"
                    [class.text-yellow-800]="o.status === 'pending'"
                    [class.bg-red-100]="o.status === 'cancelled' || o.status === 'failed'"
                    [class.text-red-800]="o.status === 'cancelled' || o.status === 'failed'">
                    {{ o.status }}
                  </span>
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-800">
                    {{ o.payment_status }}
                  </span>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div class="text-sm text-slate-600">
                  {{ o.items.length }} {{ o.items.length === 1 ? 'item' : 'items' }}:
                  <span class="font-medium text-slate-800">
                    @for (item of o.items; track item.id; let last = $last) {
                      {{ item.product_name }} (x{{ item.quantity }}){{ !last ? ', ' : '' }}
                    }
                  </span>
                </div>
                <a [routerLink]="['/orders', o.order_number]"
                  class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                  View Details
                </a>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class OrdersListPage implements OnInit {
  private readonly checkoutService = inject(CheckoutService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.isLoading.set(true);
    this.checkoutService
      .getOrders()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.orders.set(res),
        error: () => this.error.set('Could not load your orders. Please try again later.'),
      });
  }
}
