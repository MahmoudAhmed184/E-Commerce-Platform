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
      <div class="relative" (focusout)="handleFocusOut($event)">
        <input
          class="min-h-touch-min w-full rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs type-body-sm text-text-primary shadow-xs interactive-transition placeholder:text-text-muted focus-visible:border-border-focus focus-visible:focus-ring disabled:state-disabled aria-invalid:border-border-error"
          role="combobox"
          aria-autocomplete="list"
          [id]="controlId"
          [value]="searchText()"
          [placeholder]="placeholder()"
          [required]="required()"
          [disabled]="disabled() || loading()"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="listboxId"
          [attr.aria-activedescendant]="activeDescendant()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          (input)="updateSearch(inputValue($event))"
          (focus)="openList()"
          (keydown)="handleKeydown($event)"
        />

        @if (loading()) {
          <span class="absolute inset-y-0 end-sm inline-flex items-center text-icon-muted">
            <app-spinner size="sm" label="Loading options" />
          </span>
        }

        @if (open()) {
          <ul
            class="surface-panel surface-depth-floating absolute z-dropdown mt-2xs max-h-thumbnail-lg w-full overflow-auto rounded-md p-2xs"
            role="listbox"
            [id]="listboxId"
            [attr.aria-labelledby]="controlId"
          >
            @if (loading()) {
              <li class="px-sm py-xs text-text-muted" role="option" aria-disabled="true" aria-selected="false">Loading options</li>
            } @else {
              @for (option of filteredOptions(); track option.value; let index = $index) {
                <li
                  class="grid min-h-touch-min cursor-pointer gap-2xs rounded-sm px-sm py-xs text-start text-text-primary interactive-transition hover:bg-surface-subtle aria-disabled:state-disabled"
                  role="option"
                  tabindex="-1"
                  [id]="optionId(index)"
                  [attr.aria-selected]="isSelected(option)"
                  [attr.aria-disabled]="option.disabled ? 'true' : null"
                  [class.bg-surface-subtle]="isActiveIndex(index)"
                  [class.text-text-muted]="option.disabled"
                  (mouseenter)="activateIndex(index)"
                  (mousedown)="$event.preventDefault()"
                  (click)="choose(option)"
                  (keydown.enter)="choose(option)"
                  (keydown.space)="choose(option)"
                >
                  <span class="block type-label-md">{{ option.label }}</span>
                  @if (option.helper) {
                    <span class="block type-body-sm text-text-muted">{{ option.helper }}</span>
                  }
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
  protected readonly activeIndex = signal(-1);
  protected readonly activeDescendant = computed(() => (this.open() && this.activeIndex() >= 0 ? this.optionId(this.activeIndex()) : null));
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
    this.activateFirst();
  }

  protected choose(option: UiOption): void {
    if (option.disabled) {
      return;
    }
    this.searchText.set(option.label);
    this.close();
    this.valueChange.emit(option.value);
  }

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected isSelected(option: UiOption): boolean {
    return String(option.value) === String(this.value() ?? '');
  }

  protected isActiveIndex(index: number): boolean {
    return this.activeIndex() === index;
  }

  protected activateIndex(index: number): void {
    if (this.filteredOptions()[index]?.disabled) {
      return;
    }
    this.activeIndex.set(index);
  }

  protected openList(): void {
    if (this.disabled() || this.loading()) {
      return;
    }
    this.open.set(true);
    if (this.activeIndex() < 0) {
      this.activateSelectedOrFirst();
    }
  }

  protected handleFocusOut(event: FocusEvent): void {
    if (event.currentTarget instanceof HTMLElement && event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    this.close();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (this.disabled() || this.loading()) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.openList();
        this.moveActive(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.openList();
        this.moveActive(-1);
        return;
      case 'Home':
        if (!this.open()) {
          return;
        }
        event.preventDefault();
        this.activateFirst();
        return;
      case 'End':
        if (!this.open()) {
          return;
        }
        event.preventDefault();
        this.activateLast();
        return;
      case 'Enter':
        if (!this.open()) {
          return;
        }
        event.preventDefault();
        {
          const option = this.filteredOptions()[this.activeIndex()];
          if (option) {
            this.choose(option);
          }
        }
        return;
      case 'Escape':
        event.preventDefault();
        this.close();
        return;
      default:
        return;
    }
  }

  private close(): void {
    this.open.set(false);
  }

  private moveActive(delta: 1 | -1): void {
    const options = this.filteredOptions();
    if (!options.length) {
      this.activeIndex.set(-1);
      return;
    }

    const startIndex = this.activeIndex() < 0 ? (delta > 0 ? -1 : options.length) : this.activeIndex();
    for (let step = 1; step <= options.length; step += 1) {
      const index = (startIndex + delta * step + options.length) % options.length;
      if (!options[index]?.disabled) {
        this.activeIndex.set(index);
        return;
      }
    }
  }

  private activateSelectedOrFirst(): void {
    const selectedIndex = this.filteredOptions().findIndex((option) => this.isSelected(option) && !option.disabled);
    if (selectedIndex >= 0) {
      this.activeIndex.set(selectedIndex);
      return;
    }
    this.activateFirst();
  }

  private activateFirst(): void {
    this.activeIndex.set(this.filteredOptions().findIndex((option) => !option.disabled));
  }

  private activateLast(): void {
    const options = this.filteredOptions();
    for (let index = options.length - 1; index >= 0; index -= 1) {
      if (!options[index]?.disabled) {
        this.activeIndex.set(index);
        return;
      }
    }
    this.activeIndex.set(-1);
  }
}
