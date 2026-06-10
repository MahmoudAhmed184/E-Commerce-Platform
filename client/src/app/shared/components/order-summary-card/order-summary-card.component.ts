import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { UiOrderSummaryCharge, UiPriceLine } from '../../../core/models/commerce-ui/commerce-ui.model';
import { BadgeComponent } from '../badge/badge.component';
import { uniqueId } from '../component-utils';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-order-summary-card',
  standalone: true,
  imports: [BadgeComponent, CurrencyPipe, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <aside [class]="classes()" [attr.aria-labelledby]="titleId">
      <div class="flex items-start justify-between gap-md">
        <div class="grid gap-2xs">
          <p class="type-label-sm text-text-muted">Checkout total</p>
          <h2 class="type-heading-md text-text-primary" [id]="titleId">Order summary</h2>
        </div>
        @if (!loading() && !error()) {
          <app-badge tone="neutral" [label]="itemCountLabel()" />
        }
      </div>

      @if (loading()) {
        <app-skeleton-loader [rows]="5" label="Loading order summary" />
      } @else if (error()) {
        <div class="rounded-md border-hairline border-border-error bg-surface-error p-sm text-text-error" role="alert">
          {{ error() }}
        </div>
      } @else {
        <dl class="grid gap-md">
          <div class="grid gap-sm">
            @for (line of lines(); track line.id) {
              <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-md">
                <dt class="min-w-0 type-body-sm text-text-secondary">{{ line.label }}</dt>
                <dd class="shrink-0 type-body-sm text-text-primary">{{ line.amount | currency: currency() }}</dd>
              </div>
            } @empty {
              <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-md">
                <dt class="type-body-sm text-text-secondary">Items</dt>
                <dd class="type-body-sm text-text-muted">No items</dd>
              </div>
            }
          </div>

          <div class="grid gap-sm border-t-hairline border-border-default pt-md">
            <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-md">
              <dt class="type-body-sm text-text-secondary">Subtotal</dt>
              <dd class="type-body-sm text-text-primary">{{ subtotal() | currency: currency() }}</dd>
            </div>

            @for (charge of displayCharges(); track charge.id) {
              <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-md">
                <dt class="type-body-sm text-text-secondary">{{ charge.label }}</dt>
                <dd [class]="charge.classes">{{ charge.amount | currency: currency() }}</dd>
              </div>
            }
          </div>

          <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-md border-t-hairline border-border-default pt-md">
            <dt class="type-heading-sm text-text-primary">Total</dt>
            <dd class="type-heading-md text-text-primary">{{ total() | currency: currency() }}</dd>
          </div>
        </dl>

        @if (paymentStatus()) {
          <div class="pt-2xs">
            <app-badge tone="info" [label]="paymentStatus() ?? ''" />
          </div>
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

  protected readonly titleId = uniqueId('order-summary-title');
  protected readonly itemCountLabel = computed(() => {
    const count = this.lines().length;
    return count === 1 ? '1 item' : `${count} items`;
  });
  protected readonly classes = computed(() => [
    'surface-panel',
    'surface-depth-raised',
    'grid',
    'gap-lg',
    'rounded-md',
    'p-md',
    'text-text-primary',
    'md:p-lg',
    this.sticky() ? 'lg:sticky lg:top-[calc(4.75rem+var(--ui-gutter-lg))]' : '',
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
