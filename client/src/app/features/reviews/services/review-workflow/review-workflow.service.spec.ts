import { TestBed } from '@angular/core/testing';
import { firstValueFrom, type Observable, of, throwError } from 'rxjs';

import { type Review, ReviewService } from '../../../../core/services/review/review.service';
import { ReviewWorkflowService } from './review-workflow.service';

class ReviewServiceStub {
  readonly created: { productSlug: string; payload: { rating: number; comment?: string } }[] = [];
  readonly updated: { id: number; payload: { rating: number; comment?: string } }[] = [];
  readonly deleted: number[] = [];
  saveResponse: Observable<Review> = of(reviewFixture);
  deleteResponse: Observable<void> = of(undefined);

  createProductReview(productSlug: string, payload: { rating: number; comment?: string }): Observable<Review> {
    this.created.push({ productSlug, payload });
    return this.saveResponse;
  }

  updateReview(id: number, payload: { rating: number; comment?: string }): Observable<Review> {
    this.updated.push({ id, payload });
    return this.saveResponse;
  }

  deleteReview(id: number): Observable<void> {
    this.deleted.push(id);
    return this.deleteResponse;
  }
}

const reviewFixture: Review = {
  id: 9,
  user: 'usr-1',
  user_name: 'Buyer',
  product: 4,
  rating: 5,
  comment: 'Reliable.',
  is_visible: true,
  created_at: '2026-05-19T00:00:00Z',
  updated_at: '2026-05-19T00:00:00Z',
};

describe('ReviewWorkflowService', () => {
  let reviewService: ReviewServiceStub;
  let service: ReviewWorkflowService;

  beforeEach(() => {
    reviewService = new ReviewServiceStub();

    TestBed.configureTestingModule({
      providers: [ReviewWorkflowService, { provide: ReviewService, useValue: reviewService }],
    });

    service = TestBed.inject(ReviewWorkflowService);
  });

  it('creates reviews with trimmed comments', async () => {
    const result = await firstValueFrom(service.saveReview('product-slug', null, { rating: 5, comment: '  Reliable. ' }));

    expect(result).toEqual({ status: 'saved', mode: 'created', review: reviewFixture });
    expect(reviewService.created).toEqual([{ productSlug: 'product-slug', payload: { rating: 5, comment: 'Reliable.' } }]);
  });

  it('updates existing reviews', async () => {
    const result = await firstValueFrom(service.saveReview('product-slug', 9, { rating: 4, comment: '' }));

    expect(result).toEqual({ status: 'saved', mode: 'updated', review: reviewFixture });
    expect(reviewService.updated).toEqual([{ id: 9, payload: { rating: 4 } }]);
  });

  it('normalizes save failures', async () => {
    reviewService.saveResponse = throwError(() => new Error('save failed'));

    const result = await firstValueFrom(service.saveReview('product-slug', null, { rating: 5, comment: '' }));

    expect(result).toEqual({ status: 'failed', message: 'Could not save review.' });
  });

  it('rejects invalid review submissions before persistence', async () => {
    const result = await firstValueFrom(service.submitReview('product-slug', null, false, { rating: 0, comment: '' }));

    expect(result).toEqual({ status: 'invalid', message: 'Choose a rating.' });
    expect(reviewService.created).toEqual([]);
  });

  it('deletes reviews by id', async () => {
    const result = await firstValueFrom(service.deleteReview(9));

    expect(result).toEqual({ status: 'deleted', id: 9 });
    expect(reviewService.deleted).toEqual([9]);
  });
});
