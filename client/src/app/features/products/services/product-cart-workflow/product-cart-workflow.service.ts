import { Injectable, inject } from '@angular/core';
import { catchError, map, type Observable, of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { CartService, type GuestCartItem } from '../../../../core/services/cart/cart.service';

export interface ProductCartWorkflowProduct {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  price: number;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  inventory?: number;
}

export interface ProductCartWorkflowResult {
  status: 'added' | 'blocked' | 'failed';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ProductCartWorkflowService {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);

  addProduct(product: ProductCartWorkflowProduct, quantity: number): Observable<ProductCartWorkflowResult> {
    const productId = normalizedProductId(product.id);
    if (product.stockStatus === 'out-of-stock') {
      // UI guard only - backend must enforce stock availability.
      return of({ status: 'blocked', message: `${product.name} is out of stock.` });
    }
    if (productId === null) {
      return of({ status: 'failed', message: 'The cart could not be updated. Try again.' });
    }

    if (!this.authService.isLoggedIn()) {
      this.cartService.addGuestItem(toGuestCartItem(product, productId, quantity));
      return of({ status: 'added', message: `${product.name} added to your cart.` });
    }

    return this.cartService.addItem(productId, quantity).pipe(
      map(() => ({ status: 'added' as const, message: `${product.name} added to your cart.` })),
      catchError(() => of({ status: 'failed' as const, message: 'The cart could not be updated. Try again.' })),
    );
  }
}

function normalizedProductId(value: string): number | null {
  const productId = Number(value);
  return Number.isInteger(productId) && productId > 0 ? productId : null;
}

function toGuestCartItem(product: ProductCartWorkflowProduct, productId: number, quantity: number): GuestCartItem {
  return {
    product: productId,
    product_name: product.name,
    product_slug: product.slug,
    product_price: product.price.toFixed(2),
    primary_image: product.imageUrl,
    quantity,
    available_stock: product.inventory ?? null,
  };
}
