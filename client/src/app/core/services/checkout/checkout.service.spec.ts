import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, type Observable } from 'rxjs';

import type { UiAddress } from '../../models/commerce-ui/commerce-ui.model';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { CartService } from '../cart/cart.service';
import * as underTest from './checkout.service';
import { CheckoutService } from './checkout.service';

class AuthServiceStub {
  readonly currentUser = signal(null);
  readonly isLoggedIn = signal(false);
}

class CartServiceStub {
  readonly cart = signal(null);
  readonly guestItems = signal([]);
  cleared = false;

  clearCartState(): void {
    this.cleared = true;
  }
}

class ApiServiceStub {
  response: unknown = [];

  get<T>(): Observable<T> {
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
});
