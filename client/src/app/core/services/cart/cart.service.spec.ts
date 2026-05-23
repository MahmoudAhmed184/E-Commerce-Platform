import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { CartService, type GuestCartItem } from './cart.service';

class AuthServiceStub {
  private readonly loggedInState = signal(false);
  readonly isLoggedIn = this.loggedInState.asReadonly();
}

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: new AuthServiceStub() },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CartService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('adds guest items and merges quantity by product id', () => {
    service.addGuestItem(guestItem({ product: 101, quantity: 1 }));
    service.addGuestItem(guestItem({ product: 101, quantity: 2, available_stock: 8 }));

    expect(service.guestItems()).toEqual([
      guestItem({
        product: 101,
        quantity: 3,
        available_stock: 8,
      }),
    ]);
    expect(service.itemCount()).toBe(3);
    expect(service.guestSubtotal).toBe(149.97);
  });

  it('updates and removes guest items without mutating unrelated entries', () => {
    service.addGuestItem(guestItem({ product: 101, quantity: 1 }));
    service.addGuestItem(guestItem({ product: 202, quantity: 4, product_name: 'Desk lamp' }));

    service.updateGuestItem(202, 2);
    service.removeGuestItem(101);

    expect(service.guestItems()).toEqual([guestItem({ product: 202, quantity: 2, product_name: 'Desk lamp' })]);
    expect(service.itemCount()).toBe(2);
  });

  it('reports guest stock validation errors', async () => {
    service.addGuestItem(guestItem({ product: 101, quantity: 5, available_stock: 3 }));

    const result = await firstValueFrom(service.validateStock());

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([{ product: 101, message: 'Only 3 available.', maxQuantity: 3 }]);
  });

  it('clears guest cart state and storage', () => {
    service.addGuestItem(guestItem({ product: 101, quantity: 1 }));

    service.clearGuestCart();

    expect(service.guestItems()).toEqual([]);
    expect(localStorage.getItem('guest_cart')).toBeNull();
  });
});

function guestItem(overrides: Partial<GuestCartItem> = {}): GuestCartItem {
  return {
    product: 101,
    product_name: 'Running shoe',
    product_slug: 'running-shoe',
    product_price: '49.99',
    primary_image: null,
    quantity: 1,
    available_stock: null,
    ...overrides,
  };
}
