import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { inputChecked, uniqueId } from '../component-utils';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="grid gap-2xs">
      <label class="flex min-h-touch-min items-start gap-xs text-text-primary">
        <input
          class="mt-2xs size-icon-md rounded-sm border-hairline border-border-default bg-surface-raised accent-surface-primary focus-visible:focus-ring disabled:state-disabled"
          type="checkbox"
          [id]="controlId"
          [name]="name()"
          [value]="value()"
          [checked]="checked()"
          [disabled]="disabled()"
          [required]="required()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="error() ? errorId : null"
          (change)="checkedChange.emit(inputChecked($event))"
        />
        <span [class]="labelHidden() ? 'sr-only' : 'grid gap-3xs'">
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
export class CheckboxComponent {
  readonly checked = input(false);
  readonly value = input<string | number>('on');
  readonly name = input<string | null>(null);
  readonly label = input.required<string>();
  readonly labelHidden = input(false);
  readonly helper = input<string | null>(null);
  readonly disabled = input(false);
  readonly required = input(false);
  readonly error = input<string | null>(null);

  readonly checkedChange = output<boolean>();

  protected readonly controlId = uniqueId('checkbox');
  protected readonly errorId = `${this.controlId}-error`;

  protected inputChecked(event: Event): boolean {
    return inputChecked(event);
  }
}
