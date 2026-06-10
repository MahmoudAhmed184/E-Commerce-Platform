import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, type Observable } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { CheckoutService, type Order } from '../../../../core/services/checkout/checkout.service';
import { OrdersPage } from './orders-page';

class AuthServiceStub {
  readonly isLoggedIn = signal(false);
}

class CheckoutServiceStub {
  orders: readonly Order[] = [];

  getOrders(): Observable<readonly Order[]> {
    return of(this.orders);
  }
}

const order = {
  id: 7,
  order_number: 'ORD-ABCDEF123456',
  email: 'buyer@example.com',
  phone: '+201000000500',
  shipping_address: {
    line1: '123 Test Street',
    city: 'Cairo',
    state: 'Cairo',
    postal_code: '11511',
    country: 'Egypt',
  },
  status: 'confirmed',
  payment_status: 'cod_pending',
  subtotal: '50.00',
  shipping_amount: '0.00',
  tax_amount: '0.00',
  discount_amount: '0.00',
  total_amount: '50.00',
  items: [
    {
      id: 11,
      product_name: 'Checkout Product',
      unit_price: '25.00',
      quantity: 2,
      line_total: '50.00',
    },
  ],
  payment: {
    method: 'cod',
    status: 'cod_pending',
    provider_reference: null,
    failure_reason: null,
  },
  created_at: '2026-05-21T10:15:00Z',
} satisfies Order;

describe('OrdersPage', () => {
  it('renders authenticated order history', async () => {
    const auth = new AuthServiceStub();
    auth.isLoggedIn.set(true);
    const checkout = new CheckoutServiceStub();
    checkout.orders = [order];

    await TestBed.configureTestingModule({
      imports: [OrdersPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: CheckoutService, useValue: checkout },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OrdersPage);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Order ORD-ABCDEF123456');
    expect(text).toContain('Checkout Product x 2');
    expect(text).toContain('Payment COD pending');
    expect(text).toContain('Cash on delivery');
  });

  it('normalizes order number lookup before navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: CheckoutService, useClass: CheckoutServiceStub },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(OrdersPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const input = query<HTMLInputElement>(root, 'input[formcontrolname="orderNumber"]');
    input.value = 'ord-abcdef123456';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = query<HTMLFormElement>(root, 'form');
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(navigateSpy).toHaveBeenCalledWith(['/orders', 'ORD-ABCDEF123456']);
  });
});

function query<TElement extends Element>(root: ParentNode, selector: string): TElement {
  const element = root.querySelector<TElement>(selector);
  if (element === null) {
    throw new Error(`Missing element for selector: ${selector}`);
  }

  return element;
}
