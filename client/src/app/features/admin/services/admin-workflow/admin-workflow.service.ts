import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, type Observable, of, switchMap } from 'rxjs';

import type { UploadFileItem } from '../../../../shared/components/file-upload/file-upload.component';
import {
  AdminService,
  type AdminCategory,
  type AdminCategoryPayload,
  type AdminPayment,
  type AdminProduct,
  type AdminProductPayload,
  type AdminReview,
} from '../../../../core/services/admin/admin.service';

export interface AdminDashboardMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: 'success' | 'warning' | 'info' | 'accent';
}

export interface AdminDashboardQueueItem {
  id: string;
  title: string;
  detail: string;
  status: string;
  tone: 'warning' | 'error' | 'info';
}

export type AdminDashboardResult =
  | { status: 'loaded'; metrics: readonly AdminDashboardMetric[]; queue: readonly AdminDashboardQueueItem[] }
  | { status: 'failed'; message: string };

export type AdminCategorySaveResult =
  | { status: 'saved'; category: AdminCategory; message: string }
  | { status: 'invalid'; message: string }
  | { status: 'failed'; message: string };

export interface AdminProductDraft {
  name: string;
  description: string;
  price: string;
  stock: number;
  isActive: boolean;
  categoryId: string;
}

export type AdminProductSaveResult =
  | { status: 'saved'; product: AdminProduct; message: string }
  | { status: 'invalid'; fieldErrors: Record<string, string> }
  | { status: 'failed'; message: string };

export type AdminProductSubmitResult =
  | { status: 'saved'; product: AdminProduct; message: string }
  | { status: 'image-upload-failed'; product: AdminProduct; message: string }
  | { status: 'invalid'; fieldErrors: Record<string, string> }
  | { status: 'failed'; message: string };

export type AdminWorkflowResult =
  | { status: 'success'; message: string }
  | { status: 'noop' }
  | { status: 'failed'; message: string };

@Injectable({ providedIn: 'root' })
export class AdminWorkflowService {
  private readonly adminService = inject(AdminService);

  loadDashboard(): Observable<AdminDashboardResult> {
    return forkJoin({
      users: this.adminService.getUsers({ page: 1, page_size: 5 }),
      orders: this.adminService.getOrders({ page: 1, page_size: 5 }),
      payments: this.adminService.getPayments({ page: 1, page_size: 5 }),
      products: this.adminService.getAdminProducts({ page: 1, page_size: 5 }),
      reviews: this.adminService.getReviews({ page: 1, page_size: 5 }),
    }).pipe(
      map(({ users, orders, payments, products, reviews }) => ({
        status: 'loaded' as const,
        metrics: [
          { id: 'users', label: 'Users', value: String(users.count), detail: 'registered', tone: 'info' as const },
          { id: 'orders', label: 'Orders', value: String(orders.count), detail: 'total orders', tone: 'warning' as const },
          { id: 'payments', label: 'Payments', value: String(payments.count), detail: 'payment records', tone: 'accent' as const },
          { id: 'products', label: 'Products', value: String(products.count), detail: 'catalog items', tone: 'success' as const },
        ],
        queue: [
          ...orders.results.slice(0, 1).map((order) => mapOrderQueueItem(order)),
          ...payments.results.slice(0, 1).map((payment) => mapPaymentQueueItem(payment)),
          ...reviews.results.slice(0, 1).map((review) => mapReviewQueueItem(review)),
        ],
      })),
      catchError(() => of({ status: 'failed' as const, message: 'The dashboard metrics could not be loaded.' })),
    );
  }

  saveCategory(editingSlug: string | null, name: string, description: string, isActive = true): Observable<AdminCategorySaveResult> {
    const payload = toCategoryPayload(name, description, isActive);
    if (!payload) {
      return of({ status: 'invalid', message: 'Category name is required.' });
    }

    const request = editingSlug ? this.adminService.updateCategory(editingSlug, payload) : this.adminService.createCategory(payload);
    return request.pipe(
      map((category) => ({ status: 'saved' as const, category, message: editingSlug ? 'Category saved.' : 'Category created.' })),
      catchError(() => of({ status: 'failed' as const, message: 'The category could not be saved.' })),
    );
  }

  saveProduct(editingSlug: string | null, draft: AdminProductDraft): Observable<AdminProductSaveResult> {
    const fieldErrors = validateProductDraft(draft);
    if (Object.keys(fieldErrors).length > 0) {
      return of({ status: 'invalid', fieldErrors });
    }

    const payload = toProductPayload(draft);
    const request = editingSlug ? this.adminService.updateProduct(editingSlug, payload) : this.adminService.createProduct(payload);
    return request.pipe(
      map((product) => ({ status: 'saved' as const, product, message: editingSlug ? 'Product saved.' : 'Product created.' })),
      catchError(() => of({ status: 'failed' as const, message: 'The product could not be saved.' })),
    );
  }

  submitProduct(
    editingSlug: string | null,
    draft: AdminProductDraft,
    files: readonly UploadFileItem[],
    primaryId: string | null,
  ): Observable<AdminProductSubmitResult> {
    return this.saveProduct(editingSlug, draft).pipe(
      switchMap((result) => {
        if (result.status !== 'saved' || files.length === 0) {
          return of(result);
        }

        return this.uploadProductImages(result.product.id, files, primaryId).pipe(
          map((uploadResult): AdminProductSubmitResult => {
            if (uploadResult.status === 'failed') {
              return { status: 'image-upload-failed', product: result.product, message: uploadResult.message };
            }

            return { status: 'saved', product: result.product, message: `${result.message} Product images uploaded.` };
          }),
        );
      }),
    );
  }

  uploadProductImages(productId: number, files: readonly UploadFileItem[], primaryId: string | null): Observable<AdminWorkflowResult> {
    if (files.length === 0) {
      return of({ status: 'noop' });
    }

    return forkJoin(
      files.map((item) =>
        this.adminService.uploadProductImage(productId, item.file, {
          altText: item.file.name,
          isPrimary: item.id === primaryId,
        }),
      ),
    ).pipe(
      map(() => ({ status: 'success' as const, message: 'Product images uploaded.' })),
      catchError(() => of({ status: 'failed' as const, message: 'One or more images could not be uploaded.' })),
    );
  }

  deleteProduct(productSlug: string): Observable<AdminWorkflowResult> {
    return this.adminService.deleteProduct(productSlug).pipe(
      map(() => ({ status: 'success' as const, message: 'Product deactivated.' })),
      catchError(() => of({ status: 'failed' as const, message: 'The product could not be deactivated.' })),
    );
  }

  toggleProductVisibility(products: readonly AdminProduct[], ids: readonly string[], forceVisible?: boolean): Observable<AdminWorkflowResult> {
    const requests = ids
      .map((id) => products.find((product) => product.slug === id) ?? null)
      .filter((product): product is AdminProduct => product !== null)
      .filter((product) => (forceVisible === undefined ? true : product.is_active !== forceVisible))
      .map((product) => this.adminService.toggleProductActive(product));

    if (!requests.length) {
      return of({ status: 'noop' });
    }

    return forkJoin(requests).pipe(
      map(() => ({ status: 'success' as const, message: 'Visibility updated.' })),
      catchError(() => of({ status: 'failed' as const, message: 'Product visibility could not be updated.' })),
    );
  }
}

function toCategoryPayload(name: string, description: string, isActive: boolean): AdminCategoryPayload | null {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  const trimmedDescription = description.trim();
  const payload: AdminCategoryPayload = { name: trimmedName, is_active: isActive };
  if (trimmedDescription) {
    payload.description = trimmedDescription;
  }
  return payload;
}

function validateProductDraft(input: AdminProductDraft): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.name.trim()) {
    errors['name'] = 'Name is required.';
  }
  if (!input.description.trim()) {
    errors['description'] = 'Description is required.';
  }
  if (!input.categoryId.trim()) {
    errors['category_id'] = 'Category is required.';
  }

  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0) {
    errors['price'] = 'Price must be zero or greater.';
  }

  if (!Number.isInteger(input.stock) || input.stock < 0) {
    errors['stock'] = 'Stock must be a non-negative integer.';
  }

  return errors;
}

function toProductPayload(input: AdminProductDraft): AdminProductPayload {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    price: Number(input.price).toFixed(2),
    stock: input.stock,
    is_active: input.isActive,
    category_id: Number(input.categoryId),
  };
}

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

function mapOrderQueueItem(order: { order_number: string; status: string; payment_status: string }): AdminDashboardQueueItem {
  return {
    id: `order-${order.order_number}`,
    title: `Order ${order.order_number}`,
    detail: `${formatLabel(order.status)} with ${formatLabel(order.payment_status)} payment status.`,
    status: 'Order',
    tone: order.status === 'failed' || order.payment_status === 'failed' ? 'error' : 'warning',
  };
}

function mapPaymentQueueItem(payment: Pick<AdminPayment, 'order_number' | 'method' | 'status'>): AdminDashboardQueueItem {
  return {
    id: `payment-${payment.order_number}`,
    title: `Payment ${payment.order_number}`,
    detail: `${formatLabel(payment.method)} payment is currently ${formatLabel(payment.status)}.`,
    status: 'Payment',
    tone: payment.status === 'failed' ? 'error' : 'info',
  };
}

function mapReviewQueueItem(review: Pick<AdminReview, 'user_name' | 'product_name' | 'is_visible'>): AdminDashboardQueueItem {
  return {
    id: `review-${review.user_name}-${review.product_name}`,
    title: `Review from ${review.user_name}`,
    detail: `${review.product_name} is ${review.is_visible ? 'visible' : 'hidden'} to customers.`,
    status: 'Review',
    tone: review.is_visible ? 'info' : 'warning',
  };
}
