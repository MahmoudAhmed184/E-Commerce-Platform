import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import type { UiPaymentMethod } from '../../../../core/models/commerce-ui/commerce-ui.model';

@Component({
  selector: 'app-payment-method-selector',
  standalone: true,
  imports: [CurrencyPipe, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <fieldset class="grid gap-md" [attr.aria-describedby]="statusId">
      <legend class="mb-sm type-heading-md text-text-primary">{{ label() }}</legend>

      <div class="grid gap-sm" role="radiogroup">
        @for (card of methodCards(); track card.method.id) {
          <label [class]="card.classes">
            <input
              class="mt-2xs size-icon-md accent-surface-primary focus-visible:focus-ring"
              type="radio"
              name="payment-method"
              [value]="card.method.id"
              [checked]="card.method.id === selected()"
              [disabled]="card.disabled"
              [attr.aria-describedby]="card.errorText ? statusId : null"
              (change)="selectedChange.emit(card.method.id)"
            />
            <span class="grid flex-1 gap-2xs">
              <span class="flex items-center gap-xs type-label-lg text-text-primary">
                {{ card.method.label }}
                @if (card.method.loading) {
                  <app-spinner size="sm" label="Loading payment method" />
                }
              </span>
              <span class="type-body-sm text-text-secondary">{{ card.method.description }}</span>
              @if (card.method.id === 'wallet') {
                <span
                  class="type-body-sm"
                  [class.text-text-error]="walletInsufficient()"
                  [class.text-text-muted]="!walletInsufficient()"
                >
                  @if (walletBalance() !== null) {
                    Wallet balance: {{ walletBalance() | currency: currency() }}
                  } @else {
                    Wallet balance will be verified when the order is submitted.
                  }
                </span>
              }
              @if (card.errorText) {
                <span class="type-body-sm text-text-error">
                  {{ card.errorText }}
                </span>
              }
            </span>
          </label>
        } @empty {
          <p class="type-body-sm text-text-muted">No payment methods are available right now.</p>
        }
      </div>

      @if (selected() === 'card') {
        <div class="rounded-md border-hairline border-border-default bg-surface-subtle p-md" [attr.aria-busy]="providerReady() ? null : 'true'">
          @if (!providerReady()) {
            <div class="flex items-center gap-sm text-text-muted">
              <app-spinner size="sm" label="Preparing secure card form" />
              <span class="type-body-sm">Preparing secure card form</span>
            </div>
          }
          <ng-content select="[stripe-container]" />
        </div>
      }

      <p class="sr-only" [id]="statusId" aria-live="polite">{{ statusText() }}</p>
    </fieldset>
  `,
})
export class PaymentMethodSelectorComponent {
  readonly methods = input<readonly UiPaymentMethod[]>([]);
  readonly selected = input<'card' | 'cod' | 'wallet' | null>(null);
  readonly walletBalance = input<number | null>(null);
  readonly orderTotal = input(0);
  readonly providerReady = input(false);
  readonly currency = input('USD');
  readonly label = input('Payment method');

  readonly selectedChange = output<'card' | 'cod' | 'wallet'>();

  protected readonly statusId = 'payment-method-status';
  protected readonly walletInsufficient = computed(() => {
    const walletBalance = this.walletBalance();
    return walletBalance !== null && walletBalance < this.orderTotal();
  });
  protected readonly methodCards = computed(() =>
    this.methods().map((method) => {
      const disabled = !!method.disabled || !!method.loading || (method.id === 'wallet' && this.walletBalance() !== null && this.walletInsufficient());
      const selected = method.id === this.selected();
      const errorText = method.error ?? (method.id === 'wallet' && this.walletBalance() !== null && this.walletInsufficient()
        ? 'Your wallet balance is not enough for this order.'
        : '');

      return {
        method,
        disabled,
        errorText,
        classes: [
          'flex',
          'min-h-touch-min',
          'items-start',
          'gap-sm',
          'rounded-md',
          'border-hairline',
          'bg-surface-raised',
          'p-md',
          'interactive-transition',
          'focus-within:focus-ring',
          selected ? 'border-border-focus shadow-xs' : 'border-border-default',
          disabled ? 'opacity-disabled' : 'hover:bg-surface-subtle',
        ].join(' '),
      };
    }),
  );
  protected readonly statusText = computed(() => this.selected() ? `${this.selected()} payment selected` : 'No payment method selected');
}
