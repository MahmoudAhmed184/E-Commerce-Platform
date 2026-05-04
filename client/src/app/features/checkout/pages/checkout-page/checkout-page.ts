import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../cart/services/cart.service';
import { CheckoutService, PaymentMethod } from '../../services/checkout.service';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

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
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-2xl px-4 py-10">
      <h1 class="text-2xl font-semibold text-slate-950">Checkout</h1>

      <form class="mt-8 space-y-6" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-error-message [message]="formError()" />

        <!-- Contact -->
        <fieldset class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <legend class="px-1 text-sm font-semibold text-slate-700">Contact</legend>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
              <input id="email" type="email" formControlName="email" autocomplete="email"
                class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              @if (fieldMsg('email'); as msg) {
                <p class="mt-1 text-sm text-red-600">{{ msg }}</p>
              }
            </div>
            <div>
              <label for="phone" class="block text-sm font-medium text-slate-700">Phone</label>
              <input id="phone" type="tel" formControlName="phone" autocomplete="tel"
                class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              @if (fieldMsg('phone'); as msg) {
                <p class="mt-1 text-sm text-red-600">{{ msg }}</p>
              }
            </div>
          </div>
        </fieldset>

        <!-- Shipping -->
        <fieldset class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <legend class="px-1 text-sm font-semibold text-slate-700">Shipping Address</legend>
          <div class="mt-4 grid gap-4">
            <div>
              <label for="line1" class="block text-sm font-medium text-slate-700">Street Address</label>
              <input id="line1" type="text" formControlName="line1" autocomplete="street-address"
                class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              @if (fieldMsg('line1'); as msg) {
                <p class="mt-1 text-sm text-red-600">{{ msg }}</p>
              }
            </div>
            <div class="grid gap-4 sm:grid-cols-3">
              <div>
                <label for="city" class="block text-sm font-medium text-slate-700">City</label>
                <input id="city" type="text" formControlName="city" autocomplete="address-level2"
                  class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label for="state" class="block text-sm font-medium text-slate-700">State</label>
                <input id="state" type="text" formControlName="state" autocomplete="address-level1"
                  class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label for="postal_code" class="block text-sm font-medium text-slate-700">Postal Code</label>
                <input id="postal_code" type="text" formControlName="postal_code" autocomplete="postal-code"
                  class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label for="country" class="block text-sm font-medium text-slate-700">Country</label>
              <input id="country" type="text" formControlName="country" autocomplete="country-name"
                class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </fieldset>

        <!-- Payment method -->
        <fieldset class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <legend class="px-1 text-sm font-semibold text-slate-700">Payment Method</legend>
          <div class="mt-4 flex flex-wrap gap-3">
            @for (option of paymentOptions; track option.value) {
              <label class="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors"
                [class.border-indigo-500]="form.controls.payment_method.value === option.value"
                [class.bg-indigo-50]="form.controls.payment_method.value === option.value"
                [class.text-indigo-700]="form.controls.payment_method.value === option.value"
                [class.border-slate-200]="form.controls.payment_method.value !== option.value"
                [class.text-slate-700]="form.controls.payment_method.value !== option.value">
                <input type="radio" formControlName="payment_method" [value]="option.value" class="sr-only" />
                {{ option.label }}
              </label>
            }
          </div>
        </fieldset>

        <!-- Order summary -->
        <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-semibold text-slate-700">Order Summary</p>
          <div class="mt-4 flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span class="font-semibold text-slate-900">
              @if (authService.isLoggedIn()) {
                ${{ cartService.cart()?.subtotal ?? '0.00' }}
              } @else {
                ${{ cartService.guestSubtotal.toFixed(2) }}
              }
            </span>
          </div>
        </div>

        <button
          type="submit"
          class="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          [disabled]="isLoading()"
        >
          @if (isLoading()) {
            <app-loading-spinner size="sm" />
          }
          Place Order
        </button>
      </form>
    </section>
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

  protected readonly paymentOptions: { value: PaymentMethod; label: string }[] = [
    { value: 'cod', label: 'Cash on Delivery' },
    { value: 'wallet', label: 'Wallet' },
    { value: 'card', label: 'Card' },
  ];

  protected readonly form: CheckoutForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    line1: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    postal_code: ['', [Validators.required]],
    country: ['', [Validators.required]],
    payment_method: ['cod' as PaymentMethod, [Validators.required]],
  });

  protected fieldMsg(field: keyof CheckoutForm['controls']): string | null {
    const ctrl = this.form.controls[field];
    if ((ctrl.touched || ctrl.dirty) && ctrl.hasError('required')) return 'This field is required.';
    if ((ctrl.touched || ctrl.dirty) && ctrl.hasError('email')) return 'Enter a valid email.';
    return null;
  }

  protected submit(): void {
    this.formError.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.getRawValue();
    const guestItems = this.cartService.guestItems().map((i) => ({
      product: i.product,
      quantity: i.quantity,
    }));

    this.isLoading.set(true);
    this.checkoutService
      .placeOrder({
        email: v.email,
        phone: v.phone,
        shipping_address: { line1: v.line1, city: v.city, state: v.state, postal_code: v.postal_code, country: v.country },
        payment_method: v.payment_method,
        ...(!this.authService.isLoggedIn() && { items: guestItems }),
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (order) => {
          this.cartService.clearGuestCart();
          void this.router.navigate(['/orders', order.order_number]);
        },
        error: () => this.formError.set('Could not place your order. Please try again.'),
      });
  }
}
