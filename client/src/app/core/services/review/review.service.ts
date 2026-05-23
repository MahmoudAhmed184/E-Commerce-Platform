import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import type { PaginatedResponse } from '../../models/pagination/pagination.model';
import {
  parseBooleanField,
  parseNullableStringField,
  parseNumberField,
  parsePaginatedResponse,
  parseRecord,
  parseStringField,
} from '../../models/runtime-validation/runtime-validation';
import { ApiService } from '../api/api.service';

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

  getProductReviews(
    productSlug: string,
    params?: { page?: number; page_size?: number },
  ): Observable<PaginatedResponse<Review>> {
    return this.api
      .get<unknown>(`/products/${productSlug}/reviews/`, params)
      .pipe(map((response) => parsePaginatedResponse(response, (item) => parseReview(item, 'review list item'), 'review list')));
  }

  createProductReview(productSlug: string, payload: Omit<ReviewPayload, 'product'>): Observable<Review> {
    return this.api.post<unknown>(`/products/${productSlug}/reviews/`, payload).pipe(map((response) => parseReview(response, 'review')));
  }

  updateReview(id: number, payload: Partial<ReviewPayload>): Observable<Review> {
    return this.api.patch<unknown>(`/reviews/${id}/`, payload).pipe(map((response) => parseReview(response, 'review')));
  }

  deleteReview(id: number): Observable<void> {
    return this.api.delete<void>(`/reviews/${id}/`);
  }
}

function parseReview(value: unknown, context: string): Review {
  const record = parseRecord(value, context);

  return {
    id: parseNumberField(record, 'id', context),
    user: parseStringField(record, 'user', context),
    user_name: parseStringField(record, 'user_name', context),
    product: parseNumberField(record, 'product', context),
    rating: parseNumberField(record, 'rating', context),
    comment: parseNullableStringField(record, 'comment', context),
    is_visible: parseBooleanField(record, 'is_visible', context),
    created_at: parseStringField(record, 'created_at', context),
    updated_at: parseStringField(record, 'updated_at', context),
  };
}
