import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule, type ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { AlertDialogComponent } from '../../../../shared/components/alert-dialog/alert-dialog.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import type { UiReview } from '../../../../core/models/commerce-ui/commerce-ui.model';
import type { UiAction } from '../../../../shared/components/ui.types';
import { ReviewService, type Review } from '../../../../core/services/review/review.service';
import { ReviewCardComponent } from '../../components/review-card/review-card.component';
import { ReviewWorkflowService, type ReviewDeleteResult, type ReviewSubmitResult } from '../../services/review-workflow/review-workflow.service';

type ReviewForm = FormGroup<{
  rating: FormControl<number>;
  comment: FormControl<string>;
}>;

const requiredValidator: ValidatorFn = (control) => Validators.required(control);

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [
    AlertDialogComponent,
    AlertBannerComponent,
    ButtonComponent,
    EmptyStateComponent,
    ReactiveFormsModule,
    ReviewCardComponent,
    SkeletonLoaderComponent,
    StarRatingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-surface-page">
      <div class="mx-auto grid max-w-[var(--ui-container-md)] gap-lg px-gutter-xs py-xl md:px-gutter-sm">
        <header class="grid gap-xs">
          <p class="type-label-sm text-text-muted">Reviews</p>
          <h1 class="type-heading-xl text-text-primary">Product reviews</h1>
          <p class="type-body-md text-text-secondary">Read customer feedback or add your own review after signing in.</p>
        </header>

        @if (authService.isLoggedIn()) {
          <section class="grid gap-md rounded-md border-hairline border-border-default bg-surface-raised p-md shadow-xs" aria-labelledby="review-form-title">
            <h2 id="review-form-title" class="type-heading-lg text-text-primary">{{ formMode().title }}</h2>
            <form class="grid gap-md" [formGroup]="form" (ngSubmit)="submitReview()" novalidate>
              @if (formError()) {
                <app-alert-banner tone="error" title="Review could not be saved" [message]="formError()" />
              }

              <app-star-rating
                label="Rating"
                [readonly]="false"
                [value]="form.controls.rating.value"
                [error]="ratingError"
                (valueChange)="form.controls.rating.setValue($event)"
              />

              <label class="grid gap-xs type-label-md text-text-primary">
                Comment
                <textarea
                  class="min-h-28 w-full rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs type-body-sm text-text-primary shadow-xs interactive-transition placeholder:text-text-muted focus-visible:border-border-focus focus-visible:focus-ring disabled:state-disabled"
                  formControlName="comment"
                ></textarea>
              </label>

              <div class="flex flex-wrap gap-sm">
                <app-button type="submit" [loading]="submitting()">{{ formMode().submitLabel }}</app-button>
                @if (editingId()) {
                  <app-button variant="secondary" (pressed)="cancelEdit()">Cancel</app-button>
                }
              </div>
            </form>
          </section>
        }

        <section class="grid gap-md" aria-live="polite">
          @if (isLoading()) {
            <div class="grid gap-md" aria-label="Loading reviews">
              <app-skeleton-loader [rows]="3" label="Loading review" />
              <app-skeleton-loader [rows]="3" label="Loading review" />
            </div>
          } @else if (loadError()) {
            <app-alert-banner tone="error" title="Reviews could not load" [message]="loadError()" />
          } @else if (uiReviews().length === 0) {
            <app-empty-state
              type="reviews"
              title="No reviews yet"
              message="There are no visible reviews for this product."
              [action]="{ label: 'Refresh reviews', variant: 'secondary' }"
              (actionPressed)="loadReviews()"
            />
          } @else {
            <div class="grid gap-md">
	              @for (review of uiReviews(); track review.id) {
	                <app-review-card
	                  [review]="review"
	                  [canEdit]="!!review.owner"
	                  [canDelete]="!!review.owner"
	                  (edit)="startEdit($event)"
	                  (delete)="requestDelete($event)"
	                />
              }
            </div>
          }
        </section>
      </div>

      <app-alert-dialog
        [open]="!!deleteId()"
        title="Delete review"
        description="This removes your review from the product page."
        [destructive]="true"
        [confirmAction]="deleteConfirmAction()"
        [cancelAction]="{ label: 'Cancel', variant: 'secondary' }"
        (confirmPressed)="deleteReview()"
        (cancelPressed)="deleteId.set(null)"
        (closed)="deleteId.set(null)"
      />
    </main>
  `,
})
export class ReviewsPage implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly reviewService = inject(ReviewService);
  private readonly reviewWorkflow = inject(ReviewWorkflowService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly reviews = signal<Review[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly loadError = signal('');
  protected readonly submitting = signal(false);
  protected readonly formError = signal('');
  protected readonly editingId = signal<number | null>(null);
  protected readonly deleteId = signal<number | null>(null);
  protected readonly uiReviews = computed(() => this.reviews().map((review) => toUiReview(review, this.authService.currentUser()?.id)));
  protected readonly formMode = computed(() =>
    this.editingId() ? { title: 'Edit review', submitLabel: 'Update review' } : { title: 'Write a review', submitLabel: 'Submit review' },
  );
  protected readonly deleteConfirmAction = computed<UiAction>(() => ({ label: 'Delete review', variant: 'danger', loading: this.submitting() }));

  protected readonly form: ReviewForm = this.fb.group({
    rating: [5, [requiredValidator, Validators.min(1), Validators.max(5)]],
    comment: [''],
  });

  private productSlug = '';

  protected get ratingError(): string | null {
    return this.form.controls.rating.invalid && this.form.controls.rating.touched ? 'Choose a rating.' : null;
  }

  ngOnInit(): void {
    this.productSlug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.loadReviews();
  }

  protected loadReviews(): void {
    this.loadError.set('');
    this.isLoading.set(true);
    this.reviewService
      .getProductReviews(this.productSlug)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => this.reviews.set(response.results),
        error: () => this.loadError.set('Could not load reviews.'),
      });
  }

  protected submitReview(): void {
    this.formError.set('');
    this.submitting.set(true);
    this.reviewWorkflow
      .submitReview(this.productSlug, this.editingId(), this.form.valid, this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe((result) => this.applyReviewSave(result));
  }

  protected startEdit(review: UiReview): void {
    const existing = this.reviews().find((item) => String(item.id) === review.id);
    if (!existing) {
      return;
    }
    this.editingId.set(existing.id);
    this.form.setValue({
      rating: existing.rating,
      comment: existing.comment ?? '',
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ rating: 5, comment: '' });
  }

  protected requestDelete(review: UiReview): void {
    this.deleteId.set(Number(review.id));
  }

  protected deleteReview(): void {
    const id = this.deleteId();
    if (!id) {
      return;
    }

    this.submitting.set(true);
    this.reviewWorkflow
      .deleteReview(id)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe((result) => this.applyReviewDelete(result));
  }

  private applyReviewSave(result: ReviewSubmitResult): void {
    if (result.status === 'invalid') {
      this.form.markAllAsTouched();
      this.formError.set(result.message);
      return;
    }
    if (result.status === 'failed') {
      this.formError.set(result.message);
      return;
    }

    this.reviews.update((reviews) =>
      result.mode === 'updated' ? reviews.map((item) => (item.id === result.review.id ? result.review : item)) : [result.review, ...reviews],
    );
    this.cancelEdit();
  }

  private applyReviewDelete(result: ReviewDeleteResult): void {
    if (result.status === 'failed') {
      this.formError.set(result.message);
      return;
    }

    this.reviews.update((reviews) => reviews.filter((review) => review.id !== result.id));
    this.deleteId.set(null);
  }
}

function toUiReview(review: Review, currentUserId: string | undefined): UiReview {
  return {
    id: String(review.id),
    authorName: review.user_name,
    createdAt: review.created_at,
    rating: review.rating,
    body: review.comment ?? 'No written comment.',
    moderationState: review.is_visible ? 'visible' : 'hidden',
    owner: currentUserId === review.user,
  };
}
