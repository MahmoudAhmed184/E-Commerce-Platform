import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CheckoutService, Order } from '../../../checkout/services/checkout.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-2xl px-4 py-10">
      @if (isLoading()) {
        <div class="mt-10 flex justify-center"><app-loading-spinner size="md" /></div>
      } @else if (error()) {
        <app-error-message [message]="error()" />
      } @else if (order(); as o) {
        <div class="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p class="text-4xl">✅</p>
          <h1 class="mt-3 text-xl font-semibold text-green-800">Order Confirmed!</h1>
          <p class="mt-1 text-sm text-green-700">Order <span class="font-mono font-bold">{{ o.order_number }}</span></p>
        </div>

        <div class="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div class="divide-y divide-slate-100">
            @for (item of o.items; track item.id) {
              <div class="flex justify-between px-6 py-4 text-sm">
                <span class="text-slate-700">{{ item.product_name }} × {{ item.quantity }}</span>
                <span class="font-medium text-slate-900">${{ item.line_total }}</span>
              </div>
            }
          </div>
          <div class="border-t border-slate-200 px-6 py-4">
            <div class="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span><span>${{ o.subtotal }}</span>
            </div>
            @if (o.shipping_amount !== '0.00') {
              <div class="flex justify-between text-sm text-slate-600 mt-1">
                <span>Shipping</span><span>${{ o.shipping_amount }}</span>
              </div>
            }
            <div class="mt-2 flex justify-between text-base font-semibold text-slate-900">
              <span>Total</span><span>${{ o.total_amount }}</span>
            </div>
          </div>
          <div class="border-t border-slate-200 px-6 py-3 flex gap-4 text-xs text-slate-500">
            <span>Status: <span class="font-medium text-slate-700">{{ o.status }}</span></span>
            <span>Payment: <span class="font-medium text-slate-700">{{ o.payment_status }}</span></span>
          </div>
        </div>

        <div class="mt-6 flex justify-center">
          <a routerLink="/products"
            class="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
            Continue Shopping
          </a>
        </div>
      }
    </section>
  `,
})
export class OrderConfirmationPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly checkoutService = inject(CheckoutService);

  protected readonly order = signal<Order | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    const orderNumber = this.route.snapshot.paramMap.get('orderNumber') ?? '';
    this.isLoading.set(true);
    this.checkoutService
      .getOrder(orderNumber)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (o) => this.order.set(o),
        error: () => this.error.set('Could not load order details.'),
      });
  }
}
