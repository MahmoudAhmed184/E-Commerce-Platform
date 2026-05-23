import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AlertDialogComponent } from '../../../../shared/components/alert-dialog/alert-dialog.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import type { UiReview } from '../../../../core/models/commerce-ui/commerce-ui.model';
import type { UiAction, UiMenuItem } from '../../../../shared/components/ui.types';
import { AdminService, type AdminReview } from '../../../../core/services/admin/admin.service';
import { ReviewCardComponent } from '../../../reviews/components/review-card/review-card.component';

interface AdminReviewListItem {
  review: UiReview;
  moderationActions: readonly UiMenuItem[];
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [AlertBannerComponent, AlertDialogComponent, EmptyStateComponent, ReviewCardComponent, SearchBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="grid gap-lg">
      <header class="grid gap-md lg:grid-cols-[var(--ui-layout-search-header-grid)] lg:items-end">
        <div class="grid gap-xs">
          <p class="type-label-sm text-text-muted">Admin</p>
          <h2 class="type-heading-xl text-text-primary">Review moderation</h2>
          <p class="type-body-md text-text-secondary">Moderate review visibility according to marketplace policy and product context.</p>
        </div>
        <app-search-bar
          scope="Review"
          placeholder="Search reviews"
          [query]="query()"
          [resultCount]="filteredReviews().length"
          [suggestions]="[]"
          [loading]="isLoading()"
          (queryChange)="query.set($event)"
          (cleared)="query.set('')"
        />
      </header>

      @if (statusMessage()) {
        <app-alert-banner tone="success" title="Review updated" [message]="statusMessage()" [dismissible]="true" (dismissed)="statusMessage.set('')" />
      }
      @if (errorMessage()) {
        <app-alert-banner tone="error" title="Review issue" [message]="errorMessage()" [dismissible]="true" (dismissed)="errorMessage.set('')" />
      }

      @if (!isLoading() && filteredReviews().length === 0) {
        <app-empty-state
          type="reviews"
          title="No reviews found"
          message="Clear the search or wait for new review submissions."
          [action]="{ label: 'Clear search', variant: 'secondary' }"
          (actionPressed)="query.set('')"
        />
      } @else {
        <div class="grid gap-md lg:grid-cols-2">
          @for (item of reviewItems(); track item.review.id) {
            <app-review-card
              [review]="item.review"
              [moderationActions]="item.moderationActions"
              (moderationAction)="handleModeration($event.review.id, $event.action)"
            />
          }
        </div>
      }

      <app-alert-dialog
        [open]="!!deleteReviewId()"
        title="Delete review"
        description="Delete only reviews that violate moderation policy. Hidden reviews can still be restored later."
        [destructive]="true"
        [confirmAction]="deleteConfirmAction()"
        [cancelAction]="{ label: 'Cancel', variant: 'secondary' }"
        (confirmPressed)="confirmDelete()"
        (cancelPressed)="deleteReviewId.set(null)"
        (closed)="deleteReviewId.set(null)"
      />
    </section>
  `,
})
export class AdminReviewsPage implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly reviews = signal<readonly AdminReview[]>([]);
  protected readonly query = signal('');
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly deleteReviewId = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly filteredReviews = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.reviews()
      .map(mapReview)
      .filter((review) => !query || `${review.authorName} ${review.title ?? ''} ${review.body}`.toLowerCase().includes(query));
  });
  protected readonly reviewItems = computed<readonly AdminReviewListItem[]>(() =>
    this.filteredReviews().map((review) => ({ review, moderationActions: reviewModerationActions(review) })),
  );
  protected readonly deleteConfirmAction = computed<UiAction>(() => ({ label: 'Delete review', variant: 'danger', loading: this.isSaving() }));

  ngOnInit(): void {
    this.loadReviews();
  }

  protected handleModeration(reviewId: string, action: UiMenuItem): void {
    const numericId = Number(reviewId);
    if (action.id === 'hide-review') {
      this.updateVisibility(numericId, false, 'Review hidden.');
    } else if (action.id === 'show-review') {
      this.updateVisibility(numericId, true, 'Review restored.');
    } else if (action.id === 'delete-review') {
      this.deleteReviewId.set(numericId);
    }
  }

  protected confirmDelete(): void {
    const id = this.deleteReviewId();
    if (!id) {
      return;
    }

    this.isSaving.set(true);
    this.adminService
      .deleteReview(id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteReviewId.set(null);
          this.statusMessage.set('Review deleted.');
          this.loadReviews();
        },
        error: () => this.errorMessage.set('The review could not be deleted.'),
      });
  }

  private loadReviews(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);
    this.adminService
      .getReviews({ page: 1, page_size: 100 })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => this.reviews.set(response.results),
        error: () => this.errorMessage.set('Reviews could not be loaded.'),
      });
  }

  private updateVisibility(id: number, visible: boolean, successMessage: string): void {
    this.errorMessage.set('');
    this.isSaving.set(true);
    const request = visible ? this.adminService.unhideReview(id) : this.adminService.hideReview(id);
    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.statusMessage.set(successMessage);
        this.loadReviews();
      },
      error: () => this.errorMessage.set('The review could not be updated.'),
    });
  }
}

function mapReview(review: AdminReview): UiReview {
  return {
    id: String(review.id),
    authorName: review.user_name,
    createdAt: review.created_at,
    rating: review.rating,
    title: review.product_name,
    body: nonEmptyText(review.comment, 'No written comment.'),
    moderationState: review.is_visible ? 'visible' : 'hidden',
  };
}

function reviewModerationActions(review: UiReview): readonly UiMenuItem[] {
  const hidden = review.moderationState === 'hidden';
  return [
    { id: hidden ? 'show-review' : 'hide-review', label: hidden ? 'Show review' : 'Hide review' },
    { id: 'delete-review', label: 'Delete review', destructive: true },
  ];
}

function nonEmptyText(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }

  return trimmed;
}
