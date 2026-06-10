import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { CheckoutService, Order } from '../../../checkout/services/checkout.service';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [DatePipe, RouterLink, LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    .order-page {
      max-width: 980px;
      margin: 0 auto;
      padding: 64px 32px 96px;
      animation: fadeIn 0.7s var(--ease-out) both;
    }

    .loading-state { padding: 100px 0; text-align: center; }

    .success-panel {
      position: relative;
      overflow: hidden;
      padding: 46px;
      background:
        radial-gradient(circle at 90% 20%, rgba(201,148,58,0.16), transparent 34%),
        var(--color-carbon);
      border: 1px solid rgba(201,148,58,0.32);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-glow);
    }

    .success-panel::after {
      content: '';
      position: absolute;
      width: 180px;
      height: 180px;
      right: -70px;
      bottom: -90px;
      border: 1px solid rgba(201,148,58,0.14);
      border-radius: 50%;
    }

    .success-mark {
      display: grid;
      width: 50px;
      height: 50px;
      margin-bottom: 24px;
      place-items: center;
      color: var(--color-void);
      background: linear-gradient(135deg, var(--color-amber), var(--color-amber-light));
      border-radius: 50%;
      font-size: 1.4rem;
      font-weight: 700;
    }

    .eyebrow {
      color: var(--color-amber);
      font-family: var(--font-mono);
      font-size: 0.68rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    .page-title {
      margin: 8px 0 12px;
      color: var(--color-ivory);
      font-family: var(--font-display);
      font-size: clamp(2.4rem, 5vw, 3.6rem);
      font-style: italic;
      line-height: 1.05;
    }

    .success-copy {
      max-width: 580px;
      color: var(--color-ivory-dim);
      line-height: 1.7;
    }

    .order-meta {
      display: flex;
      gap: 28px;
      margin-top: 30px;
      flex-wrap: wrap;
    }

    .meta-label {
      display: block;
      margin-bottom: 4px;
      color: var(--color-ivory-ghost);
      font-family: var(--font-mono);
      font-size: 0.6rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .meta-value {
      color: var(--color-ivory);
      font-family: var(--font-mono);
      font-size: 0.8rem;
    }

    .details-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 24px;
      margin-top: 24px;
      align-items: start;
    }

    .detail-card {
      overflow: hidden;
      background: var(--color-carbon);
      border: 1px solid var(--color-charcoal);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
    }

    .card-heading {
      padding: 22px 24px;
      color: var(--color-ivory);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-style: italic;
    }

    .order-item {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 20px;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .item-name {
      color: var(--color-ivory-dim);
      font-size: 0.9rem;
      font-weight: 700;
    }

    .item-meta {
      margin-top: 4px;
      color: var(--color-ivory-ghost);
      font-family: var(--font-mono);
      font-size: 0.66rem;
    }

    .item-price {
      color: var(--color-ivory);
      font-family: var(--font-mono);
      font-size: 0.85rem;
    }

    .totals { padding: 22px 24px; }

    .total-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 11px;
      color: var(--color-ivory-ghost);
      font-size: 0.8rem;
    }

    .total-row span:last-child {
      color: var(--color-ivory-dim);
      font-family: var(--font-mono);
    }

    .grand-total {
      margin: 20px 0 0;
      padding-top: 18px;
      align-items: baseline;
      color: var(--color-ivory);
      border-top: 1px solid rgba(255,255,255,0.08);
      font-family: var(--font-display);
      font-size: 1.08rem;
    }

    .grand-total span:last-child {
      color: var(--color-amber-light);
      font-size: 1.25rem;
      font-weight: 700;
    }

    .status-card { padding: 26px; }

    .status-title {
      margin-bottom: 22px;
      color: var(--color-ivory);
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-style: italic;
    }

    .status-line {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 13px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      color: var(--color-ivory-ghost);
      font-size: 0.78rem;
    }

    .status-line strong {
      color: var(--color-ivory-dim);
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .status-line strong.success { color: #8ed3a4; }
    .status-line strong.danger { color: #ef9a9a; }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }

    @media (max-width: 780px) {
      .order-page { padding: 40px 18px 72px; }
      .success-panel { padding: 32px 24px; }
      .details-grid { grid-template-columns: 1fr; }
    }
  `],
  template: `
    <main class="order-page">
      @if (isLoading()) {
        <div class="loading-state"><app-loading-spinner size="md" /></div>
      } @else if (error()) {
        <app-error-message [message]="error()" />
      } @else if (order(); as currentOrder) {
        <section class="success-panel">
          <div class="success-mark" aria-hidden="true">✓</div>
          <p class="eyebrow">{{ currentOrder.status === 'confirmed' ? 'Order confirmed' : 'Order received' }}</p>
          <h1 class="page-title">Thank You for Your Order</h1>
          <p class="success-copy">
            Your order has been received. Keep the order number below for reference while we prepare your purchase.
          </p>
          <div class="order-meta">
            <div>
              <span class="meta-label">Order number</span>
              <span class="meta-value">{{ currentOrder.order_number }}</span>
            </div>
            <div>
              <span class="meta-label">Placed on</span>
              <span class="meta-value">{{ currentOrder.created_at | date:'medium' }}</span>
            </div>
            <div>
              <span class="meta-label">Total</span>
              <span class="meta-value">&#36;{{ currentOrder.total_amount }}</span>
            </div>
          </div>
        </section>

        <div class="details-grid">
          <section class="detail-card">
            <h2 class="card-heading">Purchased Items</h2>
            @for (item of currentOrder.items; track item.id) {
              <div class="order-item">
                <div>
                  <p class="item-name">{{ item.product_name }}</p>
                  <p class="item-meta">{{ item.quantity }} × &#36;{{ item.unit_price }}</p>
                </div>
                <span class="item-price">&#36;{{ item.line_total }}</span>
              </div>
            }
            <div class="totals">
              <div class="total-row"><span>Subtotal</span><span>&#36;{{ currentOrder.subtotal }}</span></div>
              @if (currentOrder.shipping_amount !== '0.00') {
                <div class="total-row"><span>Delivery</span><span>&#36;{{ currentOrder.shipping_amount }}</span></div>
              }
              @if (currentOrder.tax_amount !== '0.00') {
                <div class="total-row"><span>Tax</span><span>&#36;{{ currentOrder.tax_amount }}</span></div>
              }
              @if (currentOrder.discount_amount !== '0.00') {
                <div class="total-row"><span>Discount</span><span>-&#36;{{ currentOrder.discount_amount }}</span></div>
              }
              <div class="total-row grand-total"><span>Total</span><span>&#36;{{ currentOrder.total_amount }}</span></div>
            </div>
          </section>

          <aside>
            <section class="detail-card status-card">
              <h2 class="status-title">Order Status</h2>
              <div class="status-line">
                <span>Fulfilment</span>
                <strong [class.success]="isSuccess(currentOrder.status)" [class.danger]="isFailure(currentOrder.status)">
                  {{ label(currentOrder.status) }}
                </strong>
              </div>
              <div class="status-line">
                <span>Payment</span>
                <strong [class.success]="isSuccess(currentOrder.payment_status)" [class.danger]="isFailure(currentOrder.payment_status)">
                  {{ label(currentOrder.payment_status) }}
                </strong>
              </div>
              @if (currentOrder.payment; as payment) {
                <div class="status-line"><span>Method</span><strong>{{ label(payment.method) }}</strong></div>
              }
            </section>

            <div class="actions">
              <a routerLink="/products" class="sc-btn-primary">Continue shopping</a>
              <a routerLink="/orders" class="sc-btn-ghost">All orders</a>
            </div>
          </aside>
        </div>
      }
    </main>
  `,
})
export class OrderConfirmationPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly checkoutService = inject(CheckoutService);

  protected readonly order = signal<Order | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    const orderNumber = this.route.snapshot.paramMap.get('orderNumber') ?? '';
    if (!orderNumber) {
      this.isLoading.set(false);
      this.error.set('No order number was provided.');
      return;
    }

    this.checkoutService
      .getOrder(orderNumber)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (order) => this.order.set(order),
        error: () => this.error.set('Could not load order details.'),
      });
  }

  protected label(value: string): string {
    return value.replaceAll('_', ' ');
  }

  protected isSuccess(value: string): boolean {
    return value === 'confirmed' || value === 'paid';
  }

  protected isFailure(value: string): boolean {
    return value === 'failed' || value === 'cancelled';
  }
}
