import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

export interface CartItem {
  id: number;
  product: number;
  product_name: string;
  product_slug: string;
  product_price: string;
  primary_image: string | null;
  quantity: number;
  unit_price_snapshot: string;
  line_total: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: string;
  total: string;
}

export interface GuestCartItem {
  product: number;
  product_name: string;
  product_slug: string;
  product_price: string;
  primary_image: string | null;
  quantity: number;
}

const GUEST_CART_KEY = 'guest_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);

  readonly cart = signal<Cart | null>(null);
  readonly guestItems = signal<GuestCartItem[]>(this.loadGuestCart());
  readonly isLoading = signal(false);

  readonly itemCount = computed(() => {
    if (this.authService.isLoggedIn()) {
      return this.cart()?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
    }
    return this.guestItems().reduce((sum, i) => sum + i.quantity, 0);
  });

  loadCart(): Observable<Cart> {
    this.isLoading.set(true);
    return this.api.get<Cart>('/cart/').pipe(
      tap((cart) => this.cart.set(cart)),
      catchError((error: unknown) => {
        this.cart.set(null);
        return throwError(() => error);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  addItem(productId: number, quantity: number): Observable<Cart> {
    return this.api.post<Cart>('/cart/items/', { product: productId, quantity }).pipe(
      tap((cart) => this.cart.set(cart)),
    );
  }

  updateItem(itemId: number, quantity: number): Observable<Cart> {
    return this.api.patch<Cart>(`/cart/items/${itemId}/`, { quantity }).pipe(
      tap((cart) => this.cart.set(cart)),
    );
  }

  removeItem(itemId: number): Observable<Cart> {
    return this.api.delete<Cart>(`/cart/items/${itemId}/`).pipe(
      tap((cart) => this.cart.set(cart)),
    );
  }

  // Guest cart — stored in localStorage
  addGuestItem(item: GuestCartItem): void {
    const current = this.guestItems();
    const existing = current.find((i) => i.product === item.product);
    if (existing) {
      this.guestItems.set(
        current.map((i) =>
          i.product === item.product ? { ...i, quantity: i.quantity + item.quantity } : i,
        ),
      );
    } else {
      this.guestItems.set([...current, item]);
    }
    this.saveGuestCart();
  }

  updateGuestItem(productId: number, quantity: number): void {
    this.guestItems.set(
      this.guestItems().map((i) => (i.product === productId ? { ...i, quantity } : i)),
    );
    this.saveGuestCart();
  }

  removeGuestItem(productId: number): void {
    this.guestItems.set(this.guestItems().filter((i) => i.product !== productId));
    this.saveGuestCart();
  }

  clearGuestCart(): void {
    this.guestItems.set([]);
    localStorage.removeItem(GUEST_CART_KEY);
  }

  clearCartState(): void {
    this.cart.set(null);
    this.clearGuestCart();
  }

  get guestSubtotal(): number {
    return this.guestItems().reduce(
      (sum, i) => sum + parseFloat(i.product_price) * i.quantity,
      0,
    );
  }

  private loadGuestCart(): GuestCartItem[] {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return raw ? (JSON.parse(raw) as GuestCartItem[]) : [];
    } catch {
      return [];
    }
  }

  private saveGuestCart(): void {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(this.guestItems()));
  }
}
