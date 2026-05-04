import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

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
  imports: [SlicePipe, ReactiveFormsModule, LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-3xl px-4 py-10">
      <h1 class="text-2xl font-semibold text-slate-950">Product Reviews</h1>

      <!-- Submit review (auth only) -->
      @if (authService.isLoggedIn()) {
        <div class="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-base font-semibold text-slate-800">
            {{ editingId() ? 'Edit Review' : 'Write a Review' }}
          </h2>
          <form class="mt-4 space-y-4" [formGroup]="form" (ngSubmit)="submitReview()" novalidate>
            <app-error-message [message]="formError()" />

            <!-- Star rating -->
            <div>
              <span class="block text-sm font-medium text-slate-700 mb-2">Rating</span>
              <div class="flex gap-1">
                @for (star of stars; track star) {
                  <button type="button"
                    class="text-2xl transition-colors"
                    [class.text-amber-400]="star <= form.controls.rating.value"
                    [class.text-slate-300]="star > form.controls.rating.value"
                    (click)="form.controls.rating.setValue(star)"
                    [attr.aria-label]="star + ' stars'">★</button>
                }
              </div>
            </div>

            <div>
              <label for="comment" class="block text-sm font-medium text-slate-700">Comment (optional)</label>
              <textarea id="comment" rows="3" formControlName="comment"
                class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
            </div>

            <div class="flex gap-3">
              <button type="submit"
                class="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-70"
                [disabled]="submitting()">
                @if (submitting()) { <app-loading-spinner size="sm" /> }
                {{ editingId() ? 'Update' : 'Submit' }}
              </button>
              @if (editingId()) {
                <button type="button" (click)="cancelEdit()"
                  class="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              }
            </div>
          </form>
        </div>
      }

      <!-- Reviews list -->
      <div class="mt-8">
        @if (isLoading()) {
          <div class="flex justify-center py-10"><app-loading-spinner size="md" /></div>
        } @else if (loadError()) {
          <app-error-message [message]="loadError()" />
        } @else if (reviews().length === 0) {
          <p class="text-center text-slate-500 py-10">No reviews yet. Be the first!</p>
        } @else {
          <div class="space-y-4">
            @for (review of reviews(); track review.id) {
              <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="font-medium text-slate-900">{{ review.user_name }}</p>
                    <div class="mt-1 flex gap-0.5 text-amber-400 text-lg">
                      @for (star of stars; track star) {
                        <span [class.text-slate-200]="star > review.rating">★</span>
                      }
                    </div>
                  </div>
                  <p class="text-xs text-slate-400">{{ review.created_at | slice:0:10 }}</p>
                </div>
                @if (review.comment) {
                  <p class="mt-3 text-sm text-slate-700">{{ review.comment }}</p>
                }
                @if (authService.currentUser()?.id === review.user) {
                  <div class="mt-4 flex gap-3 text-sm">
                    <button type="button" (click)="startEdit(review)"
                      class="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                    <button type="button" (click)="deleteReview(review)"
                      class="text-red-500 hover:text-red-700 font-medium">Delete</button>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class ReviewsPage implements OnInit {
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

  protected readonly stars = [1, 2, 3, 4, 5];

  protected readonly form: ReviewForm = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: [''],
  });

  private productSlug = '';

  ngOnInit(): void {
    this.productSlug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.loadReviews();
  }

  private loadReviews(): void {
    this.isLoading.set(true);
    this.reviewService
      .getProductReviews(this.productSlug)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (r) => this.reviews.set(r),
        error: () => this.loadError.set('Could not load reviews.'),
      });
  }

  protected submitReview(): void {
    this.formError.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const { rating, comment } = this.form.getRawValue();
    this.submitting.set(true);

    const id = this.editingId();
    const req = id
      ? this.reviewService.updateReview(id, { rating, comment: comment || undefined })
      : this.reviewService.createProductReview(this.productSlug, { rating, comment: comment || undefined });

    req.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => { this.cancelEdit(); this.loadReviews(); },
      error: () => this.formError.set('Could not save review. Please try again.'),
    });
  }

  protected startEdit(review: Review): void {
    this.editingId.set(review.id);
    this.form.setValue({ rating: review.rating, comment: review.comment ?? '' });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ rating: 5, comment: '' });
  }

  protected deleteReview(review: Review): void {
    this.reviewService.deleteReview(review.id).subscribe({
      next: () => this.reviews.update((list) => list.filter((r) => r.id !== review.id)),
      error: () => this.loadError.set('Could not delete review.'),
    });
  }
}
