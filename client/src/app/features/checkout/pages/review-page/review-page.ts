import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { type CartItem, CartService, type GuestCartItem } from '../../../../core/services/cart/cart.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import type { UiCartItem, UiPriceLine } from '../../../../core/models/commerce-ui/commerce-ui.model';
import type { UiStepperStep } from '../../../../shared/components/ui.types';
import { CartItemRowComponent } from '../../../cart/components/cart-item-row/cart-item-row.component';
import { CheckoutStepperComponent } from '../../components/checkout-stepper/checkout-stepper.component';
import { OrderSummaryCardComponent } from '../../components/order-summary-card/order-summary-card.component';

@Component({
  selector: 'app-checkout-review-page',
  standalone: true,
  imports: [
    AlertBannerComponent,
    CartItemRowComponent,
    CheckoutStepperComponent,
    EmptyStateComponent,
    OrderSummaryCardComponent,
    RouterLink,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-surface-page">
      <div class="mx-auto grid max-w-[var(--ui-container-xl)] gap-lg px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        <header class="grid gap-md">
          <div class="grid gap-xs">
            <p class="type-label-sm text-text-muted">Checkout</p>
            <h1 class="type-heading-xl text-text-primary">Review order</h1>
            <p class="type-body-md text-text-secondary">Confirm items and quantities before entering delivery details.</p>
          </div>
          <app-checkout-stepper currentStep="review" [steps]="steps" />
        </header>

        @if (error()) {
          <app-alert-banner tone="error" title="Checkout issue" [message]="error()" [dismissible]="true" (dismissed)="error.set('')" />
        }

        @if (isLoading()) {
          <section class="grid gap-lg lg:grid-cols-[var(--ui-layout-checkout-grid)]" aria-label="Loading checkout review">
            <div class="grid gap-md">
              @for (item of loadingRows; track item.id) {
                <app-cart-item-row [loading]="true" />
              }
            </div>
            <app-skeleton-loader shape="block" [count]="4" label="Loading checkout total" />
          </section>
        } @else if (cartItems().length === 0) {
          <app-empty-state
            type="cart"
            title="Cart is empty"
            message="Add products to your cart before starting checkout."
            [action]="{ label: 'Shop products', variant: 'primary' }"
            (actionPressed)="browseProducts()"
          />
        } @else {
          <section class="grid gap-lg lg:grid-cols-[var(--ui-layout-checkout-grid)] lg:items-start">
            <div class="grid gap-md" aria-label="Checkout items">
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
              <app-order-summary-card [lines]="summaryLines()" [subtotal]="subtotal()" [total]="subtotal()" currency="USD" [sticky]="true" />
              <a
                class="inline-flex min-h-control-lg items-center justify-center rounded-md bg-surface-primary px-lg py-sm type-label-lg text-text-on-primary interactive-transition hover:bg-primary-600 focus-visible:focus-ring"
                routerLink="/checkout/delivery"
              >
                Continue to delivery
              </a>
              <a
                class="inline-flex min-h-control-md items-center justify-center rounded-md border-hairline border-border-default bg-surface-raised px-md py-xs type-label-md text-text-primary interactive-transition hover:bg-surface-subtle focus-visible:focus-ring"
                routerLink="/cart"
              >
                Back to cart
              </a>
            </div>
          </section>
        }
      </div>
    </main>
  `,
})
export class ReviewPage implements OnInit {
  protected readonly steps: readonly UiStepperStep[] = [
    { id: 'review', label: 'Review order', href: '/checkout/review', status: 'current' },
    { id: 'delivery', label: 'Delivery', href: '/checkout/delivery', status: 'upcoming' },
    { id: 'payment', label: 'Payment', href: '/checkout/payment', status: 'upcoming' },
  ];

  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  protected readonly loadingRows = [{ id: 'review-loading-1' }, { id: 'review-loading-2' }, { id: 'review-loading-3' }] as const;
  protected readonly isLoading = signal(false);
  protected readonly updatingLineId = signal<string | null>(null);
  protected readonly error = signal('');
  protected readonly cartItems = computed<readonly UiCartItem[]>(() => {
    if (this.authService.isLoggedIn()) {
      return (this.cartService.cart()?.items ?? []).map((item) => this.authLine(item));
    }

    return this.cartService.guestItems().map((item) => this.guestLine(item));
  });
  protected readonly subtotal = computed(() => this.cartItems().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  protected readonly summaryLines = computed<readonly UiPriceLine[]>(() =>
    this.cartItems().map((item) => ({ id: item.id, label: `${item.productName} x ${item.quantity}`, amount: item.unitPrice * item.quantity })),
  );

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.isLoading.set(true);
    this.cartService
      .loadCart()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        error: () => this.error.set('Could not load checkout items. Try again.'),
      });
  }

  protected changeQuantity(lineId: string, quantity: number): void {
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
      stockStatus: 'Verified at checkout',
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
      stockStatus: item.available_stock === null ? 'Verified at checkout' : `${availableStock} available`,
    };
  }
}
