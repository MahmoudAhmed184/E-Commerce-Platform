import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AdminService, AdminOrder } from '../../services/admin.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [SlicePipe, LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-xl font-semibold text-slate-900">Orders</h2>
      <app-error-message [message]="error()" />

      @if (isLoading()) {
        <div class="mt-10 flex justify-center"><app-loading-spinner size="md" /></div>
      } @else {
        <div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Order #</th>
                <th class="px-4 py-3">Customer</th>
                <th class="px-4 py-3">Total</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Payment</th>
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (order of orders(); track order.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-3 font-mono text-slate-900">{{ order.order_number }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ order.customer_email }}</td>
                  <td class="px-4 py-3 font-semibold text-slate-900">&#36;{{ order.total_amount }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class.bg-green-100]="order.status === 'confirmed'"
                      [class.text-green-700]="order.status === 'confirmed'"
                      [class.bg-amber-100]="order.status === 'pending'"
                      [class.text-amber-700]="order.status === 'pending'"
                      [class.bg-red-100]="order.status === 'cancelled' || order.status === 'failed'"
                      [class.text-red-700]="order.status === 'cancelled' || order.status === 'failed'">
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class.bg-green-100]="order.payment_status === 'paid'"
                      [class.text-green-700]="order.payment_status === 'paid'"
                      [class.bg-slate-100]="order.payment_status !== 'paid'"
                      [class.text-slate-600]="order.payment_status !== 'paid'">
                      {{ order.payment_status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-500">{{ order.created_at | slice:0:10 }}</td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      @if (order.status === 'pending') {
                        <button type="button" (click)="updateStatus(order, 'confirmed')"
                          class="text-xs font-medium text-green-600 hover:text-green-800">Confirm</button>
                        <button type="button" (click)="updateStatus(order, 'cancelled')"
                          class="text-xs font-medium text-red-500 hover:text-red-700">Cancel</button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">No orders found.</td></tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="mt-4 flex items-center gap-2 text-sm">
            <button type="button" [disabled]="currentPage() === 1"
              class="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-50"
              (click)="load(currentPage() - 1)">← Prev</button>
            <span class="text-slate-600">Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button type="button" [disabled]="currentPage() === totalPages()"
              class="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-50"
              (click)="load(currentPage() + 1)">Next →</button>
          </div>
        }
      }
    </div>
  `,
})
export class AdminOrdersPage implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly orders = signal<AdminOrder[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal('');
  protected readonly currentPage = signal(1);
  protected readonly totalCount = signal(0);
  protected readonly pageSize = 20;
  protected readonly totalPages = () => Math.ceil(this.totalCount() / this.pageSize) || 1;

  ngOnInit(): void { this.load(); }

  protected load(page = 1): void {
    this.error.set('');
    this.isLoading.set(true);
    this.currentPage.set(page);
    this.adminService
      .getOrders({ page })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => { this.orders.set(res.results); this.totalCount.set(res.count); },
        error: () => this.error.set('Could not load orders.'),
      });
  }

  protected updateStatus(order: AdminOrder, status: string): void {
    this.adminService.updateOrderStatus(order.id, status).subscribe({
      next: (updated) =>
        this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o))),
      error: () => this.error.set('Could not update order status.'),
    });
  }
}
