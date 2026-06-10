import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { PaginatedResponse } from '../../../core/models/pagination.model';

export interface Review {
  id: number;
  user: string;
  user_name: string;
  product: number;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  deleted_at: string | null;
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

  getProductReviews(productSlug: string, params?: { page?: number }): Observable<PaginatedResponse<Review>> {
    return this.api.get<PaginatedResponse<Review>>(`/products/${productSlug}/reviews/`, params);
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
