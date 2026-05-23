import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';

import {
  parseLiteralField,
  parseNullableStringField,
  parseOptionalStringField,
  parseRecord,
  parseStringField,
} from '../../models/runtime-validation/runtime-validation';
import { ApiService } from '../api/api.service';

export type PaymentMethod = 'card' | 'cod' | 'wallet';

export interface StripeElementsStub {
  provider: 'stripe';
  ready: boolean;
  mountTargetId: string;
  clientSecret: string;
}

export interface PaymentResult {
  status: 'paid' | 'pending' | 'failed' | 'cod_pending';
  providerReference: string | null;
  failureReason?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiService);

  initializeStripeElements(mountTargetId: string): Observable<StripeElementsStub> {
    return this.api.post<unknown>('/payments/card/elements/', { mount_target_id: mountTargetId }).pipe(
      map((response) => {
        const record = parseRecord(response, 'stripe elements');
        return {
          provider: 'stripe',
          ready: true,
          mountTargetId,
          clientSecret: parseStringField(record, 'client_secret', 'stripe elements'),
        };
      }),
    );
  }

  payByCard(orderTotal: number): Observable<PaymentResult> {
    // UI amount only - backend must recompute and enforce payable totals.
    return this.api.post<unknown>('/payments/card/confirm/', { amount: orderTotal }).pipe(map((response) => parsePaymentResult(response, 'card payment')));
  }

  payByWallet(orderTotal: number): Observable<PaymentResult> {
    // UI amount only - backend must recompute and enforce payable totals.
    return this.api.post<unknown>('/payments/wallet/pay/', { amount: orderTotal }).pipe(map((response) => parsePaymentResult(response, 'wallet payment')));
  }

  requestCodConfirmation(): void {
    return;
  }

  confirmCod(): Observable<PaymentResult> {
    return this.api.post<unknown>('/payments/cod/confirm/', {}).pipe(map((response) => parsePaymentResult(response, 'cod payment')));
  }

  cancelCodConfirmation(): void {
    return;
  }
}

function parsePaymentResult(value: unknown, context: string): PaymentResult {
  const record = parseRecord(value, context);
  const failureReason = parseOptionalStringField(record, 'failure_reason', context);

  return {
    status: parseLiteralField(record, 'status', ['paid', 'pending', 'failed', 'cod_pending'], context),
    providerReference: parseNullableStringField(record, 'provider_reference', context),
    ...(failureReason !== undefined ? { failureReason } : {}),
  };
}
