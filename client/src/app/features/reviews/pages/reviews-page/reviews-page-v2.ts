import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { ReviewService, Review } from '../../services/review.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { RatingWidgetComponent } from '../../../../shared/components/rating-widget/rating-widget.component';
import { ProductService, Product } from '../../../products/services/product';

type ReviewForm = FormGroup<{
  rating: FormControl<number>;
  comment: FormControl<string>;
}>;

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [DecimalPipe, SlicePipe, ReactiveFormsModule, LoadingSpinnerComponent, ErrorMessageComponent, RatingWidgetComponent, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 class="text-3xl font-bold text-slate-950 tracking-tight">Reviews</h1>
        <a routerLink="/products/{{ productSlug }}" class="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
          &larr; Back to product
        </a>
      </div>

      <div class="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Sidebar: Summary & Form -->
        <aside class="lg:col-span-4 space-y-6">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-900">Summary</h2>
            <div class="mt-4 flex items-center gap-4">
              <span class="text-5xl font-bold text-slate-950">{{ (product()?.average_rating ?? 0) | number:'1.1-1' }}</span>
              <div>
                <app-rating-widget [rating]="product()?.average_rating ?? 0" size="sm" />
                <p class="text-sm text-slate-500 mt-1">{{ product()?.review_count ?? 0 }} reviews</p>
              </div>
            </div>
          </div>

          <!-- Submit review -->
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-900">
              {{ editingId() ? 'Update your review' : 'Share your thoughts' }}
            </h2>
            
            @if (authService.isLoggedIn()) {
              @if (product()?.user_has_ordered || editingId()) {
                <form class="mt-6 space-y-5" [formGroup]="form" (ngSubmit)="submitReview()" novalidate>
                  <app-error-message [message]="formError()" />

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                    <app-rating-widget 
                      [rating]="form.controls.rating.value" 
                      [readonly]="false" 
                      size="lg"
                      (rate)="form.controls.rating.setValue($event)" />
                  </div>

                  <div>
                    <label for="comment" class="block text-sm font-medium text-slate-700">Comment (optional)</label>
                    <textarea id="comment" rows="4" formControlName="comment"
                      placeholder="What did you like or dislike?"
                      class="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"></textarea>
                  </div>

                  <div class="flex gap-3">
                    <button type="submit"
                      class="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all disabled:opacity-70"
                      [disabled]="submitting()">
                      @if (submitting()) { <app-loading-spinner size="sm" /> }
                      {{ editingId() ? 'Update' : 'Post Review' }}
                    </button>
                    @if (editingId()) {
                      <button type="button" (click)="cancelEdit()"
                        class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancel
                      </button>
                    }
                  </div>
                </form>
              } @else {
                <div class="mt-6 rounded-xl bg-amber-50 p-4 border border-dashed border-amber-300">
                  <p class="text-sm font-medium text-amber-800 text-center">
                    You can only review products that you have purchased.
                  </p>
                </div>
              }
            } @else {
              <div class="mt-6 rounded-xl bg-slate-50 p-4 border border-dashed border-slate-300">
                <p class="text-sm text-slate-600 text-center">
                  <a routerLink="/auth/login" class="font-semibold text-indigo-600 hover:underline">Log in</a> 
                  to share your experience with this product.
                </p>
              </div>
            }
          </div>
        </aside>

        <!-- Main Content: Reviews List -->
        <main class="lg:col-span-8">
          @if (isLoading()) {
            <div class="flex flex-col items-center justify-center py-20">
              <app-loading-spinner size="md" />
              <p class="mt-4 text-sm text-slate-500 animate-pulse">Fetching reviews...</p>
            </div>
          } @else if (loadError()) {
            <app-error-message [message]="loadError()" />
          } @else if (reviews().length === 0) {
            <div class="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <div class="text-4xl text-slate-300 mb-4">💬</div>
              <p class="text-lg font-medium text-slate-900">No reviews yet</p>
              <p class="text-sm text-slate-500">Be the first to review this product!</p>
            </div>
          } @else {
            <div class="space-y-6">
              @for (review of reviews(); track review.id) {
                <div class="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <div class="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                        {{ review.user_name.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <p class="font-semibold text-slate-900">{{ review.user_name }}</p>
                        <app-rating-widget [rating]="review.rating" size="sm" />
                      </div>
                    </div>
                    <time class="text-xs font-medium text-slate-400">{{ review.created_at | slice:0:10 }}</time>
                  </div>

                  @if (review.comment) {
                    <p class="mt-4 text-slate-700 leading-relaxed">{{ review.comment }}</p>
                  }

                  @if (authService.currentUser()?.id === review.user) {
                    <div class="mt-6 flex gap-4 text-sm border-t border-slate-50 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" (click)="startEdit(review)"
                        class="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2 2 0 112.828 2.828l-7.071 7.071-4.142 1.414 1.414-4.142 7.071-7.071z" /></svg>
                        Edit
                      </button>
                      <button type="button" (click)="deleteReview(review)"
                        class="inline-flex items-center gap-1.5 font-semibold text-red-500 hover:text-red-700 transition-colors">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </main>
      </div>
    </section>
  `,
})
export class ReviewsPage implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly reviewService = inject(ReviewService);
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly reviews = signal<Review[]>([]);
  protected readonly product = signal<Product | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly loadError = signal('');
  protected readonly submitting = signal(false);
  protected readonly formError = signal('');
  protected readonly editingId = signal<number | null>(null);

  protected readonly form: ReviewForm = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: [''],
  });

  protected productSlug = '';

  ngOnInit(): void {
    this.productSlug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.loadProduct();
    this.loadReviews();
  }

  private loadProduct(): void {
    this.productService.getProduct(this.productSlug).subscribe({
      next: (p) => this.product.set(p),
    });
  }

  private loadReviews(): void {
    this.isLoading.set(true);
    this.reviewService
      .getProductReviews(this.productSlug)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.reviews.set(res.results),
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
      next: () => { 
        this.cancelEdit(); 
        this.loadReviews(); 
        this.loadProduct(); // Refresh aggregates
      },
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
      next: () => {
        this.reviews.update((list) => list.filter((r) => r.id !== review.id));
        this.loadReviews();
        this.loadProduct(); // Refresh aggregates
      },
      error: () => this.loadError.set('Could not delete review.'),
    });
  }
}
