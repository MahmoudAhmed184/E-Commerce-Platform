import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { uniqueId } from '../component-utils';
import { FieldComponent } from '../field/field.component';
import { InputControlComponent, type InputControlType as PrimitiveInputControlType } from '../input-control/input-control.component';
import { SpinnerComponent } from '../spinner/spinner.component';
import { TextareaComponent } from '../textarea/textarea.component';

export type InputControlType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'search' | 'textarea';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [FieldComponent, InputControlComponent, SpinnerComponent, TextareaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <app-field [label]="label()" [forId]="controlId" [required]="required()" [helper]="helper()" [error]="error()" [helperId]="helperId" [errorId]="errorId">
      <div class="relative">
        @if (type() === 'textarea') {
          <app-textarea
            [id]="controlId"
            [name]="name() || controlId"
            [value]="value()"
            [placeholder]="placeholder()"
            [required]="required()"
            [disabled]="disabled() || loading()"
            [maxLength]="maxLength()"
            [autocomplete]="autocomplete()"
            [invalid]="!!error()"
            [describedBy]="describedBy()"
            (valueChange)="valueChange.emit($event)"
            (blurred)="blurred.emit()"
          />
        } @else {
          <app-ui-input
            [id]="controlId"
            [name]="name() || controlId"
            [type]="primitiveType()"
            [value]="value()"
            [placeholder]="placeholder()"
            [required]="required()"
            [disabled]="disabled() || loading()"
            [min]="min()"
            [max]="max()"
            [maxLength]="maxLength()"
            [autocomplete]="autocomplete()"
            [invalid]="!!error()"
            [describedBy]="describedBy()"
            (valueChange)="valueChange.emit($event)"
            (blurred)="blurred.emit()"
          />
        }

        @if (loading()) {
          <span class="absolute inset-y-0 end-sm inline-flex items-center text-icon-muted">
            <app-spinner size="sm" label="Checking field" />
          </span>
        }
      </div>
    </app-field>
  `,
})
export class InputComponent {
  readonly type = input<InputControlType>('text');
  readonly label = input.required<string>();
  readonly value = input<string | number>('');
  readonly placeholder = input('');
  readonly required = input(false);
  readonly autocomplete = input<string | null>(null);
  readonly min = input<number | string | null>(null);
  readonly max = input<number | string | null>(null);
  readonly maxLength = input<number | null>(null);
  readonly error = input<string | null>(null);
  readonly helper = input<string | null>(null);
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly name = input<string | null>(null);

  readonly valueChange = output<string>();
  readonly blurred = output<void>();

  protected readonly controlId = uniqueId('input');
  protected readonly helperId = `${this.controlId}-helper`;
  protected readonly errorId = `${this.controlId}-error`;
  protected readonly describedBy = computed(() => {
    const ids = [];
    if (this.helper()) {
      ids.push(this.helperId);
    }
    if (this.error()) {
      ids.push(this.errorId);
    }
    return ids.length ? ids.join(' ') : null;
  });
  protected readonly primitiveType = computed<PrimitiveInputControlType>(() => {
    const type = this.type();
    return type === 'textarea' ? 'text' : type;
  });
}
