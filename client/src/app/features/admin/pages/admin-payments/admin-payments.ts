import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AdminService, AdminPayment } from '../../services/admin.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-xl font-semibold text-slate-900">Payments</h2>
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
                <th class="px-4 py-3">Amount</th>
                <th class="px-4 py-3">Method</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Reference</th>
                <th class="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (payment of payments(); track payment.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-3 font-mono text-slate-900">{{ payment.order_number }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ payment.customer_email }}</td>
                  <td class="px-4 py-3 font-semibold text-slate-900">${{ payment.amount }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 uppercase">
                      {{ payment.method }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class.bg-green-100]="payment.status === 'paid'"
                      [class.text-green-700]="payment.status === 'paid'"
                      [class.bg-amber-100]="payment.status === 'pending' || payment.status === 'cod_pending'"
                      [class.text-amber-700]="payment.status === 'pending' || payment.status === 'cod_pending'"
                      [class.bg-red-100]="payment.status === 'failed'"
                      [class.text-red-600]="payment.status === 'failed'">
                      {{ payment.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs text-slate-400">
                    {{ payment.provider_reference ?? '—' }}
                  </td>
                  <td class="px-4 py-3 text-slate-500">{{ payment.created_at | slice:0:10 }}</td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">No payments found.</td></tr>
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
export class AdminPaymentsPage implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly payments = signal<AdminPayment[]>([]);
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
      .getPayments({ page })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => { this.payments.set(res.results); this.totalCount.set(res.count); },
        error: () => this.error.set('Could not load payments.'),
      });
  }
}
