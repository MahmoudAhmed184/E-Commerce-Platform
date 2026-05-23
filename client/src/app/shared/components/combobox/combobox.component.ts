import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { inputValue, uniqueId } from '../component-utils';
import { FieldComponent } from '../field/field.component';
import { SpinnerComponent } from '../spinner/spinner.component';
import type { UiOption } from '../ui.types';

@Component({
  selector: 'app-combobox',
  standalone: true,
  imports: [FieldComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <app-field [label]="label()" [forId]="controlId" [required]="required()" [helper]="helper()" [error]="error()" [helperId]="helperId" [errorId]="errorId">
      <div class="relative">
        <input
          class="min-h-control-md w-full rounded-sm border-hairline border-glass-border bg-glass-white-6 px-sm py-xs text-text-primary shadow-glass-flat backdrop-blur-md interactive-transition placeholder:text-text-muted focus-visible:border-border-focus focus-visible:focus-ring disabled:state-disabled aria-invalid:border-border-error"
          role="combobox"
          aria-autocomplete="list"
          [id]="controlId"
          [value]="searchText()"
          [placeholder]="placeholder()"
          [required]="required()"
          [disabled]="disabled() || loading()"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="listboxId"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          (input)="updateSearch(inputValue($event))"
          (focus)="open.set(true)"
          (keydown.escape)="open.set(false)"
        />

        @if (loading()) {
          <span class="absolute inset-y-0 end-sm inline-flex items-center text-icon-muted">
            <app-spinner size="sm" label="Loading options" />
          </span>
        }

        @if (open()) {
          <ul
            class="glass-panel glass-depth-floating absolute z-dropdown mt-2xs max-h-thumbnail-lg w-full overflow-auto rounded-md p-2xs"
            role="listbox"
            [id]="listboxId"
          >
            @if (loading()) {
              <li class="px-sm py-xs text-text-muted" role="option" aria-disabled="true" aria-selected="false">Loading options</li>
            } @else {
              @for (option of filteredOptions(); track option.value) {
                <li>
                  <button
                    class="min-h-control-sm w-full rounded-sm px-sm py-xs text-start text-text-primary interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring disabled:state-disabled"
                    type="button"
                    role="option"
                    [attr.aria-selected]="option.value === value()"
                    [disabled]="option.disabled"
                    (click)="choose(option)"
                  >
                    <span class="block type-label-md">{{ option.label }}</span>
                    @if (option.helper) {
                      <span class="block type-body-sm text-text-muted">{{ option.helper }}</span>
                    }
                  </button>
                </li>
              } @empty {
                <li class="px-sm py-xs text-text-muted" role="option" aria-disabled="true" aria-selected="false">No options found</li>
              }
            }
          </ul>
        }
      </div>
    </app-field>
  `,
})
export class ComboboxComponent {
  readonly label = input.required<string>();
  readonly options = input<readonly UiOption[]>([]);
  readonly value = input<string | number | null>(null);
  readonly placeholder = input('Search options');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly helper = input<string | null>(null);
  readonly required = input(false);

  readonly valueChange = output<string | number>();
  readonly searchChange = output<string>();

  protected readonly controlId = uniqueId('combobox');
  protected readonly listboxId = `${this.controlId}-listbox`;
  protected readonly helperId = `${this.controlId}-helper`;
  protected readonly errorId = `${this.controlId}-error`;
  protected readonly open = signal(false);
  protected readonly searchText = signal('');
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
  protected readonly filteredOptions = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    if (!query) {
      return this.options();
    }
    return this.options().filter((option) => option.label.toLowerCase().includes(query));
  });

  protected inputValue(event: Event): string {
    return inputValue(event);
  }

  protected updateSearch(value: string): void {
    this.searchText.set(value);
    this.searchChange.emit(value);
    this.open.set(true);
  }

  protected choose(option: UiOption): void {
    if (option.disabled) {
      return;
    }
    this.searchText.set(option.label);
    this.open.set(false);
    this.valueChange.emit(option.value);
  }
}
