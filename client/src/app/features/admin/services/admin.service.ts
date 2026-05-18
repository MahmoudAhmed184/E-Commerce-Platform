import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { PaginatedResponse } from '../../../core/models/pagination.model';
export type { PaginatedResponse };

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
  is_email_confirmed: boolean;
  deleted_at: string | null;
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
  deleted_at: string | null;
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

interface BackendCategorySummary {
  id: number;
  name: string;
  slug: string;
}

interface BackendAdminProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  stock: number;
  availability: 'in_stock' | 'out_of_stock';
  is_active: boolean;
  category: BackendCategorySummary;
}

interface BackendAdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  product_count: number;
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

export interface AdminProductImage {
  id: number;
  product: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_users: number;
  total_products: number;
  total_orders: number;
  total_revenue: string;
  pending_users_count: number;
  recent_orders: AdminOrder[];
  recent_payments: AdminPayment[];
  recent_reviews: AdminReview[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  // Dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>('/admin/dashboard/');
  }

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
  getOrders(params?: { page?: number; status?: string; payment_status?: string }): Observable<PaginatedResponse<AdminOrder>> {
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

  unhideReview(id: number): Observable<AdminReview> {
    return this.api.patch<AdminReview>(`/admin/reviews/${id}/unhide/`, {});
  }

  deleteReview(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/reviews/${id}/`);
  }


  // Products
  getAdminProducts(params?: { page?: number }): Observable<PaginatedResponse<AdminProduct>> {
    return this.api
      .get<PaginatedResponse<BackendAdminProduct>>('/products/admin/products/', params)
      .pipe(map((response) => mapPaginatedResponse(response, mapAdminProduct)));
  }

  createProduct(payload: {
    name: string;
    description: string;
    price: string;
    stock: number;
    category_id: number;
  }): Observable<AdminProduct> {
    return this.api
      .post<BackendAdminProduct>('/products/admin/products/', payload)
      .pipe(map(mapAdminProduct));
  }

  updateStock(productSlug: string, quantity: number): Observable<AdminProduct> {
    return this.api
      .post<BackendAdminProduct>(`/products/admin/products/${productSlug}/update_stock/`, { quantity })
      .pipe(map(mapAdminProduct));
  }

  toggleProductActive(product: Pick<AdminProduct, 'slug' | 'is_active'>): Observable<AdminProduct> {
    const request = product.is_active
      ? this.api.post<BackendAdminProduct>(`/products/admin/products/${product.slug}/deactivate/`, {})
      : this.api.patch<BackendAdminProduct>(`/products/admin/products/${product.slug}/`, { is_active: true });

    return request.pipe(map(mapAdminProduct));
  }

  deleteProduct(productSlug: string): Observable<void> {
    return this.api.delete<void>(`/products/admin/products/${productSlug}/`);
  }

  uploadProductImage(
    productId: number,
    file: File,
    options?: { altText?: string; isPrimary?: boolean },
  ): Observable<AdminProductImage> {
    const formData = new FormData();
    formData.append('product', String(productId));
    formData.append('image', file);

    if (options?.altText) {
      formData.append('alt_text', options.altText);
    }

    if (options?.isPrimary) {
      formData.append('is_primary', 'true');
    }

    return this.api.post<AdminProductImage>('/products/admin/product-images/', formData);
  }

  // Categories
  getAdminCategories(params?: { page?: number }): Observable<PaginatedResponse<AdminCategory>> {
    return this.api
      .get<PaginatedResponse<BackendAdminCategory>>('/products/admin/categories/', params)
      .pipe(map((response) => mapPaginatedResponse(response, mapAdminCategory)));
  }

  createCategory(payload: AdminCategoryPayload): Observable<AdminCategory> {
    return this.api
      .post<BackendAdminCategory>('/products/admin/categories/', payload)
      .pipe(map(mapAdminCategory));
  }

  updateCategory(categorySlug: string, payload: AdminCategoryPayload): Observable<AdminCategory> {
    return this.api
      .patch<BackendAdminCategory>(`/products/admin/categories/${categorySlug}/`, payload)
      .pipe(map(mapAdminCategory));
  }

  deleteCategory(categorySlug: string): Observable<void> {
    return this.api.delete<void>(`/products/admin/categories/${categorySlug}/`);
  }

  // Payments
  getPayments(params?: { page?: number; status?: string }): Observable<PaginatedResponse<AdminPayment>> {
    return this.api.get<PaginatedResponse<AdminPayment>>('/admin/payments/', params);
  }
}

function mapPaginatedResponse<TInput, TOutput>(
  response: PaginatedResponse<TInput>,
  mapper: (value: TInput) => TOutput,
): PaginatedResponse<TOutput> {
  return {
    ...response,
    results: response.results.map(mapper),
  };
}

function mapAdminProduct(product: BackendAdminProduct): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    stock_quantity: product.stock,
    availability: product.availability,
    is_active: product.is_active,
    category_name: product.category.name,
  };
}

function mapAdminCategory(category: BackendAdminCategory): AdminCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    product_count: category.product_count,
  };
}
