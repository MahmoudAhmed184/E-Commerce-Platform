import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { inputValue, uniqueId } from '../component-utils';

export interface PriceRangeValue {
  min: number | null;
  max: number | null;
}

@Component({
  selector: 'app-price-range-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <fieldset class="grid gap-sm" [attr.aria-describedby]="errorMessage() ? errorId : null">
      <legend class="type-label-md text-text-primary">{{ label() }}</legend>
      <div class="grid min-w-0 gap-sm">
        <label class="grid min-w-0 gap-2xs type-label-sm text-text-secondary">
          Minimum {{ currency() }}
          <input class="no-number-spin min-h-control-md w-full min-w-0 rounded-sm border-hairline border-glass-border bg-glass-white-6 px-sm py-xs text-text-primary shadow-glass-flat backdrop-blur-md focus-visible:border-border-focus focus-visible:focus-ring aria-invalid:border-border-error" type="number" [value]="min() ?? ''" [attr.aria-invalid]="errorMessage() ? 'true' : null" (input)="change('min', $event)" />
        </label>
        <label class="grid min-w-0 gap-2xs type-label-sm text-text-secondary">
          Maximum {{ currency() }}
          <input class="no-number-spin min-h-control-md w-full min-w-0 rounded-sm border-hairline border-glass-border bg-glass-white-6 px-sm py-xs text-text-primary shadow-glass-flat backdrop-blur-md focus-visible:border-border-focus focus-visible:focus-ring aria-invalid:border-border-error" type="number" [value]="max() ?? ''" [attr.aria-invalid]="errorMessage() ? 'true' : null" (input)="change('max', $event)" />
        </label>
      </div>

      @if (errorMessage()) {
        <p class="type-body-sm text-text-error" [id]="errorId" aria-live="polite">{{ errorMessage() }}</p>
      }

      @if (applyMode() === 'manual') {
        <button class="min-h-control-md w-full rounded-md border-hairline border-glass-border bg-[linear-gradient(135deg,var(--ui-color-iridescent-violet),var(--ui-color-iridescent-cyan),var(--ui-color-iridescent-emerald))] px-md type-label-md text-text-on-primary shadow-glass-raised interactive-transition hover:shadow-glass-floating focus-visible:focus-ring disabled:state-disabled" type="button" [disabled]="!!errorMessage()" (click)="applied.emit({ min: min(), max: max() })">
          Apply price
        </button>
      }
    </fieldset>
  `,
})
export class PriceRangeControlComponent {
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly currency = input('USD');
  readonly label = input('Price range');
  readonly applyMode = input<'manual' | 'instant'>('manual');

  readonly rangeChange = output<PriceRangeValue>();
  readonly applied = output<PriceRangeValue>();

  protected readonly errorId = uniqueId('price-range-error');
  protected readonly errorMessage = computed(() => {
    const min = this.min();
    const max = this.max();
    return min !== null && max !== null && min > max ? 'Minimum price cannot be greater than maximum price.' : null;
  });

  protected change(key: 'min' | 'max', event: Event): void {
    const raw = inputValue(event);
    const value = raw === '' ? null : Number(raw);
    const next = key === 'min' ? { min: value, max: this.max() } : { min: this.min(), max: value };
    this.rangeChange.emit(next);
    if (this.applyMode() === 'instant') {
      this.applied.emit(next);
    }
  }
}
