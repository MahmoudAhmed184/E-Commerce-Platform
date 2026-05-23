import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, type Observable, of, throwError } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { CheckoutService, type Order, type PaymentMethod } from '../../../../core/services/checkout/checkout.service';
import type { UiAddress } from '../../../../core/models/commerce-ui/commerce-ui.model';
import { CheckoutPaymentWorkflowService, isCompleteDeliveryAddress } from './checkout-payment-workflow.service';

class AuthServiceStub {
  readonly currentUser = signal({ email: 'buyer@example.com' });
}

class CheckoutServiceStub {
  private readonly addressState = signal<UiAddress | null>(null);
  readonly deliveryAddress = this.addressState.asReadonly();
  readonly placeOrderCalls: { address: UiAddress; paymentMethod: PaymentMethod }[] = [];
  placeOrderResponse: Observable<Order> = of(orderFixture);

  setAddress(address: UiAddress | null): void {
    this.addressState.set(address);
  }

  getSavedDeliveryAddress(email = ''): UiAddress {
    const address = { ...completeAddress, email };
    this.addressState.set(address);
    return address;
  }

  placeOrder(address: UiAddress, paymentMethod: PaymentMethod): Observable<Order> {
    this.placeOrderCalls.push({ address, paymentMethod });
    return this.placeOrderResponse;
  }
}

const completeAddress: UiAddress = {
  name: 'Buyer',
  email: 'buyer@example.com',
  phone: '5551112222',
  addressLine1: '10 Market St',
  city: 'Boston',
  region: 'MA',
  postalCode: '02110',
  country: 'US',
};

const orderFixture: Order = {
  id: 1,
  order_number: 'ORD-1',
  email: 'buyer@example.com',
  phone: '5551112222',
  shipping_address: {
    line1: '10 Market St',
    city: 'Boston',
    state: 'MA',
    postal_code: '02110',
    country: 'US',
  },
  status: 'pending',
  payment_status: 'pending',
  subtotal: '25.00',
  shipping_amount: '0.00',
  tax_amount: '0.00',
  discount_amount: '0.00',
  total_amount: '25.00',
  items: [],
  created_at: '2026-05-19T00:00:00Z',
};

describe('CheckoutPaymentWorkflowService', () => {
  let checkoutService: CheckoutServiceStub;
  let service: CheckoutPaymentWorkflowService;

  beforeEach(() => {
    checkoutService = new CheckoutServiceStub();

    TestBed.configureTestingModule({
      providers: [
        CheckoutPaymentWorkflowService,
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: CheckoutService, useValue: checkoutService },
      ],
    });

    service = TestBed.inject(CheckoutPaymentWorkflowService);
  });

  it('detects incomplete delivery addresses before placing an order', async () => {
    checkoutService.setAddress({ ...completeAddress, postalCode: '' });

    const result = await firstValueFrom(service.placeOrder('card'));

    expect(result.status).toBe('delivery-required');
    expect(checkoutService.placeOrderCalls).toEqual([]);
  });

  it('blocks payment preflight failures before order placement', () => {
    expect(service.prepareOrder({ cartEmpty: true, loggedIn: true, paymentMethod: 'card' })).toEqual({
      status: 'blocked',
      message: 'Your cart is empty.',
    });
    expect(service.prepareOrder({ cartEmpty: false, loggedIn: false, paymentMethod: 'wallet' })).toEqual({
      status: 'blocked',
      message: 'Sign in before using wallet payments.',
    });
    expect(service.prepareOrder({ cartEmpty: false, loggedIn: true, paymentMethod: 'cod' })).toEqual({
      status: 'cod-confirmation-required',
    });
  });

  it('places orders with a complete delivery address', async () => {
    checkoutService.setAddress(completeAddress);

    const result = await firstValueFrom(service.placeOrder('wallet'));

    expect(result).toEqual({ status: 'placed', order: orderFixture });
    expect(checkoutService.placeOrderCalls).toEqual([{ address: completeAddress, paymentMethod: 'wallet' }]);
  });

  it('normalizes checkout placement errors', async () => {
    checkoutService.setAddress(completeAddress);
    checkoutService.placeOrderResponse = throwError(() => new Error('Payment declined.'));

    const result = await firstValueFrom(service.placeOrder('card'));

    expect(result).toEqual({ status: 'failed', message: 'Payment declined.' });
  });

  it('validates required delivery fields', () => {
    expect(isCompleteDeliveryAddress(completeAddress)).toBe(true);
    expect(isCompleteDeliveryAddress({ ...completeAddress, phone: '' })).toBe(false);
  });
});
