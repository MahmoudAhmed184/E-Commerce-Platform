import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideArrowLeft, LucideArrowRight } from '@lucide/angular';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { CartService } from '../../../../core/services/cart/cart.service';
import { CheckoutService } from '../../../../core/services/checkout/checkout.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import type { UiAddress, UiPriceLine } from '../../../../core/models/commerce-ui/commerce-ui.model';
import type { UiOption, UiStepperStep } from '../../../../shared/components/ui.types';
import { AddressFormComponent } from '../../components/address-form/address-form.component';
import { CheckoutStepperComponent } from '../../components/checkout-stepper/checkout-stepper.component';
import { OrderSummaryCardComponent } from '../../../../shared/components/order-summary-card/order-summary-card.component';

@Component({
  selector: 'app-checkout-delivery-page',
  standalone: true,
  imports: [
    AddressFormComponent,
    AlertBannerComponent,
    ButtonComponent,
    CheckoutStepperComponent,
    EmptyStateComponent,
    LucideArrowLeft,
    LucideArrowRight,
    OrderSummaryCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-screen bg-surface-page">
      <div class="mx-auto grid max-w-[var(--ui-container-2xl)] gap-xl px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        <header class="grid gap-lg">
          <div class="grid max-w-[72ch] gap-xs">
            <p class="type-label-sm text-text-muted">Checkout</p>
            <h1 class="type-heading-xl text-text-primary">Delivery details</h1>
            <p class="type-body-md text-text-secondary">Enter a reachable contact and complete delivery address before payment.</p>
          </div>
          <app-checkout-stepper currentStep="delivery" [steps]="steps" />
        </header>

        @if (cartEmpty()) {
          <app-empty-state
            type="cart"
            title="Cart is empty"
            message="Add products to your cart before choosing a delivery address."
            [action]="{ label: 'Shop products', variant: 'primary' }"
            (actionPressed)="browseProducts()"
          />
        } @else {
          <section class="grid gap-xl lg:grid-cols-[var(--ui-layout-checkout-grid)] lg:items-start">
            <div class="grid gap-md">
              @if (formError()) {
                <app-alert-banner tone="error" title="Review delivery details" [message]="formError()" />
              }

              <app-address-form
                [mode]="addressFormMode()"
                [guest]="guestAddress()"
                [countryOptions]="countryOptions"
                [initialAddress]="address()"
                [fieldErrors]="fieldErrors()"
                [summaryError]="formError() || null"
                legend="Shipping address"
                (addressChange)="updateAddress($event)"
              />

              <div class="flex flex-wrap gap-sm">
                <app-button variant="secondary" [routerLink]="'/checkout/review'">
                  <svg lucideArrowLeft class="size-icon-sm" aria-hidden="true"></svg>
                  Back to review
                </app-button>
                <app-button (pressed)="continueToPayment()">
                  Continue to payment
                  <svg lucideArrowRight class="size-icon-sm" aria-hidden="true"></svg>
                </app-button>
              </div>
            </div>

            <div class="grid gap-md">
              <app-order-summary-card
                [lines]="summaryLines()"
                [subtotal]="subtotal()"
                [total]="subtotal()"
                currency="USD"
                [sticky]="true"
                [loading]="isLoadingCart()"
              />
              <p class="type-body-sm text-text-muted">
                Payment is enabled after the required delivery fields are complete.
              </p>
            </div>
          </section>
        }
      </div>
    </main>
  `,
})
export class DeliveryPage implements OnInit {
  protected readonly steps: readonly UiStepperStep[] = [
    { id: 'review', label: 'Review order', href: '/checkout/review', status: 'completed' },
    { id: 'delivery', label: 'Delivery', href: '/checkout/delivery', status: 'current' },
    { id: 'payment', label: 'Payment', href: '/checkout/payment', status: 'upcoming' },
  ];
  protected readonly countryOptions: readonly UiOption[] = [
    { label: 'United States', value: 'US' },
    { label: 'Canada', value: 'CA' },
    { label: 'United Kingdom', value: 'GB' },
  ];

  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly router = inject(Router);

  protected readonly isLoadingCart = signal(false);
  protected readonly address = signal<UiAddress>(emptyAddress());
  protected readonly fieldErrors = signal<Record<string, string | undefined>>({});
  protected readonly formError = signal('');
  protected readonly subtotal = computed(() => {
    if (this.authService.isLoggedIn()) {
      return Number.parseFloat(this.cartService.cart()?.subtotal ?? '0');
    }
    return this.cartService.guestSubtotal;
  });
  protected readonly summaryLines = computed<readonly UiPriceLine[]>(() => {
    if (this.authService.isLoggedIn()) {
      return (this.cartService.cart()?.items ?? []).map((item) => ({
        id: `auth-${item.id}`,
        label: `${item.product_name} x ${item.quantity}`,
        amount: Number.parseFloat(item.line_total),
      }));
    }

    return this.cartService.guestItems().map((item) => ({
      id: `guest-${item.product}`,
      label: `${item.product_name} x ${item.quantity}`,
      amount: Number.parseFloat(item.product_price) * item.quantity,
    }));
  });
  protected readonly cartEmpty = computed(() => this.summaryLines().length === 0);
  protected readonly addressFormMode = computed(() => (this.authService.isLoggedIn() ? 'auth' : 'guest'));
  protected readonly guestAddress = computed(() => !this.authService.isLoggedIn());

  ngOnInit(): void {
    this.address.set(this.checkoutService.getSavedDeliveryAddress(this.authService.currentUser()?.email ?? ''));

    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.isLoadingCart.set(true);
    this.cartService
      .loadCart()
      .pipe(finalize(() => this.isLoadingCart.set(false)))
      .subscribe({
        error: () => this.formError.set('Could not load checkout totals. Try again.'),
      });
  }

  protected updateAddress(address: UiAddress): void {
    this.address.set(address);
  }

  protected continueToPayment(): void {
    const errors = validateAddress(this.address(), !this.authService.isLoggedIn());
    this.fieldErrors.set(errors);

    if (Object.keys(errors).length) {
      this.formError.set('Complete the required delivery fields before continuing to payment.');
      return;
    }

    this.formError.set('');
    this.checkoutService.saveDeliveryAddress(this.address()).subscribe(() => {
      void this.router.navigateByUrl('/checkout/payment');
    });
  }

  protected browseProducts(): void {
    void this.router.navigateByUrl('/products');
  }
}

export function validateAddress(address: UiAddress, guest: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (guest && !address.email?.trim()) errors['email'] = 'Email is required for guest checkout.';
  if (!address.name.trim()) errors['name'] = 'Full name is required.';
  if (!address.phone.trim()) errors['phone'] = 'Phone is required.';
  if (!address.addressLine1.trim()) errors['addressLine1'] = 'Address line 1 is required.';
  if (!address.city.trim()) errors['city'] = 'City is required.';
  if (!address.region.trim()) errors['region'] = 'Region is required.';
  if (!address.postalCode.trim()) errors['postalCode'] = 'Postal code is required.';
  if (!address.country.trim()) errors['country'] = 'Country is required.';
  return errors;
}

function emptyAddress(): UiAddress {
  return {
    name: '',
    email: '',
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
