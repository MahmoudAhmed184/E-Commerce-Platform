import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { uniqueId } from '../component-utils';
import { FieldComponent } from '../field/field.component';
import { SpinnerComponent } from '../spinner/spinner.component';
import type { UiOption } from '../ui.types';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [FieldComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <app-field [label]="label()" [forId]="controlId" [required]="required()" [helper]="helper()" [error]="error()" [helperId]="helperId" [errorId]="errorId">
      <div class="relative" (focusout)="handleFocusOut($event)">
        <button
          class="flex min-h-control-md w-full items-center justify-between gap-sm rounded-sm border-hairline border-glass-border bg-glass-white-6 px-sm py-xs text-start text-text-primary shadow-glass-flat backdrop-blur-md interactive-transition focus-visible:border-border-focus focus-visible:focus-ring disabled:state-disabled aria-invalid:border-border-error"
          [id]="controlId"
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="listboxId"
          [attr.aria-required]="required() ? 'true' : null"
          [disabled]="disabled() || loading()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          (click)="toggle()"
          (keydown.escape)="open.set(false)"
          (keydown.arrowDown)="open.set(true)"
        >
          <span class="min-w-0 truncate type-label-md" [class.text-text-muted]="!selectedOption()">
            {{ displayLabel() }}
          </span>
          <span class="shrink-0 text-icon-muted" aria-hidden="true">⌄</span>
        </button>

        @if (loading()) {
          <span class="pointer-events-none absolute inset-y-0 end-xl inline-flex items-center text-icon-muted">
            <app-spinner size="sm" label="Loading options" />
          </span>
        }

        @if (open()) {
          <ul
            class="glass-panel glass-depth-floating absolute z-dropdown mt-2xs grid max-h-[18rem] w-full overflow-auto rounded-md p-2xs"
            role="listbox"
            [id]="listboxId"
            [attr.aria-labelledby]="controlId"
          >
            @for (option of options(); track option.value) {
              <li>
                <button
                  class="grid min-h-control-sm w-full gap-2xs rounded-sm px-sm py-xs text-start text-text-primary interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring disabled:state-disabled"
                  type="button"
                  role="option"
                  [disabled]="option.disabled"
                  [attr.aria-selected]="isSelected(option)"
                  (click)="choose(option)"
                >
                  <span class="type-label-md">{{ option.label }}</span>
                  @if (option.helper) {
                    <span class="type-body-sm text-text-muted">{{ option.helper }}</span>
                  }
                </button>
              </li>
            } @empty {
              <li class="px-sm py-xs type-body-sm text-text-muted" role="option" aria-disabled="true" aria-selected="false">No options available</li>
            }
          </ul>
        }
      </div>
    </app-field>
  `,
})
export class SelectComponent {
  readonly label = input.required<string>();
  readonly options = input<readonly UiOption[]>([]);
  readonly value = input<string | number | null>(null);
  readonly placeholder = input('Select an option');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly helper = input<string | null>(null);
  readonly required = input(false);

  readonly valueChange = output<string | number>();

  protected readonly controlId = uniqueId('select');
  protected readonly listboxId = `${this.controlId}-listbox`;
  protected readonly errorId = `${this.controlId}-error`;
  protected readonly helperId = `${this.controlId}-helper`;
  protected readonly open = signal(false);
  protected readonly selectedOption = computed(() => this.options().find((option) => this.isSelected(option)) ?? null);
  protected readonly displayLabel = computed(() => this.selectedOption()?.label ?? this.placeholder());
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

  protected toggle(): void {
    if (this.disabled() || this.loading()) {
      return;
    }
    this.open.update((value) => !value);
  }

  protected choose(option: UiOption): void {
    if (option.disabled) {
      return;
    }
    this.valueChange.emit(option.value);
    this.open.set(false);
  }

  protected isSelected(option: UiOption): boolean {
    return String(option.value) === String(this.value() ?? '');
  }

  protected handleFocusOut(event: FocusEvent): void {
    if (event.currentTarget instanceof HTMLElement && event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    this.open.set(false);
  }
}
