import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, type Observable, of, tap, throwError } from 'rxjs';

import type { UiAddress } from '../../models/commerce-ui/commerce-ui.model';
import {
  parseArrayField,
  parseArray,
  parseLiteral,
  parseNullableStringField,
  parseNumberField,
  parseOptionalNullableStringField,
  parsePaginatedResponse,
  parseRecord,
  parseRecordField,
  parseStringField,
} from '../../models/runtime-validation/runtime-validation';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { CartService } from '../cart/cart.service';

export type PaymentMethod = 'card' | 'cod' | 'wallet';

export interface CheckoutAddress {
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface CheckoutPayload {
  email: string;
  phone: string;
  shipping_address: CheckoutAddress;
  payment_method: PaymentMethod;
  items: { product: number; quantity: number }[];
}

export interface CheckoutSummaryPayload {
  items: { product: number; quantity: number }[];
}

export interface CheckoutSummaryItem {
  product: number;
  product_name: string;
  product_slug: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface CheckoutSummary {
  items: CheckoutSummaryItem[];
  subtotal: string;
  shipping_amount: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
}

export interface OrderItem {
  id: number;
  product_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface Order {
  id: number;
  order_number: string;
  guest_access_token?: string | null;
  email: string;
  phone: string;
  shipping_address: CheckoutAddress;
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
  payment_status: 'pending' | 'paid' | 'failed' | 'cod_pending';
  subtotal: string;
  shipping_amount: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  items: OrderItem[];
  payment?: {
    method: PaymentMethod;
    status: 'pending' | 'paid' | 'failed' | 'cod_pending';
    provider_reference: string | null;
    failure_reason: string | null;
  };
  created_at: string;
}

export type CheckoutState =
  | { step: 'review'; status: 'idle' | 'validating' | 'error'; error?: string }
  | { step: 'delivery'; status: 'idle' | 'saving' | 'error'; address?: UiAddress; error?: string }
  | { step: 'payment'; status: 'idle' | 'placing' | 'error'; paymentMethod?: PaymentMethod; error?: string }
  | { step: 'confirmation'; status: 'complete'; order: Order };

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);

  private readonly stateState = signal<CheckoutState>({ step: 'review', status: 'idle' });
  private readonly selectedPaymentMethodState = signal<PaymentMethod>('card');
  private readonly deliveryAddressState = signal<UiAddress | null>(null);
  private readonly summaryState = signal<CheckoutSummary | null>(null);
  private idempotencyKey: string | null = null;

  readonly state = this.stateState.asReadonly();
  readonly selectedPaymentMethod = this.selectedPaymentMethodState.asReadonly();
  readonly deliveryAddress = this.deliveryAddressState.asReadonly();
  readonly summary = this.summaryState.asReadonly();

  startReview(): void {
    this.stateState.set({ step: 'review', status: 'idle' });
  }

  getSavedDeliveryAddress(fallbackEmail = ''): UiAddress {
    const savedAddress = this.deliveryAddressState() ?? defaultAddress(fallbackEmail);
    this.deliveryAddressState.set(savedAddress);
    return savedAddress;
  }

  saveDeliveryAddress(address: UiAddress): Observable<UiAddress> {
    this.deliveryAddressState.set(address);
    this.clearIdempotencyKey();
    this.stateState.set({ step: 'delivery', status: 'idle', address });
    return of(address);
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethodState.set(method);
    this.clearIdempotencyKey();
    this.stateState.set({ step: 'payment', status: 'idle', paymentMethod: method });
  }

  loadSummary(): Observable<CheckoutSummary> {
    const payload = this.buildSummaryPayload();

    if (payload === null) {
      const error = new Error('Cart is empty.');
      this.summaryState.set(null);
      return throwError(() => error);
    }

    this.summaryState.set(null);
    return this.api.post<unknown>('/orders/summary/', payload).pipe(
      map((response) => parseCheckoutSummary(response, 'checkout summary')),
      tap((summary) => this.summaryState.set(summary)),
    );
  }

  clearSummary(): void {
    this.summaryState.set(null);
  }

  placeOrder(address: UiAddress, paymentMethod: PaymentMethod): Observable<Order> {
    const payload = this.buildPayload(address, paymentMethod);

    if (payload === null) {
      const error = new Error('Cart is empty.');
      this.stateState.set({ step: 'payment', status: 'error', paymentMethod, error: error.message });
      return throwError(() => error);
    }

    this.stateState.set({ step: 'payment', status: 'placing', paymentMethod });

    return this.api
      .post<unknown>('/orders/checkout/', payload, {
        headers: {
          'Idempotency-Key': this.getOrCreateIdempotencyKey(),
        },
      })
      .pipe(
        map((response) => parseOrder(response, 'checkout order')),
        tap((order) => {
          this.stateState.set({ step: 'confirmation', status: 'complete', order });
          this.deliveryAddressState.set(null);
          this.summaryState.set(null);
          this.clearCheckoutDrafts();
          this.cartService.clearCartState();
        }),
        catchError((error: unknown) => {
          const message = toErrorMessage(error);
          this.stateState.set({ step: 'payment', status: 'error', paymentMethod, error: message });
          return throwError(() => error);
        }),
      );
  }

  getOrders(): Observable<readonly Order[]> {
    return this.api
      .get<unknown>('/orders/')
      .pipe(map((response) => parseOrderList(response)));
  }

  getOrder(orderNumber: string, guestAccessToken?: string | null): Observable<Order> {
    const params = guestAccessToken ? { guest_access_token: guestAccessToken } : undefined;
    return this.api.get<unknown>(`/orders/${orderNumber}/`, params).pipe(map((response) => parseOrder(response, 'order')));
  }

  private buildPayload(address: UiAddress, paymentMethod: PaymentMethod): CheckoutPayload | null {
    const items = this.buildCheckoutItems();

    if (!items.length) {
      return null;
    }

    const email = (this.authService.currentUser()?.email ?? address.email ?? '').trim();
    const phone = address.phone.trim();
    if (!email || !phone) {
      return null;
    }

    return {
      email,
      phone,
      shipping_address: {
        line1: address.addressLine1.trim(),
        city: address.city.trim(),
        state: address.region.trim(),
        postal_code: address.postalCode.trim(),
        country: address.country.trim(),
      },
      payment_method: paymentMethod,
      items,
    };
  }

  private buildSummaryPayload(): CheckoutSummaryPayload | null {
    const items = this.buildCheckoutItems();
    return items.length ? { items } : null;
  }

  private buildCheckoutItems(): CheckoutPayload['items'] {
    return this.authService.isLoggedIn()
      ? this.cartService.cart()?.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })) ?? []
      : this.cartService.guestItems().map((item) => ({
          product: item.product,
          quantity: item.quantity,
        }));
  }

  private getOrCreateIdempotencyKey(): string {
    this.idempotencyKey ??= crypto.randomUUID();
    return this.idempotencyKey;
  }

  private clearIdempotencyKey(): void {
    this.idempotencyKey = null;
  }

  private clearCheckoutDrafts(): void {
    this.clearIdempotencyKey();
  }
}

function defaultAddress(email = ''): UiAddress {
  return {
    name: '',
    email,
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'US',
    deliveryNotes: '',
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'The order could not be placed.';
}

function parseCheckoutAddress(value: unknown, context: string): CheckoutAddress {
  const record = parseRecord(value, context);

  return {
    line1: parseStringField(record, 'line1', context),
    city: parseStringField(record, 'city', context),
    state: parseStringField(record, 'state', context),
    postal_code: parseStringField(record, 'postal_code', context),
    country: parseStringField(record, 'country', context),
  };
}

function parseOrderItem(value: unknown, context: string): OrderItem {
  const record = parseRecord(value, context);

  return {
    id: parseNumberField(record, 'id', context),
    product_name: parseStringField(record, 'product_name', context),
    unit_price: parseStringField(record, 'unit_price', context),
    quantity: parseNumberField(record, 'quantity', context),
    line_total: parseStringField(record, 'line_total', context),
  };
}

function parseCheckoutSummaryItem(value: unknown, context: string): CheckoutSummaryItem {
  const record = parseRecord(value, context);

  return {
    product: parseNumberField(record, 'product', context),
    product_name: parseStringField(record, 'product_name', context),
    product_slug: parseStringField(record, 'product_slug', context),
    unit_price: parseStringField(record, 'unit_price', context),
    quantity: parseNumberField(record, 'quantity', context),
    line_total: parseStringField(record, 'line_total', context),
  };
}

function parseCheckoutSummary(value: unknown, context: string): CheckoutSummary {
  const record = parseRecord(value, context);

  return {
    items: parseArrayField(record, 'items', (item, index) => parseCheckoutSummaryItem(item, `${context}.items[${index}]`), context),
    subtotal: parseStringField(record, 'subtotal', context),
    shipping_amount: parseStringField(record, 'shipping_amount', context),
    tax_amount: parseStringField(record, 'tax_amount', context),
    discount_amount: parseStringField(record, 'discount_amount', context),
    total_amount: parseStringField(record, 'total_amount', context),
  };
}

function parseOrderPayment(value: unknown, context: string): NonNullable<Order['payment']> {
  const record = parseRecord(value, context);

  return {
    method: parseLiteral(record['method'], ['card', 'cod', 'wallet'], `${context}.method`),
    status: parseLiteral(record['status'], ['pending', 'paid', 'failed', 'cod_pending'], `${context}.status`),
    provider_reference: parseNullableStringField(record, 'provider_reference', context),
    failure_reason: parseNullableStringField(record, 'failure_reason', context),
  };
}

function parseOrder(value: unknown, context: string): Order {
  const record = parseRecord(value, context);
  const paymentValue = record['payment'];
  const payment = paymentValue === undefined || paymentValue === null ? undefined : parseOrderPayment(paymentValue, `${context}.payment`);
  const guestAccessToken = parseOptionalNullableStringField(record, 'guest_access_token', context);

  return {
    id: parseNumberField(record, 'id', context),
    order_number: parseStringField(record, 'order_number', context),
    ...(guestAccessToken !== undefined ? { guest_access_token: guestAccessToken } : {}),
    email: parseStringField(record, 'email', context),
    phone: parseStringField(record, 'phone', context),
    shipping_address: parseCheckoutAddress(parseRecordField(record, 'shipping_address', context), `${context}.shipping_address`),
    status: parseLiteral(record['status'], ['pending', 'confirmed', 'cancelled', 'failed'], `${context}.status`),
    payment_status: parseLiteral(record['payment_status'], ['pending', 'paid', 'failed', 'cod_pending'], `${context}.payment_status`),
    subtotal: parseStringField(record, 'subtotal', context),
    shipping_amount: parseStringField(record, 'shipping_amount', context),
    tax_amount: parseStringField(record, 'tax_amount', context),
    discount_amount: parseStringField(record, 'discount_amount', context),
    total_amount: parseStringField(record, 'total_amount', context),
    items: parseArrayField(record, 'items', (item, index) => parseOrderItem(item, `${context}.items[${index}]`), context),
    ...(payment ? { payment } : {}),
    created_at: parseStringField(record, 'created_at', context),
  };
}

function parseOrderList(value: unknown): readonly Order[] {
  if (Array.isArray(value)) {
    return parseArray(value, (item, index) => parseOrder(item, `order list[${index}]`), 'order list');
  }

  return parsePaginatedResponse(value, (item) => parseOrder(item, 'order list item'), 'order list').results;
}
