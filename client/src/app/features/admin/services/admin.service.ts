import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

export type UserStatus = 'pending_approval' | 'active' | 'restricted' | 'soft_deleted';
export type UserRole = 'customer' | 'admin';

export interface AdminUser {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface AdminOrder {
  id: number;
  order_number: string;
  customer_email: string;
  status: string;
  payment_status: string;
  total_amount: string;
  created_at: string;
}

export interface AdminReview {
  id: number;
  user_name: string;
  product_name: string;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  // Users
  getUsers(params?: { search?: string; page?: number }): Observable<PaginatedResponse<AdminUser>> {
    return this.api.get<PaginatedResponse<AdminUser>>('/admin/users/', params);
  }

  approveUser(id: string): Observable<AdminUser> {
    return this.api.patch<AdminUser>(`/admin/users/${id}/approve/`, {});
  }

  restrictUser(id: string): Observable<AdminUser> {
    return this.api.patch<AdminUser>(`/admin/users/${id}/restrict/`, {});
  }

  softDeleteUser(id: string): Observable<AdminUser> {
    return this.api.delete<AdminUser>(`/admin/users/${id}/`);
  }

  // Orders
  getOrders(params?: { page?: number }): Observable<PaginatedResponse<AdminOrder>> {
    return this.api.get<PaginatedResponse<AdminOrder>>('/admin/orders/', params);
  }

  updateOrderStatus(id: number, status: string): Observable<AdminOrder> {
    return this.api.patch<AdminOrder>(`/admin/orders/${id}/`, { status });
  }

  // Reviews moderation
  getReviews(params?: { page?: number }): Observable<PaginatedResponse<AdminReview>> {
    return this.api.get<PaginatedResponse<AdminReview>>('/admin/reviews/', params);
  }

  hideReview(id: number): Observable<AdminReview> {
    return this.api.patch<AdminReview>(`/admin/reviews/${id}/hide/`, {});
  }

  deleteReview(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/reviews/${id}/`);
  }
}
