import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { ReviewService, Review } from './review.service';

const mockReview: Review = {
  id: 1,
  user: 'u1',
  user_name: 'Test User',
  product: 101,
  rating: 4,
  comment: 'Great!',
  is_visible: true,
  deleted_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('ReviewService', () => {
  let service: ReviewService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ReviewService],
    });

    service = TestBed.inject(ReviewService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gets product reviews', () => {
    service.getProductReviews('cool-product').subscribe((reviews) => {
      expect(reviews).toEqual([mockReview]);
    });

    const req = http.expectOne(`${environment.apiBaseUrl}/products/cool-product/reviews/`);
    expect(req.request.method).toBe('GET');
    req.flush([mockReview]);
  });

  it('creates product review', () => {
    const payload = { rating: 5, comment: 'Awesome' };
    service.createProductReview('cool-product', payload).subscribe((review) => {
      expect(review).toEqual(mockReview);
    });

    const req = http.expectOne(`${environment.apiBaseUrl}/products/cool-product/reviews/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockReview);
  });

  it('updates a review', () => {
    const payload = { rating: 3 };
    service.updateReview(1, payload).subscribe((review) => {
      expect(review).toEqual(mockReview);
    });

    const req = http.expectOne(`${environment.apiBaseUrl}/reviews/1/`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush(mockReview);
  });

  it('deletes a review', () => {
    service.deleteReview(1).subscribe();

    const req = http.expectOne(`${environment.apiBaseUrl}/reviews/1/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
