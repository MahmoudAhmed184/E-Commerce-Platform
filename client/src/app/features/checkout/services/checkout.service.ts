import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

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
  // guest only
  items?: { product: number; quantity: number }[];
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
  payment_status: 'pending' | 'paid' | 'failed' | 'cod_pending';
  subtotal: string;
  shipping_amount: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  items: OrderItem[];
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly api = inject(ApiService);

  placeOrder(payload: CheckoutPayload): Observable<Order> {
    return this.api.post<Order>('/orders/checkout/', payload);
  }

  getOrders(): Observable<Order[]> {
    return this.api.get<Order[]>('/orders/');
  }

  getOrder(orderNumber: string): Observable<Order> {
    return this.api.get<Order>(`/orders/${orderNumber}/`);
  }
}
