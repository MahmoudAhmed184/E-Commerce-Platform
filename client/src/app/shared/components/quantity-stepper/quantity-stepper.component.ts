import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideMinus, LucidePlus } from '@lucide/angular';

import { inputValue, uniqueId } from '../component-utils';
import { ButtonGroupComponent } from '../button-group/button-group.component';

@Component({
  selector: 'app-quantity-stepper',
  standalone: true,
  imports: [ButtonGroupComponent, LucideMinus, LucidePlus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="grid gap-2xs">
      <app-button-group [label]="groupLabel()">
        <button
          class="size-control-md border-e-hairline border-glass-border text-text-primary interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring disabled:state-disabled"
          type="button"
          [disabled]="disabled() || loading() || value() <= min()"
          [attr.aria-label]="'Decrease quantity for ' + itemLabel()"
          (click)="setValue(value() - step())"
        >
          <svg lucideMinus class="mx-auto size-icon-sm" aria-hidden="true"></svg>
        </button>
        <input
          class="no-number-spin h-control-md min-w-control-md bg-transparent text-center type-label-md text-text-primary focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-100 disabled:text-text-muted"
          [id]="inputId"
          type="number"
          [value]="value()"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [disabled]="disabled() || loading()"
          [attr.aria-label]="'Quantity for ' + itemLabel()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="error() ? errorId : null"
          (input)="handleInput($event)"
        />
        <button
          class="size-control-md border-s-hairline border-glass-border text-text-primary interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring disabled:state-disabled"
          type="button"
          [disabled]="disabled() || loading() || value() >= max()"
          [attr.aria-label]="'Increase quantity for ' + itemLabel()"
          (click)="setValue(value() + step())"
        >
          <svg lucidePlus class="mx-auto size-icon-sm" aria-hidden="true"></svg>
        </button>
      </app-button-group>

      @if (error()) {
        <p class="type-body-sm text-text-error" [id]="errorId" aria-live="polite">{{ error() }}</p>
      }
    </div>
  `,
})
export class QuantityStepperComponent {
  readonly value = input(1);
  readonly min = input(1);
  readonly max = input(99);
  readonly step = input(1);
  readonly itemLabel = input.required<string>();
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly valueChange = output<number>();

  protected readonly inputId = uniqueId('quantity');
  protected readonly errorId = `${this.inputId}-error`;
  protected readonly groupLabel = computed(() => `Quantity for ${this.itemLabel()}`);

  protected handleInput(event: Event): void {
    this.setValue(Number(inputValue(event)));
  }

  protected setValue(nextValue: number): void {
    if (this.disabled() || this.loading()) {
      return;
    }
    const bounded = Math.min(Math.max(nextValue, this.min()), this.max());
    this.valueChange.emit(bounded);
  }
}
