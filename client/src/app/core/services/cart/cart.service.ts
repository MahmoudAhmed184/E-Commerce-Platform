import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { catchError, concatMap, finalize, from, map, type Observable, of, reduce, switchMap, tap, throwError } from 'rxjs';

import { ResponseValidationError } from '../../models/runtime-validation/runtime-validation';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';

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
  available_stock: number | null;
}

export interface StockValidationResult {
  valid: boolean;
  errors: readonly { product: number; message: string; maxQuantity: number }[];
}

const GUEST_CART_KEY = 'guest_cart';
const AUTH_CART_KEY = 'auth_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);

  private readonly cartState = signal<Cart | null>(this.loadStoredCart());
  private readonly guestItemsState = signal<GuestCartItem[]>(this.loadGuestCart());
  private readonly isLoadingState = signal(false);

  readonly cart = this.cartState.asReadonly();
  readonly guestItems = this.guestItemsState.asReadonly();
  readonly isLoading = this.isLoadingState.asReadonly();

  readonly itemCount = computed(() => {
    if (this.authService.isLoggedIn()) {
      return this.cart()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    }

    return this.guestItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  constructor() {
    effect((onCleanup) => {
      if (!this.authService.isLoggedIn()) {
        this.cartState.set(null);
        localStorage.removeItem(AUTH_CART_KEY);
        return;
      }

      const subscription = this.loadCart()
        .pipe(
          catchError(() => {
            this.clearAuthenticatedCart();
            return of(buildCart([]));
          }),
        )
        .subscribe();

      onCleanup(() => subscription.unsubscribe());
    });
  }

  loadCart(): Observable<Cart> {
    if (!this.authService.isLoggedIn()) {
      const emptyCart = buildCart([]);
      this.cartState.set(null);
      return of(emptyCart);
    }

    this.isLoadingState.set(true);

    return this.syncGuestCartToServer().pipe(
      tap((cart) => this.persistAuthenticatedCart(cart)),
      finalize(() => this.isLoadingState.set(false)),
    );
  }

  addItem(productId: number, quantity: number): Observable<Cart> {
    if (quantity < 1) {
      return throwError(() => new Error('Quantity must be at least 1.'));
    }

    if (!this.authService.isLoggedIn()) {
      return throwError(() => new Error('Authenticated cart operations require a signed-in user.'));
    }

    return this.syncGuestCartToServer().pipe(
      switchMap(() =>
        this.api.post<unknown>('/cart/items/', { product: productId, quantity }).pipe(map((response) => parseCart(response, 'cart item add'))),
      ),
      tap((cart) => this.persistAuthenticatedCart(cart)),
    );
  }

  updateItem(itemId: number, quantity: number): Observable<Cart> {
    if (quantity < 1) {
      return throwError(() => new Error('Quantity must be at least 1.'));
    }

    return this.api.patch<unknown>(`/cart/items/${itemId}/`, { quantity }).pipe(
      map((response) => parseCart(response, 'cart item update')),
      tap((cart) => this.persistAuthenticatedCart(cart)),
    );
  }

  removeItem(itemId: number): Observable<Cart> {
    return this.api.delete<unknown>(`/cart/items/${itemId}/`).pipe(
      map((response) => parseCart(response, 'cart item removal')),
      tap((cart) => this.persistAuthenticatedCart(cart)),
    );
  }

  validateStock(): Observable<StockValidationResult> {
    if (this.authService.isLoggedIn()) {
      return of({ valid: true, errors: [] });
    }

    const errors = this.guestItems()
      .filter((item) => item.available_stock !== null && item.quantity > item.available_stock)
      .map((item) => ({
        product: item.product,
        message: `Only ${item.available_stock} available.`,
        maxQuantity: item.available_stock ?? 0,
      }));

    return of({
      valid: errors.length === 0,
      errors,
    });
  }

  addGuestItem(item: GuestCartItem): void {
    const current = this.guestItems();
    const existing = current.find((cartItem) => cartItem.product === item.product);
    const items = existing
      ? current.map((cartItem) =>
          cartItem.product === item.product
            ? {
                ...cartItem,
                quantity: cartItem.quantity + item.quantity,
                available_stock: item.available_stock ?? cartItem.available_stock,
              }
            : cartItem,
        )
      : [...current, item];

    this.guestItemsState.set(items);
    this.saveGuestCart();
  }

  updateGuestItem(productId: number, quantity: number): void {
    this.guestItemsState.set(this.guestItems().map((item) => (item.product === productId ? { ...item, quantity } : item)));
    this.saveGuestCart();
  }

  removeGuestItem(productId: number): void {
    this.guestItemsState.set(this.guestItems().filter((item) => item.product !== productId));
    this.saveGuestCart();
  }

  clearGuestCart(): void {
    this.guestItemsState.set([]);
    localStorage.removeItem(GUEST_CART_KEY);
  }

  clearCartState(): void {
    this.clearAuthenticatedCart();
    this.clearGuestCart();
  }

  get guestSubtotal(): number {
    return this.guestItems().reduce((sum, item) => sum + Number.parseFloat(item.product_price) * item.quantity, 0);
  }

  private syncGuestCartToServer(): Observable<Cart> {
    return this.api.get<unknown>('/cart/').pipe(
      map((response) => parseCart(response, 'cart')),
      switchMap((cart) => {
        const guestItems = this.guestItems();

        if (!guestItems.length) {
          return of(cart);
        }

        return from(guestItems).pipe(
          concatMap((item) =>
            this.api
              .post<unknown>('/cart/items/', { product: item.product, quantity: item.quantity })
              .pipe(map((response) => parseCart(response, 'cart item sync'))),
          ),
          reduce((latestCart, nextCart) => nextCart, cart),
          tap(() => this.clearGuestCart()),
        );
      }),
    );
  }

  private loadGuestCart(): GuestCartItem[] {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      if (!raw) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.flatMap((item) => {
        const normalized = normalizeGuestCartItem(item);
        return normalized ? [normalized] : [];
      });
    } catch {
      return [];
    }
  }

  private loadStoredCart(): Cart | null {
    try {
      const raw = localStorage.getItem(AUTH_CART_KEY);
      return raw ? normalizeCart(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  private saveGuestCart(): void {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(this.guestItems()));
  }

  private persistAuthenticatedCart(cart: Cart): void {
    this.cartState.set(cart);
    localStorage.setItem(AUTH_CART_KEY, JSON.stringify(cart));
  }

  private clearAuthenticatedCart(): void {
    this.cartState.set(null);
    localStorage.removeItem(AUTH_CART_KEY);
  }
}

function parseCart(value: unknown, context: string): Cart {
  const cart = normalizeCart(value);
  if (!cart) {
    throw new ResponseValidationError(context, 'expected a cart object');
  }

  return cart;
}

function buildCart(items: readonly CartItem[]): Cart {
  const subtotal = items.reduce((sum, item) => sum + Number.parseFloat(item.line_total), 0);
  return {
    id: 0,
    items: [...items],
    subtotal: subtotal.toFixed(2),
    total: subtotal.toFixed(2),
  };
}

function normalizeGuestCartItem(value: unknown): GuestCartItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const product = value['product'];
  const productName = value['product_name'];
  const productSlug = value['product_slug'];
  const productPrice = value['product_price'];
  const quantity = value['quantity'];
  if (
    typeof product !== 'number' ||
    typeof productName !== 'string' ||
    typeof productSlug !== 'string' ||
    typeof productPrice !== 'string' ||
    typeof quantity !== 'number'
  ) {
    return null;
  }

  return {
    product,
    product_name: productName,
    product_slug: productSlug,
    product_price: productPrice,
    primary_image: typeof value['primary_image'] === 'string' ? value['primary_image'] : null,
    quantity,
    available_stock: typeof value['available_stock'] === 'number' ? value['available_stock'] : null,
  };
}

function normalizeCart(value: unknown): Cart | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value['id'];
  const items = value['items'];
  const subtotal = value['subtotal'];
  const total = value['total'];
  if (typeof id !== 'number' || !Array.isArray(items) || typeof subtotal !== 'string' || typeof total !== 'string') {
    return null;
  }

  const normalizedItems = items.flatMap((item) => {
    const normalized = normalizeCartItem(item);
    return normalized ? [normalized] : [];
  });
  if (normalizedItems.length !== items.length) {
    return null;
  }

  return {
    id,
    items: normalizedItems,
    subtotal,
    total,
  };
}

function normalizeCartItem(value: unknown): CartItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value['id'];
  const product = value['product'];
  const productName = value['product_name'];
  const productSlug = value['product_slug'];
  const productPrice = value['product_price'];
  const quantity = value['quantity'];
  const unitPriceSnapshot = value['unit_price_snapshot'];
  const lineTotal = value['line_total'];
  if (
    typeof id !== 'number' ||
    typeof product !== 'number' ||
    typeof productName !== 'string' ||
    typeof productSlug !== 'string' ||
    typeof productPrice !== 'string' ||
    typeof quantity !== 'number' ||
    typeof unitPriceSnapshot !== 'string' ||
    typeof lineTotal !== 'string'
  ) {
    return null;
  }

  return {
    id,
    product,
    product_name: productName,
    product_slug: productSlug,
    product_price: productPrice,
    primary_image: typeof value['primary_image'] === 'string' ? value['primary_image'] : null,
    quantity,
    unit_price_snapshot: unitPriceSnapshot,
    line_total: lineTotal,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
