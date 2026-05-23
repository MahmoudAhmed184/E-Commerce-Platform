import { Injectable, inject } from '@angular/core';
import { catchError, map, type Observable, of } from 'rxjs';

import { type Review, ReviewService } from '../../../../core/services/review/review.service';

export interface ReviewFormValue {
  rating: number;
  comment: string;
}

export type ReviewSaveResult =
  | { status: 'saved'; mode: 'created' | 'updated'; review: Review }
  | { status: 'failed'; message: string };

export type ReviewSubmitResult = ReviewSaveResult | { status: 'invalid'; message: string };

export type ReviewDeleteResult =
  | { status: 'deleted'; id: number }
  | { status: 'failed'; message: string };

@Injectable({ providedIn: 'root' })
export class ReviewWorkflowService {
  private readonly reviewService = inject(ReviewService);

  submitReview(productSlug: string, editingId: number | null, valid: boolean, value: ReviewFormValue): Observable<ReviewSubmitResult> {
    if (!valid) {
      return of({ status: 'invalid', message: 'Choose a rating.' });
    }

    return this.saveReview(productSlug, editingId, value);
  }

  saveReview(productSlug: string, editingId: number | null, value: ReviewFormValue): Observable<ReviewSaveResult> {
    const payload = toReviewPayload(value);
    const request = editingId
      ? this.reviewService.updateReview(editingId, payload)
      : this.reviewService.createProductReview(productSlug, payload);

    return request.pipe(
      map((review) => ({ status: 'saved' as const, mode: editingId ? 'updated' as const : 'created' as const, review })),
      catchError(() => of({ status: 'failed' as const, message: 'Could not save review.' })),
    );
  }

  deleteReview(id: number): Observable<ReviewDeleteResult> {
    return this.reviewService.deleteReview(id).pipe(
      map(() => ({ status: 'deleted' as const, id })),
      catchError(() => of({ status: 'failed' as const, message: 'Could not delete review.' })),
    );
  }
}

function toReviewPayload(value: ReviewFormValue): { rating: number; comment?: string } {
  const comment = value.comment.trim();
  return comment ? { rating: value.rating, comment } : { rating: value.rating };
}
