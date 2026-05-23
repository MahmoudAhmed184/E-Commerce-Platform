import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import type { PaginatedResponse } from '../../models/pagination/pagination.model';
import {
  parseBooleanField,
  parseLiteral,
  parseNullableStringField,
  parseNumberField,
  parsePaginatedResponse,
  parseRecord,
  parseRecordField,
  parseStringField,
} from '../../models/runtime-validation/runtime-validation';
import { ApiService } from '../api/api.service';

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
  payment_method: PaymentMethod | '';
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
  description: string;
  price: string;
  stock_quantity: number;
  availability: 'in_stock' | 'out_of_stock';
  is_active: boolean;
  category_id: number;
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

export interface AdminProductPayload {
  name: string;
  description: string;
  price: string;
  stock: number;
  is_active: boolean;
  category_id: number;
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
  description: string;
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

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  // Users
  getUsers(params?: { search?: string; page?: number; page_size?: number }): Observable<PaginatedResponse<AdminUser>> {
    return this.api
      .get<unknown>('/admin/users/', params)
      .pipe(map((response) => parsePaginatedResponse(response, (item) => parseAdminUser(item, 'admin user list item'), 'admin user list')));
  }

  approveUser(id: string): Observable<AdminUser> {
    return this.api.patch<unknown>(`/admin/users/${id}/approve/`, {}).pipe(map((response) => parseAdminUser(response, 'admin user')));
  }

  restrictUser(id: string): Observable<AdminUser> {
    return this.api.patch<unknown>(`/admin/users/${id}/restrict/`, {}).pipe(map((response) => parseAdminUser(response, 'admin user')));
  }

  softDeleteUser(id: string): Observable<AdminUser> {
    return this.api.delete<unknown>(`/admin/users/${id}/`).pipe(map((response) => parseAdminUser(response, 'admin user')));
  }

  // Orders
  getOrders(params?: { page?: number; page_size?: number }): Observable<PaginatedResponse<AdminOrder>> {
    return this.api
      .get<unknown>('/admin/orders/', params)
      .pipe(map((response) => parsePaginatedResponse(response, (item) => parseAdminOrder(item, 'admin order list item'), 'admin order list')));
  }

  updateOrderStatus(id: number, status: string): Observable<AdminOrder> {
    return this.api.patch<unknown>(`/admin/orders/${id}/`, { status }).pipe(map((response) => parseAdminOrder(response, 'admin order')));
  }

  // Reviews moderation
  getReviews(params?: { page?: number; page_size?: number }): Observable<PaginatedResponse<AdminReview>> {
    return this.api
      .get<unknown>('/admin/reviews/', params)
      .pipe(map((response) => parsePaginatedResponse(response, (item) => parseAdminReview(item, 'admin review list item'), 'admin review list')));
  }

  hideReview(id: number): Observable<AdminReview> {
    return this.api.patch<unknown>(`/admin/reviews/${id}/hide/`, {}).pipe(map((response) => parseAdminReview(response, 'admin review')));
  }

  unhideReview(id: number): Observable<AdminReview> {
    return this.api.patch<unknown>(`/admin/reviews/${id}/unhide/`, {}).pipe(map((response) => parseAdminReview(response, 'admin review')));
  }

  deleteReview(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/reviews/${id}/`);
  }

  // Products
  getAdminProducts(params?: { page?: number; page_size?: number }): Observable<PaginatedResponse<AdminProduct>> {
    return this.api
      .get<unknown>('/products/admin/products/', params)
      .pipe(
        map((response) => parsePaginatedResponse(response, (item) => parseBackendAdminProduct(item, 'admin product list item'), 'admin product list')),
        map((response) => mapPaginatedResponse(response, mapAdminProduct)),
      );
  }

  createProduct(payload: AdminProductPayload): Observable<AdminProduct> {
    return this.api
      .post<unknown>('/products/admin/products/', payload)
      .pipe(map((response) => parseBackendAdminProduct(response, 'admin product')), map(mapAdminProduct));
  }

  updateProduct(productSlug: string, payload: Partial<AdminProductPayload>): Observable<AdminProduct> {
    return this.api
      .patch<unknown>(`/products/admin/products/${productSlug}/`, payload)
      .pipe(map((response) => parseBackendAdminProduct(response, 'admin product')), map(mapAdminProduct));
  }

  updateStock(productSlug: string, quantity: number): Observable<AdminProduct> {
    return this.api
      .post<unknown>(`/products/admin/products/${productSlug}/update_stock/`, { quantity })
      .pipe(map((response) => parseBackendAdminProduct(response, 'admin product')), map(mapAdminProduct));
  }

  toggleProductActive(product: Pick<AdminProduct, 'slug' | 'is_active'>): Observable<AdminProduct> {
    const request = product.is_active
      ? this.api.post<unknown>(`/products/admin/products/${product.slug}/deactivate/`, {})
      : this.api.patch<unknown>(`/products/admin/products/${product.slug}/`, { is_active: true });

    return request.pipe(map((response) => parseBackendAdminProduct(response, 'admin product')), map(mapAdminProduct));
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

    return this.api
      .post<unknown>('/products/admin/product-images/', formData)
      .pipe(map((response) => parseAdminProductImage(response, 'admin product image')));
  }

  // Categories
  getAdminCategories(params?: { page?: number; page_size?: number }): Observable<PaginatedResponse<AdminCategory>> {
    return this.api
      .get<unknown>('/products/admin/categories/', params)
      .pipe(
        map((response) => parsePaginatedResponse(response, (item) => parseBackendAdminCategory(item, 'admin category list item'), 'admin category list')),
        map((response) => mapPaginatedResponse(response, mapAdminCategory)),
      );
  }

  createCategory(payload: AdminCategoryPayload): Observable<AdminCategory> {
    return this.api
      .post<unknown>('/products/admin/categories/', payload)
      .pipe(map((response) => parseBackendAdminCategory(response, 'admin category')), map(mapAdminCategory));
  }

  updateCategory(categorySlug: string, payload: AdminCategoryPayload): Observable<AdminCategory> {
    return this.api
      .patch<unknown>(`/products/admin/categories/${categorySlug}/`, payload)
      .pipe(map((response) => parseBackendAdminCategory(response, 'admin category')), map(mapAdminCategory));
  }

  deleteCategory(categorySlug: string): Observable<void> {
    return this.api.delete<void>(`/products/admin/categories/${categorySlug}/`);
  }

  // Payments
  getPayments(params?: { page?: number; page_size?: number }): Observable<PaginatedResponse<AdminPayment>> {
    return this.api
      .get<unknown>('/admin/payments/', params)
      .pipe(map((response) => parsePaginatedResponse(response, (item) => parseAdminPayment(item, 'admin payment list item'), 'admin payment list')));
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
    description: product.description,
    price: product.price,
    stock_quantity: product.stock,
    availability: product.availability,
    is_active: product.is_active,
    category_id: product.category.id,
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

function parseAdminUser(value: unknown, context: string): AdminUser {
  const record = parseRecord(value, context);

  return {
    id: parseStringField(record, 'id', context),
    email: parseStringField(record, 'email', context),
    phone: parseNullableStringField(record, 'phone', context),
    full_name: parseStringField(record, 'full_name', context),
    role: parseLiteral(record['role'], ['customer', 'admin'], `${context}.role`),
    status: parseLiteral(record['status'], ['pending_approval', 'active', 'restricted', 'soft_deleted'], `${context}.status`),
    created_at: parseStringField(record, 'created_at', context),
  };
}

function parseAdminOrder(value: unknown, context: string): AdminOrder {
  const record = parseRecord(value, context);

  return {
    id: parseNumberField(record, 'id', context),
    order_number: parseStringField(record, 'order_number', context),
    customer_email: parseStringField(record, 'customer_email', context),
    status: parseStringField(record, 'status', context),
    payment_status: parseStringField(record, 'payment_status', context),
    payment_method: parseLiteral(record['payment_method'], ['card', 'cod', 'wallet', ''], `${context}.payment_method`),
    total_amount: parseStringField(record, 'total_amount', context),
    created_at: parseStringField(record, 'created_at', context),
  };
}

function parseAdminReview(value: unknown, context: string): AdminReview {
  const record = parseRecord(value, context);

  return {
    id: parseNumberField(record, 'id', context),
    user_name: parseStringField(record, 'user_name', context),
    product_name: parseStringField(record, 'product_name', context),
    rating: parseNumberField(record, 'rating', context),
    comment: parseNullableStringField(record, 'comment', context),
    is_visible: parseBooleanField(record, 'is_visible', context),
    created_at: parseStringField(record, 'created_at', context),
  };
}

function parseBackendCategorySummary(value: unknown, context: string): BackendCategorySummary {
  const record = parseRecord(value, context);

  return {
    id: parseNumberField(record, 'id', context),
    name: parseStringField(record, 'name', context),
    slug: parseStringField(record, 'slug', context),
  };
}

function parseBackendAdminProduct(value: unknown, context: string): BackendAdminProduct {
  const record = parseRecord(value, context);

  return {
    id: parseNumberField(record, 'id', context),
    name: parseStringField(record, 'name', context),
    slug: parseStringField(record, 'slug', context),
    description: parseStringField(record, 'description', context),
    price: parseStringField(record, 'price', context),
    stock: parseNumberField(record, 'stock', context),
    availability: parseLiteral(record['availability'], ['in_stock', 'out_of_stock'], `${context}.availability`),
    is_active: parseBooleanField(record, 'is_active', context),
    category: parseBackendCategorySummary(parseRecordField(record, 'category', context), `${context}.category`),
  };
}

function parseBackendAdminCategory(value: unknown, context: string): BackendAdminCategory {
  const record = parseRecord(value, context);

  return {
    id: parseNumberField(record, 'id', context),
    name: parseStringField(record, 'name', context),
    slug: parseStringField(record, 'slug', context),
    description: parseStringField(record, 'description', context),
    is_active: parseBooleanField(record, 'is_active', context),
    product_count: parseNumberField(record, 'product_count', context),
  };
}

function parseAdminPayment(value: unknown, context: string): AdminPayment {
  const record = parseRecord(value, context);

  return {
    id: parseNumberField(record, 'id', context),
    order_number: parseStringField(record, 'order_number', context),
    customer_email: parseStringField(record, 'customer_email', context),
    amount: parseStringField(record, 'amount', context),
    method: parseLiteral(record['method'], ['card', 'cod', 'wallet'], `${context}.method`),
    status: parseLiteral(record['status'], ['pending', 'paid', 'failed', 'cod_pending'], `${context}.status`),
    provider_reference: parseNullableStringField(record, 'provider_reference', context),
    created_at: parseStringField(record, 'created_at', context),
  };
}

function parseAdminProductImage(value: unknown, context: string): AdminProductImage {
  const record = parseRecord(value, context);

  return {
    id: parseNumberField(record, 'id', context),
    product: parseNumberField(record, 'product', context),
    image: parseStringField(record, 'image', context),
    alt_text: parseStringField(record, 'alt_text', context),
    is_primary: parseBooleanField(record, 'is_primary', context),
    created_at: parseStringField(record, 'created_at', context),
  };
}
