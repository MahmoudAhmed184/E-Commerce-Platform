import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, type Observable } from 'rxjs';

import { CheckoutService, type Order } from '../../../../core/services/checkout/checkout.service';
import * as underTest from './order-confirmation';
import { OrderConfirmationPage } from './order-confirmation';

class CheckoutServiceStub {
  readonly getOrderCalls: { orderNumber: string; guestAccessToken: string | null | undefined }[] = [];

  getOrder(orderNumber: string, guestAccessToken?: string | null): Observable<Order> {
    this.getOrderCalls.push({ orderNumber, guestAccessToken });
    return of(order);
  }
}

const order: Order = {
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
};

describe('order-confirmation', () => {
  it('exports a module surface', () => {
    expect(underTest).toBeTruthy();
  });

  it('loads guest order detail with the signed access token from the route', async () => {
    const checkout = new CheckoutServiceStub();

    await TestBed.configureTestingModule({
      imports: [OrderConfirmationPage],
      providers: [
        provideRouter([]),
        { provide: CheckoutService, useValue: checkout },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ orderNumber: 'ORD-ABCDEF123456' }),
              queryParamMap: convertToParamMap({ guest_access_token: 'signed-token' }),
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OrderConfirmationPage);
    fixture.detectChanges();

    expect(checkout.getOrderCalls).toEqual([
      { orderNumber: 'ORD-ABCDEF123456', guestAccessToken: 'signed-token' },
    ]);
  });
});
