import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('maps admin product list responses from the backend contract', () => {
    let actual: unknown;

    service.getAdminProducts({ page: 2 }).subscribe((response) => {
      actual = response;
    });

    const request = http.expectOne(`${environment.apiBaseUrl}/products/admin/products/?page=2`);
    expect(request.request.method).toBe('GET');
    request.flush({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 4,
          name: 'Camera',
          slug: 'camera',
          price: '149.99',
          stock: 9,
          availability: 'in_stock',
          is_active: true,
          category: {
            id: 2,
            name: 'Electronics',
            slug: 'electronics',
          },
        },
      ],
    });

    expect(actual).toEqual({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 4,
          name: 'Camera',
          slug: 'camera',
          price: '149.99',
          stock_quantity: 9,
          availability: 'in_stock',
          is_active: true,
          category_name: 'Electronics',
        },
      ],
    });
  });

  it('uses the slug-based stock update endpoint', () => {
    service.updateStock('camera', 12).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/products/admin/products/camera/update_stock/`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ quantity: 12 });
  });

  it('maps paginated admin category responses from the backend contract', () => {
    let actual: unknown;

    service.getAdminCategories({ page: 1 }).subscribe((response) => {
      actual = response;
    });

    const request = http.expectOne(`${environment.apiBaseUrl}/products/admin/categories/?page=1`);
    expect(request.request.method).toBe('GET');
    request.flush({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 3,
          name: 'Sports',
          slug: 'sports',
          description: 'Sports gear',
          is_active: true,
          product_count: 5,
        },
      ],
    });

    expect(actual).toEqual({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 3,
          name: 'Sports',
          slug: 'sports',
          description: 'Sports gear',
          product_count: 5,
        },
      ],
    });
  });

  it('uses the slug-based category update endpoint', () => {
    service.updateCategory('sports', { name: 'Outdoor Sports' }).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/products/admin/categories/sports/`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ name: 'Outdoor Sports' });
  });

  it('posts multipart data to the product image upload endpoint', () => {
    const file = new File(['image'], 'camera.png', { type: 'image/png' });

    service
      .uploadProductImage(7, file, { altText: 'Camera front', isPrimary: true })
      .subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/products/admin/product-images/`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBe(true);

    const body = request.request.body as FormData;
    expect(body.get('product')).toBe('7');
    expect(body.get('image')).toBe(file);
    expect(body.get('alt_text')).toBe('Camera front');
    expect(body.get('is_primary')).toBe('true');
  });

  it('calls the unhide endpoint for review moderation', () => {
    service.unhideReview(42).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/admin/reviews/42/unhide/`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});
  });

  it('passes status filter params when fetching orders', () => {
    service.getOrders({ page: 1, status: 'pending', payment_status: 'paid' }).subscribe();

    const request = http.expectOne(
      (req) =>
        req.url === `${environment.apiBaseUrl}/admin/orders/` &&
        req.params.get('status') === 'pending' &&
        req.params.get('payment_status') === 'paid',
    );
    expect(request.request.method).toBe('GET');
  });

  it('passes status filter param when fetching payments', () => {
    service.getPayments({ page: 1, status: 'failed' }).subscribe();

    const request = http.expectOne(
      (req) =>
        req.url === `${environment.apiBaseUrl}/admin/payments/` &&
        req.params.get('status') === 'failed',
    );
    expect(request.request.method).toBe('GET');
  });
});
