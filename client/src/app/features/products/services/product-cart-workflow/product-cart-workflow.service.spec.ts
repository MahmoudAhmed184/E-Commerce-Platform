import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, type Observable, of, throwError } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { CartService, type GuestCartItem } from '../../../../core/services/cart/cart.service';
import { ProductCartWorkflowService, type ProductCartWorkflowProduct } from './product-cart-workflow.service';

class AuthServiceStub {
  private readonly loggedInState = signal(false);
  readonly isLoggedIn = this.loggedInState.asReadonly();

  setLoggedIn(value: boolean): void {
    this.loggedInState.set(value);
  }
}

class CartServiceStub {
  readonly guestItems: GuestCartItem[] = [];
  readonly addItemCalls: { productId: number; quantity: number }[] = [];
  addItemResponse: Observable<unknown> = of({});

  addGuestItem(item: GuestCartItem): void {
    this.guestItems.push(item);
  }

  addItem(productId: number, quantity: number): Observable<unknown> {
    this.addItemCalls.push({ productId, quantity });
    return this.addItemResponse;
  }
}

const product: ProductCartWorkflowProduct = {
  id: '12',
  slug: 'keyboard',
  name: 'Keyboard',
  imageUrl: '/keyboard.jpg',
  price: 49,
  stockStatus: 'in-stock',
  inventory: 8,
};

describe('ProductCartWorkflowService', () => {
  let authService: AuthServiceStub;
  let cartService: CartServiceStub;
  let service: ProductCartWorkflowService;

  beforeEach(() => {
    authService = new AuthServiceStub();
    cartService = new CartServiceStub();

    TestBed.configureTestingModule({
      providers: [
        ProductCartWorkflowService,
        { provide: AuthService, useValue: authService },
        { provide: CartService, useValue: cartService },
      ],
    });

    service = TestBed.inject(ProductCartWorkflowService);
  });

  it('adds guest products to the guest cart', async () => {
    const result = await firstValueFrom(service.addProduct(product, 2));

    expect(result.status).toBe('added');
    expect(cartService.guestItems).toEqual([
      {
        product: 12,
        product_name: 'Keyboard',
        product_slug: 'keyboard',
        product_price: '49.00',
        primary_image: '/keyboard.jpg',
        quantity: 2,
        available_stock: 8,
      },
    ]);
  });

  it('uses the authenticated cart endpoint for signed-in users', async () => {
    authService.setLoggedIn(true);

    const result = await firstValueFrom(service.addProduct(product, 1));

    expect(result.status).toBe('added');
    expect(cartService.addItemCalls).toEqual([{ productId: 12, quantity: 1 }]);
  });

  it('normalizes authenticated cart failures for the UI', async () => {
    authService.setLoggedIn(true);
    cartService.addItemResponse = throwError(() => new Error('server rejected cart update'));

    const result = await firstValueFrom(service.addProduct(product, 1));

    expect(result).toEqual({ status: 'failed', message: 'The cart could not be updated. Try again.' });
  });
});
