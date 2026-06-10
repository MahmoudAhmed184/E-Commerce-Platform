import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AdminOrder, AdminService } from '../../services/admin.service';

interface DashboardSnapshot {
  users: number;
  orders: number;
  products: number;
  categories: number;
  payments: number;
  reviews: number;
  recentOrders: AdminOrder[];
}

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="admin-overview-title">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Control center</p>
          <h2 id="admin-overview-title" class="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Store overview
          </h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Monitor catalog activity, customers, orders, and moderation from one place.
          </p>
        </div>
        <button
          type="button"
          (click)="load()"
          [disabled]="isLoading()"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        >
          <svg aria-hidden="true" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
          </svg>
          Refresh
        </button>
      </div>

      <div class="mt-6">
        <app-error-message [message]="error()" />
      </div>

      @if (isLoading() && !snapshot()) {
        <div class="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div class="text-center text-slate-500">
            <app-loading-spinner size="lg" />
            <p class="mt-3 text-sm font-medium">Loading store activity...</p>
          </div>
        </div>
      } @else if (snapshot(); as data) {
        <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          @for (stat of stats(); track stat.label) {
            <a
              [routerLink]="stat.link"
              class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg"
            >
              <div class="absolute inset-y-0 left-0 w-1 bg-amber-400 opacity-0 transition group-hover:opacity-100"></div>
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-slate-500">{{ stat.label }}</p>
                  <p class="mt-2 text-3xl font-bold tracking-tight text-slate-950">{{ stat.value }}</p>
                </div>
                <span class="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-amber-100 group-hover:text-amber-800">
                  <svg aria-hidden="true" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path [attr.d]="stat.iconPath" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
              <p class="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-amber-700">
                Manage {{ stat.label.toLowerCase() }}
              </p>
            </a>
          }
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.7fr)]">
          <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="recent-orders-title">
            <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h3 id="recent-orders-title" class="text-base font-bold text-slate-950">Recent orders</h3>
                <p class="mt-0.5 text-sm text-slate-500">Latest checkout activity</p>
              </div>
              <a routerLink="/admin/orders" class="text-sm font-semibold text-amber-700 hover:text-amber-900">View all</a>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full min-w-[680px] text-left text-sm">
                <thead class="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th class="px-6 py-3">Order</th>
                    <th class="px-6 py-3">Customer</th>
                    <th class="px-6 py-3">Status</th>
                    <th class="px-6 py-3">Total</th>
                    <th class="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (order of data.recentOrders; track order.id) {
                    <tr class="transition hover:bg-slate-50">
                      <td class="px-6 py-4 font-mono text-xs font-semibold text-slate-800">{{ order.order_number }}</td>
                      <td class="max-w-56 truncate px-6 py-4 text-slate-600">{{ order.customer_email }}</td>
                      <td class="px-6 py-4">
                        <span
                          class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize"
                          [class.bg-emerald-100]="order.status === 'confirmed'"
                          [class.text-emerald-800]="order.status === 'confirmed'"
                          [class.bg-amber-100]="order.status === 'pending'"
                          [class.text-amber-800]="order.status === 'pending'"
                          [class.bg-red-100]="order.status === 'cancelled' || order.status === 'failed'"
                          [class.text-red-700]="order.status === 'cancelled' || order.status === 'failed'"
                        >
                          {{ order.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 font-bold text-slate-950">{{ order.total_amount | currency:'USD' }}</td>
                      <td class="px-6 py-4 text-slate-500">{{ order.created_at | date:'mediumDate' }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="px-6 py-12 text-center text-slate-500">No orders have been placed yet.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <aside class="rounded-2xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-300" aria-labelledby="quick-actions-title">
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Shortcuts</p>
            <h3 id="quick-actions-title" class="mt-2 text-xl font-bold">Quick actions</h3>
            <p class="mt-2 text-sm leading-6 text-slate-400">Jump directly to the tasks that keep the store moving.</p>

            <div class="mt-6 space-y-3">
              @for (action of quickActions; track action.link) {
                <a
                  [routerLink]="action.link"
                  class="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-300"
                >
                  <span>{{ action.label }}</span>
                  <span aria-hidden="true">→</span>
                </a>
              }
            </div>
          </aside>
        </div>
      }
    </section>
  `,
})
export class AdminOverviewPage implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly snapshot = signal<DashboardSnapshot | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error = signal('');

  protected readonly stats = computed(() => {
    const data = this.snapshot();
    if (!data) {
      return [];
    }

    return [
      { label: 'Users', value: data.users, link: '/admin/users', iconPath: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
      { label: 'Orders', value: data.orders, link: '/admin/orders', iconPath: 'm3 7 9 5 9-5M3 7l9-5 9 5v10l-9 5-9-5V7Zm9 5v10' },
      { label: 'Products', value: data.products, link: '/admin/products', iconPath: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6ZM3 6h18' },
      { label: 'Categories', value: data.categories, link: '/admin/categories', iconPath: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z' },
      { label: 'Payments', value: data.payments, link: '/admin/payments', iconPath: 'M2 7h20v10H2V7Zm0 3h20M6 14h2' },
      { label: 'Reviews', value: data.reviews, link: '/admin/reviews', iconPath: 'm12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z' },
    ];
  });

  protected readonly quickActions = [
    { label: 'Review pending users', link: '/admin/users' },
    { label: 'Update product stock', link: '/admin/products' },
    { label: 'Moderate customer reviews', link: '/admin/reviews' },
  ];

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.error.set('');
    this.isLoading.set(true);

    forkJoin({
      users: this.adminService.getUsers({ page: 1, page_size: 1 }),
      orders: this.adminService.getOrders({ page: 1, page_size: 5 }),
      products: this.adminService.getAdminProducts({ page: 1, page_size: 1 }),
      categories: this.adminService.getAdminCategories({ page: 1, page_size: 1 }),
      payments: this.adminService.getPayments({ page: 1, page_size: 1 }),
      reviews: this.adminService.getReviews({ page: 1, page_size: 1 }),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ users, orders, products, categories, payments, reviews }) => {
          this.snapshot.set({
            users: users.count,
            orders: orders.count,
            products: products.count,
            categories: categories.count,
            payments: payments.count,
            reviews: reviews.count,
            recentOrders: orders.results,
          });
        },
        error: () => this.error.set('The dashboard summary could not be loaded. Try refreshing the page.'),
      });
  }
}
