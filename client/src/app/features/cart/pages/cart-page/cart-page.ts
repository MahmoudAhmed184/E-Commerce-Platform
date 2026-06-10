import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { OrderSummaryCardComponent } from '../../../../shared/components/order-summary-card/order-summary-card.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import type { UiCartItem, UiPriceLine } from '../../../../core/models/commerce-ui/commerce-ui.model';
import { type CartItem, CartService, type GuestCartItem } from '../../../../core/services/cart/cart.service';
import { CartItemRowComponent } from '../../components/cart-item-row/cart-item-row.component';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    AlertBannerComponent,
    ButtonComponent,
    CartItemRowComponent,
    EmptyStateComponent,
    OrderSummaryCardComponent,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-surface-page">
      <div class="mx-auto grid max-w-[var(--ui-container-xl)] gap-lg px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        <header class="flex flex-wrap items-end justify-between gap-md">
          <div class="grid gap-xs">
            <p class="type-label-sm text-text-muted">Shopping cart</p>
            <h1 class="type-heading-xl text-text-primary">Your cart</h1>
            <p class="type-body-md text-text-secondary">Review items, quantities, and totals before starting checkout.</p>
          </div>
          @if (!isEmpty()) {
            <p class="surface-panel surface-depth-raised rounded-full px-sm py-xs type-label-md text-text-secondary">
              {{ itemCountLabel() }}
            </p>
          }
        </header>

        @if (error()) {
          <app-alert-banner tone="error" title="Cart issue" [message]="error()" [dismissible]="true" (dismissed)="error.set('')" />
        }

        @if (isLoading()) {
          <section class="grid gap-lg lg:grid-cols-[var(--ui-layout-checkout-grid)]" aria-label="Loading cart">
            <div class="grid gap-md">
              @for (item of loadingRows; track item.id) {
                <app-cart-item-row [loading]="true" />
              }
            </div>
            <app-skeleton-loader shape="block" [count]="4" label="Loading order summary" />
          </section>
        } @else if (isEmpty()) {
          <app-empty-state
            type="cart"
            title="Your cart is empty"
            message="Add products to compare totals and continue to checkout."
            [action]="{ label: 'Shop products', variant: 'primary' }"
            (actionPressed)="browseProducts()"
          />
        } @else {
          <section class="grid gap-lg lg:grid-cols-[var(--ui-layout-checkout-grid)] lg:items-start">
            <div class="grid gap-md" aria-label="Cart items">
              @for (item of cartItems(); track item.id) {
                <app-cart-item-row
                  [item]="item"
                  [quantity]="item.quantity"
                  [maxQuantity]="item.maxQuantity"
                  [updating]="updatingLineId() === item.id"
                  [removing]="updatingLineId() === item.id"
                  (quantityChange)="changeQuantity(item.id, $event)"
                  (remove)="removeLine($event)"
                />
              }
            </div>

            <div class="grid gap-md">
              <app-order-summary-card
                [lines]="summaryLines()"
                [subtotal]="subtotal()"
                [total]="subtotal()"
                currency="USD"
                [sticky]="true"
              />
              <app-button [routerLink]="'/checkout/review'" size="lg" [fullWidth]="true">
                Continue to checkout
              </app-button>
              <p class="type-body-sm text-text-muted">Shipping, taxes, discounts, and payment options are confirmed during checkout.</p>
            </div>
          </section>
        }
      </div>
    </main>
  `,
})
export class CartPage implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  protected readonly loadingRows = [{ id: 'cart-loading-1' }, { id: 'cart-loading-2' }, { id: 'cart-loading-3' }] as const;
  protected readonly isLoading = signal(false);
  protected readonly updatingLineId = signal<string | null>(null);
  protected readonly error = signal('');

  protected readonly cartItems = computed<readonly UiCartItem[]>(() => {
    if (this.authService.isLoggedIn()) {
      return (this.cartService.cart()?.items ?? []).map((item) => this.authLine(item));
    }

    return this.cartService.guestItems().map((item) => this.guestLine(item));
  });
  protected readonly itemCount = computed(() => this.cartItems().reduce((count, item) => count + item.quantity, 0));
  protected readonly itemCountLabel = computed(() => `${this.itemCount()} ${this.itemCount() === 1 ? 'item' : 'items'}`);
  protected readonly subtotal = computed(() => this.cartItems().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  protected readonly summaryLines = computed<readonly UiPriceLine[]>(() =>
    this.cartItems().map((item) => ({
      id: item.id,
      label: `${item.productName} x ${item.quantity}`,
      amount: item.unitPrice * item.quantity,
    })),
  );
  protected readonly isEmpty = computed(() => !this.isLoading() && this.cartItems().length === 0);

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.isLoading.set(true);
    this.cartService
      .loadCart()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        error: () => this.error.set('Could not load your cart. Try again.'),
      });
  }

  protected changeQuantity(lineId: string, quantity: number): void {
    const item = this.cartItems().find((line) => line.id === lineId);
    if (!item || quantity < 1 || quantity > item.maxQuantity || this.updatingLineId() === lineId) {
      return;
    }

    this.error.set('');
    if (lineId.startsWith('guest-')) {
      this.cartService.updateGuestItem(Number(lineId.slice('guest-'.length)), quantity);
      return;
    }

    this.updatingLineId.set(lineId);
    this.cartService
      .updateItem(Number(lineId.slice('auth-'.length)), quantity)
      .pipe(finalize(() => this.updatingLineId.set(null)))
      .subscribe({
        error: () => this.error.set('Could not update quantity. Try again.'),
      });
  }

  protected removeLine(item: UiCartItem): void {
    this.error.set('');
    if (item.id.startsWith('guest-')) {
      this.cartService.removeGuestItem(Number(item.id.slice('guest-'.length)));
      return;
    }

    this.updatingLineId.set(item.id);
    this.cartService
      .removeItem(Number(item.id.slice('auth-'.length)))
      .pipe(finalize(() => this.updatingLineId.set(null)))
      .subscribe({
        error: () => this.error.set('Could not remove item. Try again.'),
      });
  }

  protected browseProducts(): void {
    void this.router.navigateByUrl('/products');
  }

  private authLine(item: CartItem): UiCartItem {
    return {
      id: `auth-${item.id}`,
      productName: item.product_name,
      productSlug: item.product_slug,
      imageUrl: item.primary_image ?? '',
      unitPrice: Number.parseFloat(item.unit_price_snapshot),
      currency: 'USD',
      quantity: item.quantity,
      maxQuantity: 99,
      stockStatus: 'Validated before checkout',
    };
  }

  private guestLine(item: GuestCartItem): UiCartItem {
    const availableStock = item.available_stock ?? 99;
    return {
      id: `guest-${item.product}`,
      productName: item.product_name,
      productSlug: item.product_slug,
      imageUrl: item.primary_image ?? '',
      unitPrice: Number.parseFloat(item.product_price),
      currency: 'USD',
      quantity: item.quantity,
      maxQuantity: availableStock,
      stockStatus: item.available_stock === null ? 'Validated before checkout' : `${availableStock} available`,
    };
  }
}
