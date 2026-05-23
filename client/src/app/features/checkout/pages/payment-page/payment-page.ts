import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { CartService } from '../../../../core/services/cart/cart.service';
import { CheckoutService, type PaymentMethod } from '../../../../core/services/checkout/checkout.service';
import { AlertDialogComponent } from '../../../../shared/components/alert-dialog/alert-dialog.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import type { UiPaymentMethod, UiPriceLine } from '../../../../core/models/commerce-ui/commerce-ui.model';
import type { UiAction, UiStepperStep } from '../../../../shared/components/ui.types';
import { CheckoutStepperComponent } from '../../components/checkout-stepper/checkout-stepper.component';
import { OrderSummaryCardComponent } from '../../components/order-summary-card/order-summary-card.component';
import { PaymentMethodSelectorComponent } from '../../components/payment-method-selector/payment-method-selector.component';
import { CheckoutPaymentWorkflowService, type CheckoutPaymentPreflightResult, type CheckoutPaymentWorkflowResult } from '../../services/checkout-payment-workflow/checkout-payment-workflow.service';

@Component({
  selector: 'app-checkout-payment-page',
  standalone: true,
  imports: [
    AlertDialogComponent,
    AlertBannerComponent,
    ButtonComponent,
    CheckoutStepperComponent,
    EmptyStateComponent,
    OrderSummaryCardComponent,
    PaymentMethodSelectorComponent,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-surface-page">
      <div class="mx-auto grid max-w-[var(--ui-container-xl)] gap-lg px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        <header class="grid gap-md">
          <div class="grid gap-xs">
            <p class="type-label-sm text-text-muted">Checkout</p>
            <h1 class="type-heading-xl text-text-primary">Payment</h1>
            <p class="type-body-md text-text-secondary">Choose how you want to pay. Your order is created after payment details are confirmed.</p>
          </div>
          <app-checkout-stepper currentStep="payment" [steps]="steps" />
        </header>

        @if (formError()) {
          <app-alert-banner tone="error" title="Payment issue" [message]="formError()" [dismissible]="true" (dismissed)="formError.set('')" />
        }

        @if (cartEmpty()) {
          <app-empty-state
            type="cart"
            title="Cart is empty"
            message="Add products to your cart before selecting a payment method."
            [action]="{ label: 'Shop products', variant: 'primary' }"
            (actionPressed)="browseProducts()"
          />
        } @else {
          <section class="grid gap-lg lg:grid-cols-[var(--ui-layout-checkout-grid)] lg:items-start">
            <div class="grid gap-md rounded-md border-hairline border-border-default bg-surface-raised p-md shadow-xs">
              <app-payment-method-selector
                [methods]="methods()"
                [selected]="selectedMethod()"
                [walletBalance]="walletBalance"
                [orderTotal]="orderTotal()"
                [providerReady]="true"
                currency="USD"
                (selectedChange)="setSelectedMethod($event)"
              >
                <div stripe-container aria-label="Card payment status" class="type-body-sm text-text-secondary">
                  Card payments are submitted securely and confirmed before the order is marked as paid.
                </div>
              </app-payment-method-selector>

              <div class="flex flex-wrap gap-sm">
                <app-button [loading]="placingOrder()" (pressed)="placeOrder()">Place order</app-button>
                <a
                  class="inline-flex min-h-control-md items-center justify-center rounded-md border-hairline border-border-default bg-surface-raised px-md py-xs type-label-md text-text-primary interactive-transition hover:bg-surface-subtle focus-visible:focus-ring"
                  routerLink="/checkout/delivery"
                >
                  Back to delivery
                </a>
              </div>
            </div>

            <app-order-summary-card
              [lines]="summaryLines()"
              [subtotal]="subtotal()"
              [charges]="charges"
              [total]="orderTotal()"
              currency="USD"
              paymentStatus="Pending"
              [sticky]="true"
              [loading]="isLoadingCart()"
            />
          </section>
        }
      </div>

      <app-alert-dialog
        title="Confirm cash on delivery"
        description="Place this order only after confirming the delivery contact and address are correct."
        [open]="codModalOpen()"
        [confirmAction]="codConfirmAction()"
        [cancelAction]="{ label: 'Review payment', variant: 'secondary' }"
        (confirmPressed)="confirmOrder()"
        (cancelPressed)="codModalOpen.set(false)"
        (closed)="codModalOpen.set(false)"
      />
    </main>
  `,
})
export class PaymentPage implements OnInit {
  protected readonly steps: readonly UiStepperStep[] = [
    { id: 'review', label: 'Review order', href: '/checkout/review', status: 'completed' },
    { id: 'delivery', label: 'Delivery', href: '/checkout/delivery', status: 'completed' },
    { id: 'payment', label: 'Payment', href: '/checkout/payment', status: 'current' },
  ];
  protected readonly walletBalance: number | null = null;
  protected readonly charges = [
    { label: 'Shipping', amount: 0, tone: 'neutral' as const },
    { label: 'Tax', amount: 0, tone: 'neutral' as const },
  ] as const;

  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly paymentWorkflow = inject(CheckoutPaymentWorkflowService);
  private readonly router = inject(Router);

  protected readonly isLoadingCart = signal(false);
  protected readonly selectedMethod = this.checkoutService.selectedPaymentMethod;
  protected readonly placingOrder = signal(false);
  protected readonly formError = signal('');
  protected readonly codModalOpen = signal(false);
  protected readonly subtotal = computed(() => {
    if (this.authService.isLoggedIn()) {
      return Number.parseFloat(this.cartService.cart()?.subtotal ?? '0');
    }
    return this.cartService.guestSubtotal;
  });
  protected readonly orderTotal = computed(() => this.subtotal());
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
  protected readonly methods = computed<readonly UiPaymentMethod[]>(() => [
    {
      id: 'card',
      label: 'Card',
      description: 'Pay securely by card and receive confirmation after payment is approved.',
    },
    {
      id: 'cod',
      label: 'Cash on delivery',
      description: 'Pay in cash when the order arrives.',
    },
    {
      id: 'wallet',
      label: 'Wallet',
      description: this.authService.isLoggedIn()
        ? 'Use your saved wallet balance when the order is submitted.'
        : 'Sign in to use wallet payments.',
      disabled: !this.authService.isLoggedIn(),
    },
  ]);
  protected readonly codConfirmAction = computed<UiAction>(() => ({ label: 'Confirm COD', variant: 'primary', loading: this.placingOrder() }));

  ngOnInit(): void {
    this.paymentWorkflow.ensureDeliveryAddressDraft();

    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.isLoadingCart.set(true);
    this.cartService
      .loadCart()
      .pipe(finalize(() => this.isLoadingCart.set(false)))
      .subscribe({
        error: () => this.formError.set('Could not load payment totals. Try again.'),
      });
  }

  protected placeOrder(): void {
    this.formError.set('');
    this.applyPaymentPreflight(
      this.paymentWorkflow.prepareOrder({
        cartEmpty: this.cartEmpty(),
        loggedIn: this.authService.isLoggedIn(),
        paymentMethod: this.selectedMethod(),
      }),
    );
  }

  protected confirmOrder(): void {
    this.placingOrder.set(true);
    this.paymentWorkflow
      .placeOrder(this.selectedMethod())
      .pipe(finalize(() => this.placingOrder.set(false)))
      .subscribe((result) => this.applyOrderPlacement(result));
  }

  protected browseProducts(): void {
    void this.router.navigateByUrl('/products');
  }

  protected setSelectedMethod(method: PaymentMethod): void {
    this.checkoutService.selectPaymentMethod(method);
  }

  private applyPaymentPreflight(result: CheckoutPaymentPreflightResult): void {
    switch (result.status) {
      case 'blocked':
        this.formError.set(result.message);
        return;
      case 'cod-confirmation-required':
        this.codModalOpen.set(true);
        return;
      case 'ready':
        this.confirmOrder();
        return;
    }
  }

  private applyOrderPlacement(result: CheckoutPaymentWorkflowResult): void {
    this.codModalOpen.set(false);
    switch (result.status) {
      case 'placed':
        void this.router.navigate(['/orders', result.order.order_number]);
        return;
      case 'delivery-required':
        this.formError.set(result.message);
        void this.router.navigateByUrl('/checkout/delivery');
        return;
      case 'failed':
        this.formError.set(result.message);
        return;
    }
  }
}
