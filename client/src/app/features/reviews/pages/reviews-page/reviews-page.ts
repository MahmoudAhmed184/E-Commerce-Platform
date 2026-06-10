import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import type { AppError } from '../../../../core/interceptors/error.interceptor';
import { AuthService } from '../../../../core/services/auth.service';
import { ReviewService, Review } from '../../services/review.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

type ReviewForm = FormGroup<{
  rating: FormControl<number>;
  comment: FormControl<string>;
}>;

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [SlicePipe, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    .reviews-section {
      max-width: 900px;
      margin: 72px auto 0;
      padding: 56px 0 0;
      border-top: 1px solid rgba(255,255,255,0.08);
    }

    .reviews-heading {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 28px;
    }

    .eyebrow {
      margin-bottom: 8px;
      color: var(--color-amber);
      font-family: var(--font-mono);
      font-size: 0.68rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    h2 {
      color: var(--color-ivory);
      font-family: var(--font-display);
      font-size: 2rem;
      font-style: italic;
      line-height: 1.1;
    }

    .review-total {
      color: var(--color-ivory-ghost);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .review-form-card,
    .review-card,
    .guest-prompt,
    .empty-reviews {
      background: var(--color-carbon);
      border: 1px solid var(--color-charcoal);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
    }

    .review-form-card {
      margin-bottom: 28px;
      padding: 24px;
    }

    .form-title {
      margin-bottom: 20px;
      color: var(--color-ivory);
      font-size: 1rem;
    }

    .form-field + .form-field {
      margin-top: 20px;
    }

    .rating-buttons {
      display: flex;
      gap: 4px;
    }

    .star-button {
      padding: 2px;
      background: none;
      border: 0;
      color: var(--color-muted);
      cursor: pointer;
      font-size: 1.8rem;
      line-height: 1;
      transition: color 0.2s, transform 0.2s;
    }

    .star-button.selected {
      color: var(--color-amber-light);
    }

    .star-button:hover {
      color: var(--color-amber);
      transform: translateY(-1px);
    }

    textarea {
      min-height: 110px;
      resize: vertical;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 22px;
    }

    .guest-prompt,
    .empty-reviews {
      padding: 24px;
      color: var(--color-ivory-dim);
      text-align: center;
    }

    .guest-prompt {
      margin-bottom: 28px;
    }

    .guest-prompt a {
      color: var(--color-amber-light);
      font-weight: 700;
      text-decoration: none;
    }

    .reviews-list {
      display: grid;
      gap: 16px;
    }

    .review-card {
      padding: 22px 24px;
    }

    .review-header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 20px;
    }

    .reviewer-name {
      color: var(--color-ivory);
      font-weight: 700;
    }

    .review-stars {
      margin-top: 4px;
      color: var(--color-amber-light);
      letter-spacing: 2px;
    }

    .review-stars .empty {
      color: var(--color-muted);
    }

    .review-date {
      color: var(--color-ivory-ghost);
      font-family: var(--font-mono);
      font-size: 0.68rem;
    }

    .review-comment {
      margin-top: 14px;
      color: var(--color-ivory-dim);
      line-height: 1.7;
      white-space: pre-wrap;
    }

    .review-actions {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }

    .text-button {
      padding: 0;
      background: none;
      border: 0;
      color: var(--color-amber-light);
      cursor: pointer;
      font-weight: 700;
    }

    .text-button.danger {
      color: #f0a8a8;
    }

    .loading-reviews {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    @media (max-width: 600px) {
      .reviews-section {
        margin-top: 48px;
        padding-top: 40px;
      }

      .reviews-heading {
        align-items: start;
        flex-direction: column;
        gap: 8px;
      }

      .review-header {
        flex-direction: column;
        gap: 8px;
      }
    }
  `],
  template: `
    <section id="product-reviews" class="reviews-section">
      <div class="reviews-heading">
        <div>
          <p class="eyebrow">Customer feedback</p>
          <h2>Product Reviews</h2>
        </div>
        <p class="review-total">{{ reviews().length }} review{{ reviews().length === 1 ? '' : 's' }}</p>
      </div>

      @if (authService.isLoggedIn()) {
        <div class="review-form-card">
          <h3 class="form-title">
            {{ editingId() || ownReview() ? 'Update Your Review' : 'Write a Review' }}
          </h3>
          <form [formGroup]="form" (ngSubmit)="submitReview()" novalidate>
            <app-error-message [message]="formError()" />

            <div class="form-field">
              <span class="sc-label">Rating</span>
              <div class="rating-buttons">
                @for (star of stars; track star) {
                  <button
                    type="button"
                    class="star-button"
                    [class.selected]="star <= form.controls.rating.value"
                    (click)="form.controls.rating.setValue(star)"
                    [attr.aria-label]="star + ' stars'"
                  >★</button>
                }
              </div>
            </div>

            <div class="form-field">
              <label for="comment" class="sc-label">Comment (optional)</label>
              <textarea id="comment" class="sc-input" rows="3" formControlName="comment"></textarea>
            </div>

            <div class="form-actions">
              <button id="review-submit-btn" type="submit" class="sc-btn-primary" [disabled]="submitting()">
                @if (submitting()) { <app-loading-spinner size="sm" /> }
                {{ editingId() || ownReview() ? 'Update Review' : 'Submit Review' }}
              </button>
              @if (editingId()) {
                <button type="button" class="sc-btn-ghost" (click)="cancelEdit()">
                  Cancel
                </button>
              }
            </div>
          </form>
        </div>
      } @else {
        <div class="guest-prompt">
          <a routerLink="/auth/login">Sign in</a> to write a review for this product.
        </div>
      }

      @if (isLoading()) {
        <div class="loading-reviews"><app-loading-spinner size="md" /></div>
      } @else if (loadError()) {
        <app-error-message [message]="loadError()" />
      } @else if (reviews().length === 0) {
        <div class="empty-reviews">No reviews yet. Be the first to review this product.</div>
      } @else {
        <div class="reviews-list">
          @for (review of reviews(); track review.id) {
            <article class="review-card">
              <div class="review-header">
                <div>
                  <p class="reviewer-name">{{ review.user_name }}</p>
                  <div class="review-stars" [attr.aria-label]="review.rating + ' out of 5 stars'">
                    @for (star of stars; track star) {
                      <span [class.empty]="star > review.rating">★</span>
                    }
                  </div>
                </div>
                <p class="review-date">{{ review.created_at | slice:0:10 }}</p>
              </div>
              @if (review.comment) {
                <p class="review-comment">{{ review.comment }}</p>
              }
              @if (authService.currentUser()?.id === review.user) {
                <div class="review-actions">
                  <button type="button" class="text-button" (click)="startEdit(review)">Edit</button>
                  <button type="button" class="text-button danger" (click)="deleteReview(review)">Delete</button>
                </div>
              }
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class ReviewsPage implements OnInit {
  readonly productSlug = input('');

  protected readonly authService = inject(AuthService);
  private readonly reviewService = inject(ReviewService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly reviews = signal<Review[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly loadError = signal('');
  protected readonly submitting = signal(false);
  protected readonly formError = signal('');
  protected readonly editingId = signal<number | null>(null);
  protected readonly ownReview = computed(
    () => this.reviews().find((review) => review.user === this.authService.currentUser()?.id) ?? null,
  );

  protected readonly stars = [1, 2, 3, 4, 5];

  protected readonly form: ReviewForm = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: [''],
  });

  private resolvedProductSlug = '';

  ngOnInit(): void {
    this.resolvedProductSlug = this.productSlug() || this.route.snapshot.paramMap.get('slug') || '';
    this.loadReviews();
  }

  private loadReviews(): void {
    this.isLoading.set(true);
    this.reviewService
      .getProductReviews(this.resolvedProductSlug)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (reviews) => {
          this.reviews.set(reviews);
          const ownReview = reviews.find(
            (review) => review.user === this.authService.currentUser()?.id,
          );

          if (ownReview && this.editingId() === null) {
            this.form.setValue({
              rating: ownReview.rating,
              comment: ownReview.comment ?? '',
            });
          }
        },
        error: (error: unknown) => {
          this.loadError.set(isAppError(error) ? error.message : 'Could not load reviews.');
        },
      });
  }

  protected submitReview(): void {
    this.formError.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const { rating, comment } = this.form.getRawValue();
    this.submitting.set(true);

    const id = this.editingId() ?? this.ownReview()?.id;
    const req = id
      ? this.reviewService.updateReview(id, { rating, comment: comment || undefined })
      : this.reviewService.createProductReview(this.resolvedProductSlug, { rating, comment: comment || undefined });

    req.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => { this.cancelEdit(); this.loadReviews(); },
      error: (error: unknown) => {
        this.formError.set(isAppError(error) ? error.message : 'Could not save review. Please try again.');
      },
    });
  }

  protected startEdit(review: Review): void {
    this.editingId.set(review.id);
    this.form.setValue({ rating: review.rating, comment: review.comment ?? '' });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    const ownReview = this.ownReview();
    this.form.reset({
      rating: ownReview?.rating ?? 5,
      comment: ownReview?.comment ?? '',
    });
  }

  protected deleteReview(review: Review): void {
    this.reviewService.deleteReview(review.id).subscribe({
      next: () => {
        this.reviews.update((list) => list.filter((item) => item.id !== review.id));
        this.editingId.set(null);
        this.form.reset({ rating: 5, comment: '' });
      },
      error: () => this.loadError.set('Could not delete review.'),
    });
  }
}

function isAppError(error: unknown): error is AppError {
  return !!error && typeof error === 'object' && 'status' in error && 'message' in error;
}
