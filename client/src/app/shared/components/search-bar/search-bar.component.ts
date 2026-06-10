import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LucideSearch, LucideX } from '@lucide/angular';

import { inputValue, uniqueId } from '../component-utils';

export interface SearchSuggestion {
  id: string;
  label: string;
  description?: string;
  href?: string;
}

@Component({
  selector: 'app-search-bar',
  imports: [LucideSearch, LucideX],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <form
      class="relative min-w-0"
      role="search"
      (submit)="submit($event)"
      (focusout)="handleFocusOut($event)"
    >
      <label class="sr-only" [for]="inputId">{{ scope() }} search</label>
      <div
        class="flex min-h-touch-min items-center overflow-hidden rounded-md border-hairline border-border-default bg-surface-raised shadow-xs interactive-transition focus-within:border-border-focus focus-within:focus-ring"
      >
        <svg
          lucideSearch
          class="ms-sm size-icon-sm shrink-0 text-icon-muted"
          aria-hidden="true"
        ></svg>
        <input
          class="min-h-touch-min min-w-0 flex-1 bg-transparent px-xs type-body-sm text-text-primary outline-none placeholder:text-text-muted disabled:state-disabled"
          role="combobox"
          aria-autocomplete="list"
          [id]="inputId"
          type="search"
          [value]="query()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [attr.aria-controls]="listboxId"
          [attr.aria-expanded]="open()"
          [attr.aria-activedescendant]="activeDescendant()"
          [attr.aria-describedby]="liveId"
          (input)="onInput(inputValue($event))"
          (focus)="handleFocus()"
          (keydown)="handleKeydown($event)"
        />
        @if (loading()) {
          <span class="px-xs type-code-sm text-text-muted">Loading</span>
        }
        @if (query()) {
          <button
            class="inline-flex min-h-touch-min min-w-touch-min items-center justify-center text-icon-muted interactive-transition hover:bg-surface-subtle hover:text-icon-default focus-visible:focus-ring"
            type="button"
            aria-label="Clear search"
            (click)="clearSearch()"
          >
            <svg lucideX class="size-icon-sm" aria-hidden="true"></svg>
          </button>
        }
        @if (showSubmit()) {
          <button
            class="inline-flex min-h-touch-min items-center gap-xs border-s border-border-default bg-surface-primary px-md type-label-md text-text-on-primary interactive-transition hover:bg-surface-primary-hover focus-visible:focus-ring disabled:state-disabled"
            type="submit"
            [disabled]="disabled() || query().length < minChars()"
          >
            <svg lucideSearch class="size-icon-sm" aria-hidden="true"></svg>
            <span>{{ submitLabel() }}</span>
          </button>
        }
      </div>

      @if (open()) {
        <div
          class="surface-panel surface-depth-floating absolute z-dropdown mt-2xs grid w-full gap-2xs rounded-md p-2xs"
          role="listbox"
          [id]="listboxId"
          [attr.aria-labelledby]="inputId"
        >
          @if (error()) {
            <p
              class="px-sm py-xs type-body-sm text-text-error"
              role="option"
              aria-disabled="true"
              aria-selected="false"
            >
              {{ error() }}
            </p>
          } @else {
            @for (suggestion of suggestions(); track suggestion.id; let index = $index) {
              <div
                class="grid min-h-touch-min cursor-pointer rounded-sm px-sm py-xs text-start interactive-transition hover:bg-surface-subtle"
                role="option"
                tabindex="-1"
                [id]="suggestionId(index)"
                [attr.aria-selected]="isActiveIndex(index)"
                [class.bg-surface-subtle]="isActiveIndex(index)"
                (mouseenter)="activeIndex.set(index)"
                (mousedown)="$event.preventDefault()"
                (click)="selectSuggestion(suggestion)"
                (keydown.enter)="selectSuggestion(suggestion)"
                (keydown.space)="selectSuggestion(suggestion)"
              >
                <span class="type-label-md text-text-primary">{{ suggestion.label }}</span>
                @if (suggestion.description) {
                  <span class="type-body-sm text-text-muted">{{ suggestion.description }}</span>
                }
              </div>
            } @empty {
              <p
                class="px-sm py-xs type-body-sm text-text-muted"
                role="option"
                aria-disabled="true"
                aria-selected="false"
              >
                No suggestions
              </p>
            }
          }
        </div>
      }

      <p class="sr-only" [id]="liveId" aria-live="polite">{{ announcement() }}</p>
    </form>
  `,
})
export class SearchBarComponent {
  readonly query = input('');
  readonly suggestions = input<readonly SearchSuggestion[]>([]);
  readonly scope = input('Product');
  readonly placeholder = input('Search products');
  readonly submitLabel = input('Search');
  readonly showSubmit = input(true);
  readonly minChars = input(2);
  readonly resultCount = input<number | null>(null);
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly error = input<string | null>(null);

  readonly queryChange = output<string>();
  readonly submitted = output<string>();
  readonly suggestionSelected = output<SearchSuggestion>();
  readonly cleared = output<void>();

  protected readonly inputId = uniqueId('search');
  protected readonly listboxId = `${this.inputId}-listbox`;
  protected readonly liveId = `${this.inputId}-live`;
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly activeDescendant = computed(() =>
    this.open() && this.activeIndex() >= 0 ? this.suggestionId(this.activeIndex()) : null,
  );
  protected readonly announcement = computed(() => {
    if (this.resultCount() !== null) {
      return `${this.resultCount()} results available.`;
    }
    return `${this.suggestions().length} suggestions available.`;
  });

  protected inputValue(event: Event): string {
    return inputValue(event);
  }

  protected onInput(value: string): void {
    this.queryChange.emit(value);
    this.open.set(value.length >= this.minChars());
    this.activateFirst();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.query().length >= this.minChars()) {
      this.submitted.emit(this.query());
      this.close();
    }
  }

  protected selectSuggestion(suggestion: SearchSuggestion): void {
    this.suggestionSelected.emit(suggestion);
    this.close();
  }

  protected clearSearch(): void {
    this.queryChange.emit('');
    this.cleared.emit();
    this.close();
  }

  protected suggestionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected isActiveIndex(index: number): boolean {
    return this.activeIndex() === index;
  }

  protected handleFocus(): void {
    this.open.set(this.query().length >= this.minChars());
    this.activateFirst();
  }

  protected handleFocusOut(event: FocusEvent): void {
    if (
      event.currentTarget instanceof HTMLElement &&
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    this.close();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.openSuggestions();
        this.moveActive(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.openSuggestions();
        this.moveActive(-1);
        return;
      case 'Home':
        if (!this.open() || !this.suggestions().length) {
          return;
        }
        event.preventDefault();
        this.activateFirst();
        return;
      case 'End':
        if (!this.open() || !this.suggestions().length) {
          return;
        }
        event.preventDefault();
        this.activeIndex.set(this.suggestions().length - 1);
        return;
      case 'Enter':
        if (this.open() && this.activeIndex() >= 0) {
          const suggestion = this.suggestions()[this.activeIndex()];
          if (suggestion) {
            event.preventDefault();
            this.selectSuggestion(suggestion);
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

  private openSuggestions(): void {
    if (this.disabled() || this.query().length < this.minChars()) {
      return;
    }
    this.open.set(true);
    if (this.activeIndex() < 0) {
      this.activateFirst();
    }
  }

  private close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
  }

  private activateFirst(): void {
    this.activeIndex.set(this.suggestions().length ? 0 : -1);
  }

  private moveActive(delta: 1 | -1): void {
    const suggestions = this.suggestions();
    if (!suggestions.length) {
      this.activeIndex.set(-1);
      return;
    }

    const startIndex =
      this.activeIndex() < 0 ? (delta > 0 ? -1 : suggestions.length) : this.activeIndex();
    this.activeIndex.set((startIndex + delta + suggestions.length) % suggestions.length);
  }
}
