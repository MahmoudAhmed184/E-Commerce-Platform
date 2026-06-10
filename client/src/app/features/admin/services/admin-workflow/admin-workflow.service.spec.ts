import { TestBed } from '@angular/core/testing';
import { firstValueFrom, type Observable, of, throwError } from 'rxjs';

import type { PaginatedResponse } from '../../../../core/models/pagination/pagination.model';
import {
  AdminService,
  type AdminCategory,
  type AdminOrder,
  type AdminPayment,
  type AdminProduct,
  type AdminReview,
  type AdminUser,
} from '../../../../core/services/admin/admin.service';
import { AdminWorkflowService } from './admin-workflow.service';

class AdminServiceStub {
  readonly createdCategories: unknown[] = [];
  readonly createdProducts: unknown[] = [];
  readonly toggledProducts: Pick<AdminProduct, 'slug' | 'is_active'>[] = [];
  readonly uploadedImages: { productId: number; fileName: string; isPrimary: boolean }[] = [];
  createProductResponse: Observable<AdminProduct> = of(productFixture);
  uploadProductImageResponse: Observable<unknown> = of({});

  getUsers(): Observable<PaginatedResponse<AdminUser>> {
    return of(paginated([userFixture]));
  }

  getOrders(): Observable<PaginatedResponse<AdminOrder>> {
    return of(paginated([orderFixture]));
  }

  getPayments(): Observable<PaginatedResponse<AdminPayment>> {
    return of(paginated([paymentFixture]));
  }

  getAdminProducts(): Observable<PaginatedResponse<AdminProduct>> {
    return of(paginated([productFixture]));
  }

  getReviews(): Observable<PaginatedResponse<AdminReview>> {
    return of(paginated([reviewFixture]));
  }

  createCategory(payload: unknown): Observable<AdminCategory> {
    this.createdCategories.push(payload);
    return of(categoryFixture);
  }

  updateCategory(_categorySlug: string, payload: unknown): Observable<AdminCategory> {
    this.createdCategories.push(payload);
    return of(categoryFixture);
  }

  createProduct(payload: unknown): Observable<AdminProduct> {
    this.createdProducts.push(payload);
    return this.createProductResponse;
  }

  updateProduct(_productSlug: string, payload: unknown): Observable<AdminProduct> {
    this.createdProducts.push(payload);
    return this.createProductResponse;
  }

  toggleProductActive(product: Pick<AdminProduct, 'slug' | 'is_active'>): Observable<AdminProduct> {
    this.toggledProducts.push(product);
    return of({ ...productFixture, slug: product.slug, is_active: !product.is_active });
  }

  deleteProduct(): Observable<void> {
    return of(undefined);
  }

  uploadProductImage(productId: number, file: File, options?: { isPrimary?: boolean }): Observable<unknown> {
    this.uploadedImages.push({ productId, fileName: file.name, isPrimary: options?.isPrimary ?? false });
    return this.uploadProductImageResponse;
  }
}

const userFixture: AdminUser = {
  id: 'usr-1',
  email: 'admin@example.com',
  phone: null,
  full_name: 'Admin User',
  role: 'admin',
  status: 'active',
  created_at: '2026-05-19T00:00:00Z',
};

const orderFixture: AdminOrder = {
  id: 1,
  order_number: 'ORD-1',
  customer_email: 'buyer@example.com',
  status: 'pending',
  payment_status: 'pending',
  payment_method: 'card',
  total_amount: '25.00',
  created_at: '2026-05-19T00:00:00Z',
};

const paymentFixture: AdminPayment = {
  id: 1,
  order_number: 'ORD-1',
  customer_email: 'buyer@example.com',
  amount: '25.00',
  method: 'card',
  status: 'pending',
  provider_reference: null,
  created_at: '2026-05-19T00:00:00Z',
};

const productFixture: AdminProduct = {
  id: 7,
  name: 'Camera',
  slug: 'camera',
  description: 'Compact camera',
  price: '99.00',
  stock_quantity: 4,
  availability: 'in_stock',
  is_active: true,
  category_id: 3,
  category_name: 'Electronics',
};

const categoryFixture: AdminCategory = {
  id: 3,
  name: 'Electronics',
  slug: 'electronics',
  description: 'Devices',
  is_active: true,
  product_count: 1,
};

const reviewFixture: AdminReview = {
  id: 8,
  user_name: 'Buyer',
  product_name: 'Camera',
  rating: 4,
  comment: 'Good.',
  is_visible: true,
  created_at: '2026-05-19T00:00:00Z',
};

describe('AdminWorkflowService', () => {
  let adminService: AdminServiceStub;
  let service: AdminWorkflowService;

  beforeEach(() => {
    adminService = new AdminServiceStub();

    TestBed.configureTestingModule({
      providers: [AdminWorkflowService, { provide: AdminService, useValue: adminService }],
    });

    service = TestBed.inject(AdminWorkflowService);
  });

  it('loads dashboard metrics and queue data', async () => {
    const result = await firstValueFrom(service.loadDashboard());

    expect(result.status).toBe('loaded');
    if (result.status === 'loaded') {
      expect(result.metrics.map((metric) => metric.label)).toEqual(['Users', 'Orders', 'Payments', 'Products']);
      expect(result.queue.length).toBe(3);
    }
  });

  it('validates category names before saving', async () => {
    const result = await firstValueFrom(service.saveCategory(null, ' ', 'Ignored'));

    expect(result).toEqual({ status: 'invalid', message: 'Category name is required.' });
    expect(adminService.createdCategories).toEqual([]);
  });

  it('trims category payloads and preserves active state before saving', async () => {
    const result = await firstValueFrom(service.saveCategory('electronics', ' Electronics ', ' Devices ', false));

    expect(result).toEqual({ status: 'saved', category: categoryFixture, message: 'Category saved.' });
    expect(adminService.createdCategories).toEqual([{ name: 'Electronics', description: 'Devices', is_active: false }]);
  });

  it('trims product payloads before saving', async () => {
    const result = await firstValueFrom(
      service.saveProduct(null, {
        name: ' Camera ',
        description: ' Compact camera ',
        price: '99',
        stock: 4,
        isActive: true,
        categoryId: '3',
      }),
    );

    expect(result).toEqual({ status: 'saved', product: productFixture, message: 'Product created.' });
    expect(adminService.createdProducts).toEqual([
      { name: 'Camera', description: 'Compact camera', price: '99.00', stock: 4, is_active: true, category_id: 3 },
    ]);
  });

  it('normalizes product save failures', async () => {
    adminService.createProductResponse = throwError(() => new Error('save failed'));

    const result = await firstValueFrom(
      service.saveProduct(null, {
        name: 'Camera',
        description: 'Compact camera',
        price: '99',
        stock: 4,
        isActive: true,
        categoryId: '3',
      }),
    );

    expect(result).toEqual({ status: 'failed', message: 'The product could not be saved.' });
  });

  it('submits products and uploads selected images', async () => {
    const file = new File(['image'], 'camera.jpg', { type: 'image/jpeg' });

    const result = await firstValueFrom(
      service.submitProduct(
        null,
        {
          name: 'Camera',
          description: 'Compact camera',
          price: '99',
          stock: 4,
          isActive: true,
          categoryId: '3',
        },
        [{ id: 'upload-1', file }],
        'upload-1',
      ),
    );

    expect(result).toEqual({ status: 'saved', product: productFixture, message: 'Product created. Product images uploaded.' });
    expect(adminService.uploadedImages).toEqual([{ productId: productFixture.id, fileName: 'camera.jpg', isPrimary: true }]);
  });

  it('describes product delete calls as deactivation', async () => {
    const result = await firstValueFrom(service.deleteProduct('camera'));

    expect(result).toEqual({ status: 'success', message: 'Product deactivated.' });
  });

  it('keeps saved product context when image upload fails', async () => {
    adminService.uploadProductImageResponse = throwError(() => new Error('upload failed'));

    const result = await firstValueFrom(
      service.submitProduct(
        null,
        {
          name: 'Camera',
          description: 'Compact camera',
          price: '99',
          stock: 4,
          isActive: true,
          categoryId: '3',
        },
        [{ id: 'upload-1', file: new File(['image'], 'camera.jpg') }],
        'upload-1',
      ),
    );

    expect(result).toEqual({ status: 'image-upload-failed', product: productFixture, message: 'One or more images could not be uploaded.' });
  });

  it('skips visibility updates when no selected products need changes', async () => {
    const result = await firstValueFrom(service.toggleProductVisibility([productFixture], ['camera'], true));

    expect(result).toEqual({ status: 'noop' });
    expect(adminService.toggledProducts).toEqual([]);
  });
});

function paginated<T>(results: readonly T[]): PaginatedResponse<T> {
  return {
    count: results.length,
    next: null,
    previous: null,
    results: [...results],
  };
}
