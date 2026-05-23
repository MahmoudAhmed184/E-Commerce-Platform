import { Injectable, inject } from '@angular/core';
import { catchError, map, type Observable, of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { CheckoutService, type Order, type PaymentMethod } from '../../../../core/services/checkout/checkout.service';
import type { UiAddress } from '../../../../core/models/commerce-ui/commerce-ui.model';

export type CheckoutPaymentWorkflowResult =
  | { status: 'placed'; order: Order }
  | { status: 'delivery-required'; message: string }
  | { status: 'failed'; message: string };

export interface CheckoutPaymentPreflightInput {
  cartEmpty: boolean;
  loggedIn: boolean;
  paymentMethod: PaymentMethod;
}

export type CheckoutPaymentPreflightResult =
  | { status: 'ready' }
  | { status: 'cod-confirmation-required' }
  | { status: 'blocked'; message: string };

@Injectable({ providedIn: 'root' })
export class CheckoutPaymentWorkflowService {
  private readonly authService = inject(AuthService);
  private readonly checkoutService = inject(CheckoutService);

  ensureDeliveryAddressDraft(): void {
    if (!this.checkoutService.deliveryAddress()) {
      this.checkoutService.getSavedDeliveryAddress(this.authService.currentUser()?.email ?? '');
    }
  }

  prepareOrder(input: CheckoutPaymentPreflightInput): CheckoutPaymentPreflightResult {
    if (input.cartEmpty) {
      return { status: 'blocked', message: 'Your cart is empty.' };
    }
    if (input.paymentMethod === 'wallet' && !input.loggedIn) {
      return { status: 'blocked', message: 'Sign in before using wallet payments.' };
    }
    if (input.paymentMethod === 'cod') {
      return { status: 'cod-confirmation-required' };
    }

    return { status: 'ready' };
  }

  placeOrder(paymentMethod: PaymentMethod): Observable<CheckoutPaymentWorkflowResult> {
    const address = this.checkoutService.deliveryAddress() ?? this.checkoutService.getSavedDeliveryAddress(this.authService.currentUser()?.email ?? '');

    if (!isCompleteDeliveryAddress(address)) {
      // UI validation only - backend must validate delivery details before creating the order.
      return of({ status: 'delivery-required', message: 'Complete delivery details before placing the order.' });
    }

    return this.checkoutService.placeOrder(address, paymentMethod).pipe(
      map((order) => ({ status: 'placed' as const, order })),
      catchError((error: unknown) => of({ status: 'failed' as const, message: toOrderErrorMessage(error) })),
    );
  }
}

export function isCompleteDeliveryAddress(address: UiAddress): boolean {
  return Boolean(
    address.addressLine1.trim() &&
      address.city.trim() &&
      address.region.trim() &&
      address.postalCode.trim() &&
      address.phone.trim(),
  );
}

function toOrderErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'The order could not be placed. Try again.';
}
