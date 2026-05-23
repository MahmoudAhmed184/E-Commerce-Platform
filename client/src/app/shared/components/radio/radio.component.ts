import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { uniqueId } from '../component-utils';

@Component({
  selector: 'app-radio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="grid gap-2xs">
      <label class="flex min-h-touch-min items-start gap-xs text-text-primary">
        <input
          class="mt-2xs size-icon-md border-hairline border-glass-border bg-glass-white-6 accent-iridescent-cyan focus-visible:focus-ring disabled:state-disabled"
          type="radio"
          [id]="controlId"
          [name]="name()"
          [value]="value()"
          [checked]="isChecked()"
          [disabled]="disabled()"
          [required]="required()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="error() ? errorId : null"
          (change)="selected.emit(value())"
        />
        <span class="grid gap-3xs">
          <span class="type-label-md">{{ label() }}</span>
          @if (helper()) {
            <span class="type-body-sm text-text-muted">{{ helper() }}</span>
          }
        </span>
      </label>

      @if (error()) {
        <p class="type-body-sm text-text-error" [id]="errorId" aria-live="polite">{{ error() }}</p>
      }
    </div>
  `,
})
export class RadioComponent {
  readonly checked = input(false);
  readonly modelValue = input<string | number | null>(null);
  readonly value = input.required<string | number>();
  readonly name = input.required<string>();
  readonly label = input.required<string>();
  readonly helper = input<string | null>(null);
  readonly disabled = input(false);
  readonly required = input(false);
  readonly error = input<string | null>(null);

  readonly selected = output<string | number>();

  protected readonly controlId = uniqueId('radio');
  protected readonly errorId = `${this.controlId}-error`;
  protected readonly isChecked = computed(() => this.checked() || this.modelValue() === this.value());
}
