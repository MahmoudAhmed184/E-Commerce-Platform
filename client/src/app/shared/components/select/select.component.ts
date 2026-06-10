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
          class="flex min-h-touch-min w-full items-center justify-between gap-sm rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-start text-text-primary shadow-xs interactive-transition focus-visible:border-border-focus focus-visible:focus-ring disabled:state-disabled aria-invalid:border-border-error"
          [id]="controlId"
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="listboxId"
          [attr.aria-activedescendant]="activeDescendant()"
          [attr.aria-required]="required() ? 'true' : null"
          [disabled]="disabled() || loading()"
          [attr.aria-invalid]="error() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          (click)="toggle()"
          (keydown)="handleKeydown($event)"
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
            class="surface-panel surface-depth-floating absolute z-dropdown mt-2xs grid max-h-[18rem] w-full overflow-auto rounded-md p-2xs"
            role="listbox"
            [id]="listboxId"
            [attr.aria-labelledby]="controlId"
          >
            @for (option of options(); track option.value; let index = $index) {
              <li
                class="grid min-h-touch-min cursor-pointer gap-2xs rounded-sm px-sm py-xs text-start text-text-primary interactive-transition hover:bg-surface-subtle aria-disabled:state-disabled"
                role="option"
                tabindex="-1"
                [id]="optionId(index)"
                [attr.aria-disabled]="option.disabled ? 'true' : null"
                [attr.aria-selected]="isSelected(option)"
                [class.bg-surface-subtle]="isActiveIndex(index)"
                [class.text-text-muted]="option.disabled"
                (mouseenter)="activateIndex(index)"
                (mousedown)="$event.preventDefault()"
                (click)="choose(option)"
                (keydown.enter)="choose(option)"
                (keydown.space)="choose(option)"
              >
                <span class="type-label-md">{{ option.label }}</span>
                @if (option.helper) {
                  <span class="type-body-sm text-text-muted">{{ option.helper }}</span>
                }
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
  protected readonly activeIndex = signal(-1);
  protected readonly selectedOption = computed(() => this.options().find((option) => this.isSelected(option)) ?? null);
  protected readonly displayLabel = computed(() => this.selectedOption()?.label ?? this.placeholder());
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

  protected toggle(): void {
    if (this.disabled() || this.loading()) {
      return;
    }
    if (this.open()) {
      this.close();
      return;
    }
    this.openList();
  }

  protected choose(option: UiOption): void {
    if (option.disabled) {
      return;
    }
    this.valueChange.emit(option.value);
    this.close();
  }

  protected isSelected(option: UiOption): boolean {
    return String(option.value) === String(this.value() ?? '');
  }

  protected handleFocusOut(event: FocusEvent): void {
    if (event.currentTarget instanceof HTMLElement && event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    this.close();
  }

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected isActiveIndex(index: number): boolean {
    return this.activeIndex() === index;
  }

  protected activateIndex(index: number): void {
    if (this.options()[index]?.disabled) {
      return;
    }
    this.activeIndex.set(index);
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
        event.preventDefault();
        this.openList();
        this.activateFirst();
        return;
      case 'End':
        event.preventDefault();
        this.openList();
        this.activateLast();
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.open()) {
          const option = this.options()[this.activeIndex()];
          if (option) {
            this.choose(option);
          }
          return;
        }
        this.openList();
        return;
      case 'Escape':
        event.preventDefault();
        this.close();
        return;
      default:
        return;
    }
  }

  private openList(): void {
    this.open.set(true);
    if (this.activeIndex() < 0) {
      this.activateSelectedOrFirst();
    }
  }

  private close(): void {
    this.open.set(false);
  }

  private moveActive(delta: 1 | -1): void {
    const options = this.options();
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
    const selectedIndex = this.options().findIndex((option) => this.isSelected(option) && !option.disabled);
    if (selectedIndex >= 0) {
      this.activeIndex.set(selectedIndex);
      return;
    }
    this.activateFirst();
  }

  private activateFirst(): void {
    this.activeIndex.set(this.options().findIndex((option) => !option.disabled));
  }

  private activateLast(): void {
    const options = this.options();
    for (let index = options.length - 1; index >= 0; index -= 1) {
      if (!options[index]?.disabled) {
        this.activeIndex.set(index);
        return;
      }
    }
    this.activeIndex.set(-1);
  }
}
