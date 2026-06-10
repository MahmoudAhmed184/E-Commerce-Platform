import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { inputValue } from '../component-utils';

export type InputControlType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'search';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <input
      class="min-h-touch-min w-full rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs type-body-sm text-text-primary shadow-xs interactive-transition placeholder:text-text-muted focus-visible:border-border-focus focus-visible:focus-ring disabled:state-disabled aria-invalid:border-border-error"
      [id]="id()"
      [name]="name() || id()"
      [type]="type()"
      [value]="value()"
      [placeholder]="placeholder()"
      [required]="required()"
      [disabled]="disabled()"
      [attr.min]="min()"
      [attr.max]="max()"
      [attr.maxlength]="maxLength()"
      [attr.autocomplete]="autocomplete()"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="describedBy()"
      (input)="valueChange.emit(inputValue($event))"
      (blur)="blurred.emit()"
    />
  `,
})
export class InputControlComponent {
  readonly id = input.required<string>();
  readonly type = input<InputControlType>('text');
  readonly value = input<string | number>('');
  readonly placeholder = input('');
  readonly required = input(false);
  readonly autocomplete = input<string | null>(null);
  readonly min = input<number | string | null>(null);
  readonly max = input<number | string | null>(null);
  readonly maxLength = input<number | null>(null);
  readonly invalid = input(false);
  readonly disabled = input(false);
  readonly name = input<string | null>(null);
  readonly describedBy = input<string | null>(null);

  readonly valueChange = output<string>();
  readonly blurred = output<void>();

  protected inputValue(event: Event): string {
    return inputValue(event);
  }
}
