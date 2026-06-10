import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { CheckoutService, Order } from '../../../checkout/services/checkout.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [DatePipe, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    .orders-page {
      max-width: 1080px;
      margin: 0 auto;
      padding: 64px 32px 96px;
      animation: fadeIn 0.7s var(--ease-out) both;
    }

    .orders-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 32px;
      margin-bottom: 42px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }

    .eyebrow {
      margin-bottom: 10px;
      color: var(--color-amber);
      font-family: var(--font-mono);
      font-size: 0.68rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    .page-title {
      color: var(--color-ivory);
      font-family: var(--font-display);
      font-size: clamp(2.6rem, 5vw, 4rem);
      font-style: italic;
      line-height: 1;
    }

    .page-copy {
      max-width: 440px;
      color: var(--color-ivory-ghost);
      font-size: 0.9rem;
      line-height: 1.7;
      text-align: right;
    }

    .orders-list { display: grid; gap: 16px; }

    .order-card {
      display: grid;
      grid-template-columns: 1.2fr 1fr auto;
      gap: 28px;
      padding: 24px 28px;
      align-items: center;
      color: inherit;
      background: var(--color-carbon);
      border: 1px solid var(--color-charcoal);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      text-decoration: none;
      transition: transform 0.25s var(--ease-out), border-color 0.25s, box-shadow 0.25s;
      animation: fadeUp 0.55s var(--ease-out) both;
    }

    .order-card:hover {
      transform: translateY(-3px);
      border-color: rgba(201,148,58,0.4);
      box-shadow: var(--shadow-lift);
    }

    .order-number {
      color: var(--color-ivory);
      font-family: var(--font-mono);
      font-size: 0.88rem;
      font-weight: 500;
      letter-spacing: 0.04em;
    }

    .order-date {
      margin-top: 6px;
      color: var(--color-ivory-ghost);
      font-size: 0.78rem;
    }

    .status-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .status {
      padding: 6px 9px;
      border: 1px solid var(--color-muted);
      border-radius: 999px;
      color: var(--color-ivory-dim);
      font-family: var(--font-mono);
      font-size: 0.61rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .status.confirmed, .status.paid {
      color: #8ed3a4;
      background: rgba(45,138,78,0.09);
      border-color: rgba(45,138,78,0.45);
    }

    .status.cancelled, .status.failed {
      color: #ef9a9a;
      background: rgba(160,48,48,0.09);
      border-color: rgba(160,48,48,0.45);
    }

    .order-total { text-align: right; }

    .total-label {
      display: block;
      color: var(--color-ivory-ghost);
      font-family: var(--font-mono);
      font-size: 0.61rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .total-value {
      display: block;
      margin-top: 4px;
      color: var(--color-amber-light);
      font-family: var(--font-mono);
      font-size: 1.15rem;
      font-weight: 600;
    }

    .empty-state {
      padding: 96px 24px;
      text-align: center;
      background: var(--color-carbon);
      border: 1px solid var(--color-charcoal);
      border-radius: var(--radius-xl);
    }

    .empty-title {
      color: var(--color-ivory);
      font-family: var(--font-display);
      font-size: 2rem;
      font-style: italic;
    }

    .empty-copy {
      margin: 10px 0 28px;
      color: var(--color-ivory-ghost);
    }

    .loading-state { padding: 100px 0; text-align: center; }

    @media (max-width: 760px) {
      .orders-page { padding: 40px 18px 72px; }
      .orders-header { align-items: flex-start; flex-direction: column; }
      .page-copy { text-align: left; }
      .order-card { grid-template-columns: 1fr auto; gap: 18px; padding: 22px; }
      .status-row { grid-column: 1 / -1; grid-row: 2; }
      .order-total { grid-column: 2; grid-row: 1; }
    }
  `],
  template: `
    <main class="orders-page">
      <header class="orders-header">
        <div>
          <p class="eyebrow">Your account</p>
          <h1 class="page-title">Order History</h1>
        </div>
        <p class="page-copy">Review your purchases, payment state, and current order progress.</p>
      </header>

      @if (isLoading()) {
        <div class="loading-state"><app-loading-spinner size="md" /></div>
      } @else if (error()) {
        <app-error-message [message]="error()" />
      } @else if (orders().length === 0) {
        <section class="empty-state">
          <h2 class="empty-title">No orders yet</h2>
          <p class="empty-copy">Your completed purchases will appear here.</p>
          <a routerLink="/products" class="sc-btn-primary">Explore collection</a>
        </section>
      } @else {
        <div class="orders-list">
          @for (order of orders(); track order.id; let index = $index) {
            <a class="order-card" [routerLink]="['/orders', order.order_number]" [style.animation-delay]="index * 0.06 + 's'">
              <div>
                <p class="order-number">{{ order.order_number }}</p>
                <p class="order-date">{{ order.created_at | date:'mediumDate' }} at {{ order.created_at | date:'shortTime' }}</p>
              </div>
              <div class="status-row">
                <span class="status" [class]="order.status">{{ label(order.status) }}</span>
                <span class="status" [class]="order.payment_status">{{ label(order.payment_status) }}</span>
              </div>
              <div class="order-total">
                <span class="total-label">Total</span>
                <span class="total-value">&#36;{{ order.total_amount }}</span>
              </div>
            </a>
          }
        </div>
      }
    </main>
  `,
})
export class OrderHistoryPage implements OnInit {
  private readonly checkoutService = inject(CheckoutService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.checkoutService
      .getOrders()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (orders) => this.orders.set(orders),
        error: () => this.error.set('Could not load your orders. Please try again.'),
      });
  }

  protected label(value: string): string {
    return value.replaceAll('_', ' ');
  }
}
