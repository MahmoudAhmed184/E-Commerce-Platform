import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AdminService, AdminReview } from '../../services/admin.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [SlicePipe, LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-xl font-semibold text-slate-900">Review Moderation</h2>
      <app-error-message [message]="error()" />

      @if (isLoading()) {
        <div class="mt-10 flex justify-center"><app-loading-spinner size="md" /></div>
      } @else {
        <div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">User</th>
                <th class="px-4 py-3">Product</th>
                <th class="px-4 py-3">Rating</th>
                <th class="px-4 py-3">Comment</th>
                <th class="px-4 py-3">Visible</th>
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (review of reviews(); track review.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-3 text-slate-900">{{ review.user_name }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ review.product_name }}</td>
                  <td class="px-4 py-3 text-amber-500">
                    {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
                  </td>
                  <td class="max-w-xs px-4 py-3 text-slate-600 truncate">{{ review.comment ?? '—' }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class.bg-green-100]="review.is_visible"
                      [class.text-green-700]="review.is_visible"
                      [class.bg-red-100]="!review.is_visible"
                      [class.text-red-600]="!review.is_visible">
                      {{ review.is_visible ? 'Visible' : 'Hidden' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-500">{{ review.created_at | slice:0:10 }}</td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      @if (review.is_visible) {
                        <button type="button" (click)="hide(review)"
                          class="text-xs font-medium text-amber-600 hover:text-amber-800">Hide</button>
                      }
                      <button type="button" (click)="remove(review)"
                        class="text-xs font-medium text-red-500 hover:text-red-700">Delete</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">No reviews found.</td></tr>
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
export class AdminReviewsPage implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly reviews = signal<AdminReview[]>([]);
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
      .getReviews({ page })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => { this.reviews.set(res.results); this.totalCount.set(res.count); },
        error: () => this.error.set('Could not load reviews.'),
      });
  }

  protected hide(review: AdminReview): void {
    this.adminService.hideReview(review.id).subscribe({
      next: (updated) =>
        this.reviews.update((list) => list.map((r) => (r.id === updated.id ? updated : r))),
      error: () => this.error.set('Could not hide review.'),
    });
  }

  protected remove(review: AdminReview): void {
    this.adminService.deleteReview(review.id).subscribe({
      next: () => this.reviews.update((list) => list.filter((r) => r.id !== review.id)),
      error: () => this.error.set('Could not delete review.'),
    });
  }
}
