import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { inputValue, uniqueId } from '../component-utils';
import { SpinnerComponent } from '../spinner/spinner.component';

export interface SearchSuggestion {
  id: string;
  label: string;
  description?: string;
  href?: string;
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <form class="relative" role="search" (submit)="submit($event)">
      <label class="sr-only" [for]="inputId">{{ scope() }} search</label>
      <div class="glass-panel glass-depth-raised flex min-h-control-lg items-center gap-xs rounded-md px-sm py-2xs interactive-transition focus-within:border-border-focus focus-within:shadow-glass-floating focus-within:focus-ring">
        <input
          class="min-h-control-md min-w-0 flex-1 bg-transparent type-body-md text-text-primary outline-none placeholder:text-text-muted disabled:state-disabled"
          role="combobox"
          aria-autocomplete="list"
          [id]="inputId"
          type="search"
          [value]="query()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [attr.aria-controls]="listboxId"
          [attr.aria-expanded]="open()"
          [attr.aria-describedby]="liveId"
          (input)="onInput(inputValue($event))"
          (focus)="open.set(query().length >= minChars())"
          (keydown.escape)="open.set(false)"
        />
        @if (loading()) {
          <app-spinner size="sm" label="Loading suggestions" />
        }
        @if (query()) {
          <button class="inline-flex size-control-sm items-center justify-center rounded-full text-icon-muted interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring" type="button" aria-label="Clear search" (click)="clearSearch()">
            <span aria-hidden="true">x</span>
          </button>
        }
        @if (showSubmit()) {
          <button class="min-h-control-md rounded-md border-hairline border-glass-border bg-[linear-gradient(135deg,var(--ui-color-iridescent-violet),var(--ui-color-iridescent-cyan),var(--ui-color-iridescent-emerald))] px-md type-label-md text-text-on-primary shadow-glass-raised interactive-transition hover:shadow-glass-floating focus-visible:focus-ring disabled:state-disabled" type="submit" [disabled]="disabled() || query().length < minChars()">
            Search
          </button>
        }
      </div>

      @if (open()) {
        <div class="glass-panel glass-depth-floating absolute z-dropdown mt-xs grid w-full gap-2xs rounded-md p-xs" role="listbox" [id]="listboxId">
          @if (error()) {
            <p class="px-sm py-xs type-body-sm text-text-error" role="option" aria-disabled="true" aria-selected="false">{{ error() }}</p>
          } @else {
            @for (suggestion of suggestions(); track suggestion.id) {
              <button class="grid min-h-control-md w-full rounded-md px-sm py-xs text-start interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring" type="button" role="option" aria-selected="false" (click)="selectSuggestion(suggestion)">
                <span class="type-label-md text-text-primary">{{ suggestion.label }}</span>
                @if (suggestion.description) {
                  <span class="type-body-sm text-text-muted">{{ suggestion.description }}</span>
                }
              </button>
            } @empty {
              <p class="px-sm py-xs type-body-sm text-text-muted" role="option" aria-disabled="true" aria-selected="false">No suggestions</p>
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
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.query().length >= this.minChars()) {
      this.submitted.emit(this.query());
      this.open.set(false);
    }
  }

  protected selectSuggestion(suggestion: SearchSuggestion): void {
    this.suggestionSelected.emit(suggestion);
    this.open.set(false);
  }

  protected clearSearch(): void {
    this.queryChange.emit('');
    this.cleared.emit();
    this.open.set(false);
  }
}
