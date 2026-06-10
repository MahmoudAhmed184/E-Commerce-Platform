import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { LucideEye, LucideEyeOff, LucideMessageSquareText, LucideStar } from '@lucide/angular';
import { finalize } from 'rxjs';

import { AlertDialogComponent } from '../../../../shared/components/alert-dialog/alert-dialog.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
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
  imports: [
    AlertBannerComponent,
    AlertDialogComponent,
    BadgeComponent,
    EmptyStateComponent,
    LucideEye,
    LucideEyeOff,
    LucideMessageSquareText,
    LucideStar,
    ReviewCardComponent,
    SearchBarComponent,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="admin-page">
      <header class="admin-page-header">
        <div class="admin-page-heading">
          <p class="admin-kicker">Trust and policy</p>
          <h2 class="admin-title">Review moderation</h2>
          <p class="admin-description">Moderate review visibility according to marketplace policy and product context.</p>
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

      <dl class="admin-stat-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Reviews</dt>
            <span class="admin-stat-icon" data-tone="info" aria-hidden="true">
              <svg lucideMessageSquareText class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ reviews().length }}</dd>
          <dd class="type-body-sm text-text-secondary">Loaded submissions</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Visible</dt>
            <span class="admin-stat-icon" data-tone="success" aria-hidden="true">
              <svg lucideEye class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ visibleReviewCount() }}</dd>
          <dd class="type-body-sm text-text-secondary">Shown on product pages</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Hidden</dt>
            <span class="admin-stat-icon" data-tone="warning" aria-hidden="true">
              <svg lucideEyeOff class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ hiddenReviewCount() }}</dd>
          <dd class="type-body-sm text-text-secondary">Held from customers</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Average rating</dt>
            <span class="admin-stat-icon" data-tone="info" aria-hidden="true">
              <svg lucideStar class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ averageRating() }}</dd>
          <dd class="type-body-sm text-text-secondary">Across loaded reviews</dd>
        </div>
      </dl>

      @if (statusMessage()) {
        <app-alert-banner tone="success" [title]="'Review updated'" [message]="statusMessage()" [dismissible]="true" (dismissed)="statusMessage.set('')" />
      }
      @if (errorMessage()) {
        <app-alert-banner tone="error" [title]="'Review issue'" [message]="errorMessage()" [dismissible]="true" (dismissed)="errorMessage.set('')" />
      }

      @if (!isLoading() && filteredReviews().length === 0) {
        <app-empty-state
          type="reviews"
          [title]="'No reviews found'"
          message="Clear the search or wait for new review submissions."
          [action]="{ label: 'Clear search', variant: 'secondary' }"
          (actionPressed)="query.set('')"
        />
      } @else if (isLoading()) {
        <section class="admin-panel admin-panel-body" aria-label="Loading reviews">
          <app-skeleton-loader shape="block" [count]="6" label="Loading reviews" />
        </section>
      } @else {
        <section class="admin-panel" aria-labelledby="reviews-list-title">
          <div class="admin-panel-header">
            <div>
              <h3 id="reviews-list-title" class="admin-panel-title">Moderation queue</h3>
              <p class="admin-panel-copy">Review cards preserve customer context while exposing hide, restore, and delete actions.</p>
            </div>
            <app-badge tone="info" [label]="filteredReviews().length + ' reviews'" />
          </div>
          <div class="admin-panel-body grid gap-md lg:grid-cols-2">
            @for (item of reviewItems(); track item.review.id) {
              <app-review-card
                [review]="item.review"
                [moderationActions]="item.moderationActions"
                (moderationAction)="handleModeration($event.review.id, $event.action)"
              />
            }
          </div>
        </section>
      }

      <app-alert-dialog
        [open]="!!deleteReviewId()"
        [title]="'Delete review'"
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
  protected readonly visibleReviewCount = computed(() => this.reviews().filter((review) => review.is_visible).length);
  protected readonly hiddenReviewCount = computed(() => this.reviews().filter((review) => !review.is_visible).length);
  protected readonly averageRating = computed(() => {
    const reviews = this.reviews();
    if (!reviews.length) {
      return '0.0';
    }

    return (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1);
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
