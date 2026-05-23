import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import type { UiOrderSummaryCharge, UiPriceLine } from '../../../../core/models/commerce-ui/commerce-ui.model';

@Component({
  selector: 'app-order-summary-card',
  standalone: true,
  imports: [BadgeComponent, CurrencyPipe, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <aside [class]="classes()" aria-labelledby="order-summary-title">
      <h2 class="type-heading-md text-text-primary" id="order-summary-title">Order summary</h2>

      @if (loading()) {
        <app-skeleton-loader [rows]="5" label="Loading order summary" />
      } @else if (error()) {
        <div class="rounded-md border-hairline border-border-error bg-error-50 p-sm text-text-error shadow-glass-flat" role="alert">
          {{ error() }}
        </div>
      } @else {
        <dl class="grid gap-sm">
          @for (line of lines(); track line.id) {
            <div class="flex justify-between gap-md">
              <dt class="type-body-sm text-text-secondary">{{ line.label }}</dt>
              <dd class="type-body-sm text-text-primary">{{ line.amount | currency: currency() }}</dd>
            </div>
          } @empty {
            <div class="flex justify-between gap-md">
              <dt class="type-body-sm text-text-secondary">Items</dt>
              <dd class="type-body-sm text-text-muted">No items</dd>
            </div>
          }

          <div class="flex justify-between gap-md border-t-hairline border-glass-border pt-sm">
            <dt class="type-body-sm text-text-secondary">Subtotal</dt>
            <dd class="type-body-sm text-text-primary">{{ subtotal() | currency: currency() }}</dd>
          </div>

          @for (charge of displayCharges(); track charge.id) {
            <div class="flex justify-between gap-md">
              <dt class="type-body-sm text-text-secondary">{{ charge.label }}</dt>
              <dd [class]="charge.classes">{{ charge.amount | currency: currency() }}</dd>
            </div>
          }

          <div class="flex justify-between gap-md border-t-hairline border-glass-border pt-sm">
            <dt class="type-heading-sm text-text-primary">Total</dt>
            <dd class="type-heading-sm text-text-primary">{{ total() | currency: currency() }}</dd>
          </div>
        </dl>

        @if (paymentStatus()) {
          <app-badge tone="info" [label]="paymentStatus() ?? ''" />
        }
      }
    </aside>
  `,
})
export class OrderSummaryCardComponent {
  readonly lines = input<readonly UiPriceLine[]>([]);
  readonly subtotal = input(0);
  readonly charges = input<readonly UiOrderSummaryCharge[]>([]);
  readonly total = input(0);
  readonly currency = input('USD');
  readonly paymentStatus = input<string | null>(null);
  readonly sticky = input(false);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  protected readonly classes = computed(() => [
    'grid',
    'gap-md',
    'glass-panel',
    'glass-depth-floating',
    'rounded-lg',
    'p-md',
    this.sticky() ? 'lg:sticky lg:top-gutter-lg' : '',
  ].filter(Boolean).join(' '));
  protected readonly displayCharges = computed(() => this.charges().map((charge) => ({ ...charge, id: charge.id ?? charge.label, classes: chargeClass(charge) })));
}

function chargeClass(charge: UiOrderSummaryCharge): string {
  const tones: Record<NonNullable<UiOrderSummaryCharge['tone']>, string> = {
    neutral: 'text-text-primary',
    success: 'text-text-success',
    warning: 'text-text-warning',
    error: 'text-text-error',
  };
  return `type-body-sm ${tones[charge.tone ?? 'neutral']}`;
}
