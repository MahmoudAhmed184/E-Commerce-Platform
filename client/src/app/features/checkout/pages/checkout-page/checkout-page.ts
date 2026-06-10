import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { CartService } from '../../../cart/services/cart.service';
import { CheckoutService, PaymentMethod } from '../../services/checkout.service';

type CheckoutForm = FormGroup<{
  email: FormControl<string>;
  phone: FormControl<string>;
  line1: FormControl<string>;
  city: FormControl<string>;
  state: FormControl<string>;
  postal_code: FormControl<string>;
  country: FormControl<string>;
  payment_method: FormControl<PaymentMethod>;
}>;

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    .checkout-page {
      max-width: 1180px;
      margin: 0 auto;
      padding: 64px 32px 96px;
      animation: fadeIn 0.7s var(--ease-out) both;
    }

    .checkout-topbar {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 32px;
      margin-bottom: 44px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }

    .eyebrow {
      margin-bottom: 10px;
      color: var(--color-amber);
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    .page-title {
      margin: 0;
      color: var(--color-ivory);
      font-family: var(--font-display);
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-style: italic;
      line-height: 1;
    }

    .back-link {
      color: var(--color-ivory-ghost);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-decoration: none;
      text-transform: uppercase;
      transition: color 0.2s;
    }

    .back-link:hover { color: var(--color-amber-light); }

    .checkout-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 380px;
      gap: 40px;
      align-items: start;
    }

    .form-column { display: grid; gap: 20px; }

    .section-card {
      overflow: hidden;
      background: var(--color-carbon);
      border: 1px solid var(--color-charcoal);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      animation: fadeUp 0.6s var(--ease-out) both;
    }

    .section-heading {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 22px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .section-number {
      display: grid;
      width: 32px;
      height: 32px;
      place-items: center;
      flex: 0 0 auto;
      color: var(--color-amber-light);
      background: rgba(201,148,58,0.1);
      border: 1px solid var(--color-amber-dim);
      border-radius: 50%;
      font-family: var(--font-mono);
      font-size: 0.72rem;
    }

    .section-title {
      color: var(--color-ivory);
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 600;
    }

    .section-copy {
      margin-top: 2px;
      color: var(--color-ivory-ghost);
      font-size: 0.8rem;
    }

    .section-body { padding: 24px; }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .field-grid + .field-grid, .field + .field-grid { margin-top: 18px; }
    .field-wide { grid-column: 1 / -1; }

    .field-error {
      margin-top: 6px;
      color: #ef9a9a;
      font-family: var(--font-mono);
      font-size: 0.68rem;
    }

    .payment-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .payment-option {
      position: relative;
      display: flex;
      min-height: 122px;
      padding: 18px;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      background: var(--color-obsidian);
      border: 1px solid var(--color-charcoal);
      border-radius: var(--radius-md);
      transition: border-color 0.2s, background 0.2s, transform 0.2s;
    }

    .payment-option:hover {
      border-color: var(--color-muted);
      transform: translateY(-2px);
    }

    .payment-option.selected {
      background: rgba(201,148,58,0.07);
      border-color: var(--color-amber);
      box-shadow: inset 0 0 0 1px rgba(201,148,58,0.15);
    }

    .payment-code {
      color: var(--color-amber-light);
      font-family: var(--font-mono);
      font-size: 0.68rem;
      letter-spacing: 0.12em;
    }

    .payment-name {
      display: block;
      color: var(--color-ivory);
      font-size: 0.88rem;
      font-weight: 700;
    }

    .payment-description {
      display: block;
      margin-top: 3px;
      color: var(--color-ivory-ghost);
      font-size: 0.72rem;
      line-height: 1.4;
    }

    .summary-card {
      position: sticky;
      top: 96px;
      overflow: hidden;
      background: var(--color-charcoal);
      border: 1px solid rgba(201,148,58,0.18);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
      animation: fadeIn 0.7s 0.15s var(--ease-out) both;
    }

    .summary-header {
      padding: 26px 28px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }

    .summary-title {
      color: var(--color-ivory);
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-style: italic;
    }

    .summary-count {
      margin-top: 4px;
      color: var(--color-ivory-ghost);
      font-family: var(--font-mono);
      font-size: 0.68rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .summary-items {
      max-height: 310px;
      padding: 8px 28px;
      overflow-y: auto;
    }

    .summary-item {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      padding: 15px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .item-name {
      overflow: hidden;
      color: var(--color-ivory-dim);
      font-size: 0.84rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-quantity {
      margin-top: 3px;
      color: var(--color-ivory-ghost);
      font-family: var(--font-mono);
      font-size: 0.65rem;
    }

    .item-price {
      color: var(--color-ivory);
      font-family: var(--font-mono);
      font-size: 0.8rem;
    }

    .summary-totals { padding: 22px 28px 28px; }

    .summary-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
      color: var(--color-ivory-ghost);
      font-size: 0.82rem;
    }

    .summary-row span:last-child {
      color: var(--color-ivory-dim);
      font-family: var(--font-mono);
    }

    .total-row {
      margin: 22px 0 24px;
      padding-top: 20px;
      align-items: baseline;
      border-top: 1px solid rgba(255,255,255,0.08);
      color: var(--color-ivory);
      font-family: var(--font-display);
      font-size: 1.15rem;
    }

    .total-row span:last-child {
      color: var(--color-amber-light);
      font-size: 1.4rem;
      font-weight: 700;
    }

    .place-order {
      width: 100%;
      min-height: 52px;
    }

    .security-note {
      margin-top: 16px;
      color: var(--color-ivory-ghost);
      font-family: var(--font-mono);
      font-size: 0.64rem;
      letter-spacing: 0.05em;
      line-height: 1.6;
      text-align: center;
      text-transform: uppercase;
    }

    @media (max-width: 960px) {
      .checkout-grid { grid-template-columns: 1fr; }
      .summary-card { position: static; order: -1; }
      .summary-items { max-height: none; }
    }

    @media (max-width: 640px) {
      .checkout-page { padding: 40px 18px 72px; }
      .checkout-topbar { align-items: flex-start; flex-direction: column; margin-bottom: 30px; }
      .field-grid, .payment-grid { grid-template-columns: 1fr; }
      .field-wide { grid-column: auto; }
      .section-body, .section-heading { padding-left: 18px; padding-right: 18px; }
    }
  `],
  template: `
    <main class="checkout-page">
      <header class="checkout-topbar">
        <div>
          <p class="eyebrow">Secure checkout</p>
          <h1 class="page-title">Complete Your Order</h1>
        </div>
        <a routerLink="/cart" class="back-link">Back to selection</a>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="checkout-grid">
          <div class="form-column">
            <app-error-message [message]="formError()" />

            <section class="section-card">
              <div class="section-heading">
                <span class="section-number">01</span>
                <div>
                  <h2 class="section-title">Contact details</h2>
                  <p class="section-copy">Your receipt and order updates will be sent here.</p>
                </div>
              </div>
              <div class="section-body">
                <div class="field-grid">
                  <div class="field">
                    <label for="email" class="sc-label">Email address</label>
                    <input id="email" class="sc-input" type="email" formControlName="email" autocomplete="email" placeholder="you@example.com" />
                    @if (fieldMsg('email'); as msg) { <p class="field-error">{{ msg }}</p> }
                  </div>
                  <div class="field">
                    <label for="phone" class="sc-label">Phone number</label>
                    <input id="phone" class="sc-input" type="tel" formControlName="phone" autocomplete="tel" placeholder="+20 100 000 0000" />
                    @if (fieldMsg('phone'); as msg) { <p class="field-error">{{ msg }}</p> }
                  </div>
                </div>
              </div>
            </section>

            <section class="section-card">
              <div class="section-heading">
                <span class="section-number">02</span>
                <div>
                  <h2 class="section-title">Delivery address</h2>
                  <p class="section-copy">Enter the address where you would like to receive your order.</p>
                </div>
              </div>
              <div class="section-body">
                <div class="field">
                  <label for="line1" class="sc-label">Street address</label>
                  <input id="line1" class="sc-input" type="text" formControlName="line1" autocomplete="street-address" placeholder="Building, street, district" />
                  @if (fieldMsg('line1'); as msg) { <p class="field-error">{{ msg }}</p> }
                </div>
                <div class="field-grid">
                  <div class="field">
                    <label for="city" class="sc-label">City</label>
                    <input id="city" class="sc-input" type="text" formControlName="city" autocomplete="address-level2" />
                    @if (fieldMsg('city'); as msg) { <p class="field-error">{{ msg }}</p> }
                  </div>
                  <div class="field">
                    <label for="state" class="sc-label">State / Governorate</label>
                    <input id="state" class="sc-input" type="text" formControlName="state" autocomplete="address-level1" />
                    @if (fieldMsg('state'); as msg) { <p class="field-error">{{ msg }}</p> }
                  </div>
                </div>
                <div class="field-grid">
                  <div class="field">
                    <label for="postal_code" class="sc-label">Postal code</label>
                    <input id="postal_code" class="sc-input" type="text" formControlName="postal_code" autocomplete="postal-code" />
                    @if (fieldMsg('postal_code'); as msg) { <p class="field-error">{{ msg }}</p> }
                  </div>
                  <div class="field">
                    <label for="country" class="sc-label">Country</label>
                    <input id="country" class="sc-input" type="text" formControlName="country" autocomplete="country-name" />
                    @if (fieldMsg('country'); as msg) { <p class="field-error">{{ msg }}</p> }
                  </div>
                </div>
              </div>
            </section>

            <section class="section-card">
              <div class="section-heading">
                <span class="section-number">03</span>
                <div>
                  <h2 class="section-title">Payment method</h2>
                  <p class="section-copy">Choose how you would like to complete payment.</p>
                </div>
              </div>
              <div class="section-body">
                <div class="payment-grid">
                  @for (option of paymentOptions; track option.value) {
                    <label class="payment-option" [class.selected]="form.controls.payment_method.value === option.value">
                      <input class="sr-only" type="radio" formControlName="payment_method" [value]="option.value" />
                      <span class="payment-code">{{ option.code }}</span>
                      <span>
                        <span class="payment-name">{{ option.label }}</span>
                        <span class="payment-description">{{ option.description }}</span>
                      </span>
                    </label>
                  }
                </div>
              </div>
            </section>
          </div>

          <aside class="summary-card">
            <div class="summary-header">
              <h2 class="summary-title">Order Summary</h2>
              <p class="summary-count">{{ itemCount() }} {{ itemCount() === 1 ? 'item' : 'items' }}</p>
            </div>

            <div class="summary-items">
              @if (authService.isLoggedIn()) {
                @for (item of cartService.cart()?.items ?? []; track item.id) {
                  <div class="summary-item">
                    <div>
                      <p class="item-name">{{ item.product_name }}</p>
                      <p class="item-quantity">Quantity {{ item.quantity }}</p>
                    </div>
                    <span class="item-price">&#36;{{ item.line_total }}</span>
                  </div>
                }
              } @else {
                @for (item of cartService.guestItems(); track item.product) {
                  <div class="summary-item">
                    <div>
                      <p class="item-name">{{ item.product_name }}</p>
                      <p class="item-quantity">Quantity {{ item.quantity }}</p>
                    </div>
                    <span class="item-price">&#36;{{ (parseFloat(item.product_price) * item.quantity).toFixed(2) }}</span>
                  </div>
                }
              }
            </div>

            <div class="summary-totals">
              <div class="summary-row"><span>Subtotal</span><span>&#36;{{ subtotal() }}</span></div>
              <div class="summary-row"><span>Delivery</span><span>Calculated with order</span></div>
              <div class="summary-row total-row"><span>Total</span><span>&#36;{{ subtotal() }}</span></div>

              <button class="sc-btn-primary place-order" type="submit" [disabled]="isLoading() || itemCount() === 0">
                @if (isLoading()) { <app-loading-spinner size="sm" /> }
                {{ isLoading() ? 'Placing order' : 'Place order' }}
              </button>
              <p class="security-note">Secure checkout. Your order details are protected.</p>
            </div>
          </aside>
        </div>
      </form>
    </main>
  `,
})
export class CheckoutPage {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly isLoading = signal(false);
  protected readonly formError = signal('');
  protected readonly parseFloat = parseFloat;

  protected readonly paymentOptions: {
    value: PaymentMethod;
    code: string;
    label: string;
    description: string;
  }[] = [
    { value: 'cod', code: 'COD', label: 'Cash on delivery', description: 'Pay when your order arrives.' },
    { value: 'wallet', code: 'WALLET', label: 'Wallet balance', description: 'Use your available store credit.' },
    { value: 'card', code: 'CARD', label: 'Payment card', description: 'Complete payment by card.' },
  ];

  protected readonly form: CheckoutForm = this.fb.group({
    email: [this.authService.currentUser()?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.authService.currentUser()?.phone ?? '', [Validators.required]],
    line1: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    postal_code: ['', [Validators.required]],
    country: ['Egypt', [Validators.required]],
    payment_method: ['cod' as PaymentMethod, [Validators.required]],
  });

  protected fieldMsg(field: keyof CheckoutForm['controls']): string | null {
    const control = this.form.controls[field];
    if ((control.touched || control.dirty) && control.hasError('required')) return 'This field is required.';
    if ((control.touched || control.dirty) && control.hasError('email')) return 'Enter a valid email address.';
    return null;
  }

  protected itemCount(): number {
    const items = this.authService.isLoggedIn()
      ? this.cartService.cart()?.items ?? []
      : this.cartService.guestItems();
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  protected subtotal(): string {
    return this.authService.isLoggedIn()
      ? this.cartService.cart()?.subtotal ?? '0.00'
      : this.cartService.guestSubtotal.toFixed(2);
  }

  protected submit(): void {
    this.formError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Review the highlighted fields before placing your order.');
      return;
    }

    const value = this.form.getRawValue();
    const checkoutItems = this.authService.isLoggedIn()
      ? this.cartService.cart()?.items.map((item) => ({ product: item.product, quantity: item.quantity })) ?? []
      : this.cartService.guestItems().map((item) => ({ product: item.product, quantity: item.quantity }));

    if (checkoutItems.length === 0) {
      this.formError.set('Your cart is empty.');
      return;
    }

    this.isLoading.set(true);
    this.checkoutService
      .placeOrder({
        email: value.email,
        phone: value.phone,
        shipping_address: {
          line1: value.line1,
          city: value.city,
          state: value.state,
          postal_code: value.postal_code,
          country: value.country,
        },
        payment_method: value.payment_method,
        items: checkoutItems,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (order) => {
          this.cartService.clearCartState();
          void this.router.navigate(['/orders', order.order_number]);
        },
        error: () => this.formError.set('Could not place your order. Please review your details and try again.'),
      });
  }
}
