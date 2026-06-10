import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, type Observable } from 'rxjs';

import type { UiAddress } from '../../models/commerce-ui/commerce-ui.model';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { CartService, type Cart, type GuestCartItem } from '../cart/cart.service';
import * as underTest from './checkout.service';
import { CheckoutService } from './checkout.service';

class AuthServiceStub {
  readonly currentUser = signal<{ email: string } | null>(null);
  readonly isLoggedIn = signal(false);
}

class CartServiceStub {
  readonly cart = signal<Cart | null>(null);
  readonly guestItems = signal<GuestCartItem[]>([]);
  cleared = false;

  clearCartState(): void {
    this.cleared = true;
  }
}

class ApiServiceStub {
  response: unknown = [];
  readonly getCalls: { path: string; params?: Record<string, string> }[] = [];
  readonly postCalls: { path: string; body: unknown }[] = [];

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    this.getCalls.push({ path, ...(params ? { params } : {}) });
    return of(this.response as T);
  }

  post<T>(path: string, body: unknown): Observable<T> {
    this.postCalls.push({ path, body });
    return of(this.response as T);
  }
}

const address: UiAddress = {
  name: 'Buyer',
  email: 'buyer@example.com',
  phone: '5551112222',
  addressLine1: '10 Market St',
  city: 'Boston',
  region: 'MA',
  postalCode: '02110',
  country: 'US',
};

const order = {
  id: 1,
  order_number: 'ORD-ABCDEF123456',
  email: 'buyer@example.com',
  phone: '5551112222',
  shipping_address: {
    line1: '10 Market St',
    city: 'Boston',
    state: 'MA',
    postal_code: '02110',
    country: 'US',
  },
  status: 'confirmed',
  payment_status: 'paid',
  subtotal: '25.00',
  shipping_amount: '0.00',
  tax_amount: '0.00',
  discount_amount: '0.00',
  total_amount: '25.00',
  items: [
    {
      id: 3,
      product_name: 'Checkout Product',
      unit_price: '25.00',
      quantity: 1,
      line_total: '25.00',
    },
  ],
  payment: {
    method: 'card',
    status: 'paid',
    provider_reference: 'sandbox_reference',
    failure_reason: null,
  },
  created_at: '2026-05-21T10:15:00Z',
} satisfies underTest.Order;

const summary = {
  items: [
    {
      product: 3,
      product_name: 'Checkout Product',
      product_slug: 'checkout-product',
      unit_price: '25.00',
      quantity: 2,
      line_total: '50.00',
    },
  ],
  subtotal: '50.00',
  shipping_amount: '0.00',
  tax_amount: '0.00',
  discount_amount: '0.00',
  total_amount: '50.00',
} satisfies underTest.CheckoutSummary;

const guestItem = {
  product: 3,
  product_name: 'Checkout Product',
  product_slug: 'checkout-product',
  product_price: '25.00',
  primary_image: null,
  quantity: 2,
  available_stock: 5,
} satisfies GuestCartItem;

const authenticatedCart = {
  id: 1,
  status: 'active',
  items: [
    {
      id: 8,
      product: 3,
      product_name: 'Checkout Product',
      product_slug: 'checkout-product',
      product_price: '25.00',
      primary_image: null,
      quantity: 2,
      unit_price_snapshot: '25.00',
      line_total: '50.00',
    },
  ],
  subtotal: '50.00',
  total: '50.00',
} satisfies Cart;

describe('checkout.service', () => {
  it('exports a module surface', () => {
    expect(underTest).toBeTruthy();
  });

  it('keeps delivery drafts in memory instead of session storage', async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        CheckoutService,
        { provide: ApiService, useValue: {} },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: CartService, useClass: CartServiceStub },
      ],
    });
    const service = TestBed.inject(CheckoutService);

    await firstValueFrom(service.saveDeliveryAddress(address));

    expect(service.getSavedDeliveryAddress()).toEqual(address);
    expect(sessionStorage.getItem('checkout_delivery_draft')).toBeNull();
    expect(sessionStorage.getItem('checkout_idempotency_key')).toBeNull();
  });

  it('parses unpaginated order list responses', async () => {
    const api = new ApiServiceStub();
    api.response = [order];
    TestBed.configureTestingModule({
      providers: [
        CheckoutService,
        { provide: ApiService, useValue: api },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: CartService, useClass: CartServiceStub },
      ],
    });
    const service = TestBed.inject(CheckoutService);

    await expect(firstValueFrom(service.getOrders())).resolves.toEqual([order]);
  });

  it('parses paginated order list responses', async () => {
    const api = new ApiServiceStub();
    api.response = { count: 1, next: null, previous: null, results: [order] };
    TestBed.configureTestingModule({
      providers: [
        CheckoutService,
        { provide: ApiService, useValue: api },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: CartService, useClass: CartServiceStub },
      ],
    });
    const service = TestBed.inject(CheckoutService);

    await expect(firstValueFrom(service.getOrders())).resolves.toEqual([order]);
  });

  it('passes guest access token when loading an order detail', async () => {
    const api = new ApiServiceStub();
    const guestOrder = { ...order, guest_access_token: 'signed-token' } satisfies underTest.Order;
    api.response = guestOrder;
    TestBed.configureTestingModule({
      providers: [
        CheckoutService,
        { provide: ApiService, useValue: api },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: CartService, useClass: CartServiceStub },
      ],
    });
    const service = TestBed.inject(CheckoutService);

    await expect(firstValueFrom(service.getOrder('ORD-ABCDEF123456', 'signed-token'))).resolves.toEqual(guestOrder);

    expect(api.getCalls).toEqual([{ path: '/orders/ORD-ABCDEF123456/', params: { guest_access_token: 'signed-token' } }]);
  });

  it('loads checkout summaries from guest cart items', async () => {
    const api = new ApiServiceStub();
    const cart = new CartServiceStub();
    api.response = summary;
    cart.guestItems.set([guestItem]);
    TestBed.configureTestingModule({
      providers: [
        CheckoutService,
        { provide: ApiService, useValue: api },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: CartService, useValue: cart },
      ],
    });
    const service = TestBed.inject(CheckoutService);

    await expect(firstValueFrom(service.loadSummary())).resolves.toEqual(summary);

    expect(api.postCalls).toEqual([{ path: '/orders/summary/', body: { items: [{ product: 3, quantity: 2 }] } }]);
    expect(service.summary()).toEqual(summary);
  });

  it('loads checkout summaries from authenticated cart items', async () => {
    const api = new ApiServiceStub();
    const auth = new AuthServiceStub();
    const cart = new CartServiceStub();
    api.response = summary;
    auth.isLoggedIn.set(true);
    cart.cart.set(authenticatedCart);
    TestBed.configureTestingModule({
      providers: [
        CheckoutService,
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: auth },
        { provide: CartService, useValue: cart },
      ],
    });
    const service = TestBed.inject(CheckoutService);

    await expect(firstValueFrom(service.loadSummary())).resolves.toEqual(summary);

    expect(api.postCalls).toEqual([{ path: '/orders/summary/', body: { items: [{ product: 3, quantity: 2 }] } }]);
    expect(service.summary()).toEqual(summary);
  });
});
