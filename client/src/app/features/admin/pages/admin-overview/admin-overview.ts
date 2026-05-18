import { CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AdminService, DashboardStats } from '../../services/admin.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, SlicePipe, LoadingSpinnerComponent, ErrorMessageComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 transition-colors">Dashboard Overview</h2>

      <app-error-message [message]="error()" />

      @if (isLoading()) {
        <div class="mt-10 flex justify-center"><app-loading-spinner size="md" /></div>
      } @else if (stats()) {
        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
          
          <!-- Total Users -->
          <a routerLink="/admin/users" class="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 cursor-pointer">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Users</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ stats()?.total_users }}</p>
              </div>
            </div>
          </a>

          <!-- Total Products -->
          <a routerLink="/admin/products" class="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 cursor-pointer">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Products</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ stats()?.total_products }}</p>
              </div>
            </div>
          </a>

          <!-- Total Orders -->
          <a routerLink="/admin/orders" class="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800 cursor-pointer">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Orders</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ stats()?.total_orders }}</p>
              </div>
            </div>
          </a>

          <!-- Total Revenue -->
          <a routerLink="/admin/payments" class="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-300 dark:hover:border-purple-800 cursor-pointer">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ stats()?.total_revenue | currency:'USD':'symbol' }}</p>
              </div>
            </div>
          </a>

          <!-- Pending Users -->
          <a routerLink="/admin/users" [queryParams]="{filter: 'pending'}" class="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 cursor-pointer">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Users</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ stats()?.pending_users_count }}</p>
              </div>
            </div>
          </a>

        </div>

        <!-- Tables Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          <!-- Recent Orders -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Orders</h3>
              <a routerLink="/admin/orders" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">View All</a>
            </div>
            <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th class="px-4 py-3">Order #</th>
                    <th class="px-4 py-3">Total</th>
                    <th class="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (order of stats()?.recent_orders; track order.id) {
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td class="px-4 py-3 font-mono text-slate-900 dark:text-slate-300">{{ order.order_number }}</td>
                      <td class="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{{ order.total_amount | currency:'USD':'symbol' }}</td>
                      <td class="px-4 py-3">
                        <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                          [class.bg-green-100]="order.status === 'confirmed'"
                          [class.text-green-700]="order.status === 'confirmed'"
                          [class.dark:bg-green-900/30]="order.status === 'confirmed'"
                          [class.dark:text-green-400]="order.status === 'confirmed'"
                          
                          [class.bg-amber-100]="order.status === 'pending'"
                          [class.text-amber-700]="order.status === 'pending'"
                          [class.dark:bg-amber-900/30]="order.status === 'pending'"
                          [class.dark:text-amber-400]="order.status === 'pending'"
                          
                          [class.bg-red-100]="order.status === 'cancelled' || order.status === 'failed'"
                          [class.text-red-700]="order.status === 'cancelled' || order.status === 'failed'"
                          [class.dark:bg-red-900/30]="order.status === 'cancelled' || order.status === 'failed'"
                          [class.dark:text-red-400]="order.status === 'cancelled' || order.status === 'failed'">
                          {{ order.status }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="3" class="px-4 py-8 text-center text-slate-400 dark:text-slate-500">No recent orders.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recent Payments -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Payments</h3>
              <a routerLink="/admin/payments" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">View All</a>
            </div>
            <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th class="px-4 py-3">Order #</th>
                    <th class="px-4 py-3">Amount</th>
                    <th class="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (payment of stats()?.recent_payments; track payment.id) {
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td class="px-4 py-3 font-mono text-slate-900 dark:text-slate-300">{{ payment.order_number }}</td>
                      <td class="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{{ payment.amount | currency:'USD':'symbol' }}</td>
                      <td class="px-4 py-3">
                        <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                          [class.bg-green-100]="payment.status === 'paid'"
                          [class.text-green-700]="payment.status === 'paid'"
                          [class.dark:bg-green-900/30]="payment.status === 'paid'"
                          [class.dark:text-green-400]="payment.status === 'paid'"
                          
                          [class.bg-amber-100]="payment.status === 'pending' || payment.status === 'cod_pending'"
                          [class.text-amber-700]="payment.status === 'pending' || payment.status === 'cod_pending'"
                          [class.dark:bg-amber-900/30]="payment.status === 'pending' || payment.status === 'cod_pending'"
                          [class.dark:text-amber-400]="payment.status === 'pending' || payment.status === 'cod_pending'"
                          
                          [class.bg-red-100]="payment.status === 'failed'"
                          [class.text-red-700]="payment.status === 'failed'"
                          [class.dark:bg-red-900/30]="payment.status === 'failed'"
                          [class.dark:text-red-400]="payment.status === 'failed'">
                          {{ payment.status }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="3" class="px-4 py-8 text-center text-slate-400 dark:text-slate-500">No recent payments.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- Latest Reviews -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Latest Reviews</h3>
            <a routerLink="/admin/reviews" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">View All</a>
          </div>
          <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="px-4 py-3">Product</th>
                  <th class="px-4 py-3">User</th>
                  <th class="px-4 py-3">Rating</th>
                  <th class="px-4 py-3">Comment</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (review of stats()?.recent_reviews; track review.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="px-4 py-3 text-slate-900 dark:text-slate-200 font-medium">{{ review.product_name | slice:0:30 }}{{ review.product_name.length > 30 ? '...' : '' }}</td>
                    <td class="px-4 py-3 text-slate-600 dark:text-slate-400">{{ review.user_name }}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center text-amber-400">
                        @for (star of [1, 2, 3, 4, 5]; track star) {
                          <svg class="h-4 w-4" [class.text-slate-200]="star > review.rating" [class.dark:text-slate-700]="star > review.rating" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        }
                      </div>
                    </td>
                    <td class="px-4 py-3 text-slate-600 dark:text-slate-400 truncate max-w-xs">{{ review.comment || '-' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="px-4 py-8 text-center text-slate-400 dark:text-slate-500">No recent reviews.</td></tr>
                }
              </tbody>
            </table>
          </div>
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
