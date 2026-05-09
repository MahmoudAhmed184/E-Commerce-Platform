import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { CartService, CartItem, GuestCartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-4xl px-4 py-10">
      <h1 class="text-2xl font-semibold text-slate-950">Your Cart</h1>

      @if (isLoading()) {
        <div class="mt-10 flex justify-center">
          <app-loading-spinner size="md" />
        </div>
      } @else if (error()) {
        <div class="mt-6">
          <app-error-message [message]="error()" />
        </div>
      } @else if (isEmpty()) {
        <div class="mt-16 flex flex-col items-center gap-4 text-center">
          <p class="text-slate-500">Your cart is empty.</p>
          <a
            routerLink="/products"
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >Browse Products</a>
        </div>
      } @else {
        <div class="mt-8 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-sm">
          @if (authService.isLoggedIn()) {
            @for (item of authCart()?.items ?? []; track item.id) {
              <div class="flex items-center gap-4 px-6 py-4">
                @if (item.primary_image) {
                  <img [src]="item.primary_image" [alt]="item.product_name" class="h-16 w-16 rounded-md object-cover" />
                } @else {
                  <div class="flex h-16 w-16 items-center justify-center rounded-md bg-slate-100 text-slate-400 text-xs">No image</div>
                }
                <div class="flex-1 min-w-0">
                  <p class="truncate font-medium text-slate-900">{{ item.product_name }}</p>
                  <p class="text-sm text-slate-500">&#36;{{ item.unit_price_snapshot }} each</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    [disabled]="item.quantity <= 1"
                    (click)="changeQty(item, item.quantity - 1)"
                  >−</button>
                  <span class="w-6 text-center text-sm font-medium">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                    (click)="changeQty(item, item.quantity + 1)"
                  >+</button>
                </div>
                <p class="w-20 text-right text-sm font-semibold text-slate-900">&#36;{{ item.line_total }}</p>
                <button
                  type="button"
                  class="ml-2 text-sm text-red-500 hover:text-red-700"
                  (click)="removeItem(item)"
                >Remove</button>
              </div>
            }
          } @else {
            @for (item of guestCart(); track item.product) {
              <div class="flex items-center gap-4 px-6 py-4">
                @if (item.primary_image) {
                  <img [src]="item.primary_image" [alt]="item.product_name" class="h-16 w-16 rounded-md object-cover" />
                } @else {
                  <div class="flex h-16 w-16 items-center justify-center rounded-md bg-slate-100 text-slate-400 text-xs">No image</div>
                }
                <div class="flex-1 min-w-0">
                  <p class="truncate font-medium text-slate-900">{{ item.product_name }}</p>
                  <p class="text-sm text-slate-500">&#36;{{ item.product_price }} each</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    [disabled]="item.quantity <= 1"
                    (click)="changeGuestQty(item, item.quantity - 1)"
                  >−</button>
                  <span class="w-6 text-center text-sm font-medium">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                    (click)="changeGuestQty(item, item.quantity + 1)"
                  >+</button>
                </div>
                <p class="w-20 text-right text-sm font-semibold text-slate-900">
                  &#36;{{ (parseFloat(item.product_price) * item.quantity).toFixed(2) }}
                </p>
                <button
                  type="button"
                  class="ml-2 text-sm text-red-500 hover:text-red-700"
                  (click)="removeGuestItem(item)"
                >Remove</button>
              </div>
            }
          }
        </div>

        <!-- Summary -->
        <div class="mt-6 flex flex-col items-end gap-4">
          <div class="w-full max-w-xs rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span class="font-semibold text-slate-900">
                @if (authService.isLoggedIn()) {
                  &#36;{{ cartService.cart()?.subtotal ?? '0.00' }}
                } @else {
                  &#36;{{ cartService.guestSubtotal.toFixed(2) }}
                }
              </span>
            </div>
          </div>
          <a
            routerLink="/checkout"
            class="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >Proceed to Checkout</a>
        </div>
      }
    </section>
  `,
})
export class CartPage implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);

  protected readonly isLoading = signal(false);
  protected readonly error = signal('');

  protected readonly authCart = this.cartService.cart;
  protected readonly guestCart = this.cartService.guestItems;

  protected readonly parseFloat = parseFloat;

  protected isEmpty(): boolean {
    if (this.authService.isLoggedIn()) {
      return (this.cartService.cart()?.items.length ?? 0) === 0;
    }
    return this.cartService.guestItems().length === 0;
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.isLoading.set(true);
      this.cartService
        .loadCart()
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          error: () => this.error.set('Could not load your cart. Please try again.'),
        });
    }
  }

  protected changeQty(item: CartItem, quantity: number): void {
    this.cartService.updateItem(item.id, quantity).subscribe({
      error: () => this.error.set('Could not update quantity.'),
    });
  }

  protected removeItem(item: CartItem): void {
    this.cartService.removeItem(item.id).subscribe({
      error: () => this.error.set('Could not remove item.'),
    });
  }

  protected changeGuestQty(item: GuestCartItem, quantity: number): void {
    this.cartService.updateGuestItem(item.product, quantity);
  }

  protected removeGuestItem(item: GuestCartItem): void {
    this.cartService.removeGuestItem(item.product);
  }
}
