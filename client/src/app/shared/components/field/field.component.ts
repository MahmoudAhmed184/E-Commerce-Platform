import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { uniqueId } from '../component-utils';

@Component({
  selector: 'app-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="grid gap-xs">
      @if (label()) {
        <label class="type-label-md text-text-primary" [for]="forId()">
          {{ label() }}
          @if (required()) {
            <span class="text-text-error" aria-hidden="true">*</span>
          }
        </label>
      }

      <ng-content />

      @if (helper() && !error()) {
        <p class="type-body-sm text-text-muted" [id]="computedHelperId()">{{ helper() }}</p>
      }

      @if (error()) {
        <p class="type-body-sm text-text-error" [id]="computedErrorId()" aria-live="polite">{{ error() }}</p>
      }
    </div>
  `,
})
export class FieldComponent {
  readonly label = input<string | null>(null);
  readonly forId = input.required<string>();
  readonly required = input(false);
  readonly helper = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly helperId = input<string | null>(null);
  readonly errorId = input<string | null>(null);

  protected readonly fieldId = uniqueId('field');
  protected readonly defaultHelperId = `${this.fieldId}-helper`;
  protected readonly defaultErrorId = `${this.fieldId}-error`;

  protected computedHelperId(): string {
    return this.helperId() ?? this.defaultHelperId;
  }

  protected computedErrorId(): string {
    return this.errorId() ?? this.defaultErrorId;
  }
}
