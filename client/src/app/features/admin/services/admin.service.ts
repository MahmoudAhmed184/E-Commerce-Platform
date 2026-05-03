import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

export type UserStatus = 'pending_approval' | 'active' | 'restricted' | 'soft_deleted';
export type UserRole = 'customer' | 'admin';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cod_pending';
export type PaymentMethod = 'card' | 'cod' | 'wallet';

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

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  stock_quantity: number;
  availability: 'in_stock' | 'out_of_stock';
  is_active: boolean;
  category_name: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  product_count: number;
}

export interface AdminCategoryPayload {
  name: string;
  description?: string;
}

export interface AdminPayment {
  id: number;
  order_number: string;
  customer_email: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider_reference: string | null;
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

  // Products
  getAdminProducts(params?: { page?: number }): Observable<PaginatedResponse<AdminProduct>> {
    return this.api.get<PaginatedResponse<AdminProduct>>('/admin/products/', params);
  }

  updateStock(productId: number, quantity: number): Observable<AdminProduct> {
    return this.api.patch<AdminProduct>(`/admin/products/${productId}/stock/`, { stock_quantity: quantity });
  }

  toggleProductActive(productId: number, isActive: boolean): Observable<AdminProduct> {
    return this.api.patch<AdminProduct>(`/admin/products/${productId}/`, { is_active: isActive });
  }

  deleteProduct(productId: number): Observable<void> {
    return this.api.delete<void>(`/admin/products/${productId}/`);
  }

  // Categories
  getAdminCategories(): Observable<AdminCategory[]> {
    return this.api.get<AdminCategory[]>('/admin/categories/');
  }

  createCategory(payload: AdminCategoryPayload): Observable<AdminCategory> {
    return this.api.post<AdminCategory>('/admin/categories/', payload);
  }

  updateCategory(id: number, payload: AdminCategoryPayload): Observable<AdminCategory> {
    return this.api.patch<AdminCategory>(`/admin/categories/${id}/`, payload);
  }

  deleteCategory(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/categories/${id}/`);
  }

  // Payments
  getPayments(params?: { page?: number }): Observable<PaginatedResponse<AdminPayment>> {
    return this.api.get<PaginatedResponse<AdminPayment>>('/admin/payments/', params);
  }
}
