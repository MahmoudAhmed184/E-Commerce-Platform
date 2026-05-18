import { CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AdminService, DashboardStats } from '../../services/admin.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, SlicePipe, LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-2xl font-bold text-slate-900 mb-6">Dashboard Overview</h2>

      <app-error-message [message]="error()" />

      @if (isLoading()) {
        <div class="mt-10 flex justify-center"><app-loading-spinner size="md" /></div>
      } @else if (stats()) {
        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
          
          <!-- Total Users -->
          <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Total Users</p>
                <p class="text-2xl font-bold text-slate-900">{{ stats()?.total_users }}</p>
              </div>
            </div>
          </div>

          <!-- Total Products -->
          <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Total Products</p>
                <p class="text-2xl font-bold text-slate-900">{{ stats()?.total_products }}</p>
              </div>
            </div>
          </div>

          <!-- Total Orders -->
          <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Total Orders</p>
                <p class="text-2xl font-bold text-slate-900">{{ stats()?.total_orders }}</p>
              </div>
            </div>
          </div>

          <!-- Total Revenue -->
          <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Total Revenue</p>
                <p class="text-2xl font-bold text-slate-900">{{ stats()?.total_revenue | currency:'USD':'symbol' }}</p>
              </div>
            </div>
          </div>

          <!-- Pending Users -->
          <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500">Pending Users</p>
                <p class="text-2xl font-bold text-slate-900">{{ stats()?.pending_users_count }}</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Recent Orders -->
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Recent Orders</h3>
        <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Order #</th>
                <th class="px-4 py-3">Customer</th>
                <th class="px-4 py-3">Total</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Payment</th>
                <th class="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (order of stats()?.recent_orders; track order.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-3 font-mono text-slate-900">{{ order.order_number }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ order.customer_email }}</td>
                  <td class="px-4 py-3 font-semibold text-slate-900">{{ order.total_amount | currency:'USD':'symbol' }}</td>
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
                  <td class="px-4 py-3 text-slate-500">{{ order.created_at | date:'mediumDate' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="px-4 py-8 text-center text-slate-400">No recent orders.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminOverviewPage implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.error.set('');
    this.isLoading.set(true);
    
    this.adminService.getDashboardStats()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.stats.set(data),
        error: () => this.error.set('Could not load dashboard statistics.'),
      });
  }
}
