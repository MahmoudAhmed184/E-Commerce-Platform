import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

export interface Review {
  id: number;
  user: string;
  user_name: string;
  product: number;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewPayload {
  product: number;
  rating: number;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly api = inject(ApiService);

  getProductReviews(productSlug: string): Observable<Review[]> {
    return this.api.get<Review[]>(`/products/${productSlug}/reviews/`);
  }

  createProductReview(productSlug: string, payload: Omit<ReviewPayload, 'product'>): Observable<Review> {
    return this.api.post<Review>(`/products/${productSlug}/reviews/`, payload);
  }

  createReview(payload: ReviewPayload): Observable<Review> {
    return this.api.post<Review>('/reviews/', payload);
  }

  updateReview(id: number, payload: Partial<ReviewPayload>): Observable<Review> {
    return this.api.patch<Review>(`/reviews/${id}/`, payload);
  }

  deleteReview(id: number): Observable<void> {
    return this.api.delete<void>(`/reviews/${id}/`);
  }
}
