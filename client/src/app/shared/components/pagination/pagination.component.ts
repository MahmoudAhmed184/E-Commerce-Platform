import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { inputValue } from '../component-utils';

interface PageItem {
  id: number;
  value: number;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <nav class="grid gap-md justify-items-center md:grid-cols-[1fr_auto_1fr] md:items-center" aria-label="Pagination">
      <p class="type-body-sm text-text-muted md:justify-self-start">
        Page {{ page() }} of {{ totalPages() }}
      </p>

      <div class="flex flex-wrap items-center justify-center gap-xs md:justify-self-center">
        <button class="surface-panel surface-depth-flat min-h-touch-min rounded-md px-sm type-label-md interactive-transition hover:shadow-sm focus-visible:focus-ring disabled:state-disabled" type="button" [disabled]="page() <= 1 || loading()" (click)="pageChange.emit(page() - 1)">
          Previous
        </button>
        @for (candidate of pages(); track candidate.id) {
          <button
            class="min-h-touch-min min-w-touch-min rounded-md border-hairline px-sm type-label-md interactive-transition hover:bg-surface-subtle focus-visible:focus-ring disabled:state-disabled"
            [class.border-border-focus]="candidate.value === page()"
            [class.border-border-default]="candidate.value !== page()"
            [class.bg-surface-subtle]="candidate.value === page()"
            type="button"
            [attr.aria-current]="candidate.value === page() ? 'page' : null"
            [disabled]="loading()"
            (click)="pageChange.emit(candidate.value)"
          >
            {{ candidate.value }}
          </button>
        }
        <button class="surface-panel surface-depth-flat min-h-touch-min rounded-md px-sm type-label-md interactive-transition hover:shadow-sm focus-visible:focus-ring disabled:state-disabled" type="button" [disabled]="page() >= totalPages() || loading()" (click)="pageChange.emit(page() + 1)">
          Next
        </button>
      </div>

      @if (pageSizeOptions().length) {
        <label class="flex items-center gap-xs type-body-sm text-text-muted md:justify-self-end">
          Rows
          <select class="min-h-touch-min rounded-sm border-hairline border-border-default bg-surface-raised px-xs shadow-xs  focus-visible:focus-ring" [value]="pageSize()" (change)="changePageSize($event)">
            @for (size of pageSizeItems(); track size.id) {
              <option [value]="size.value">{{ size.value }}</option>
            }
          </select>
        </label>
      }
    </nav>
  `,
})
export class PaginationComponent {
  readonly page = input(1);
  readonly pageSize = input(24);
  readonly totalItems = input(0);
  readonly pageSizeOptions = input<readonly number[]>([]);
  readonly bounded = input(true);
  readonly loading = input(false);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly totalPages = computed(() => Math.max(Math.ceil(this.totalItems() / this.pageSize()), 1));
  protected readonly pageSizeItems = computed<readonly PageItem[]>(() =>
    this.pageSizeOptions().map((value) => ({ id: value, value })),
  );
  protected readonly pages = computed<readonly PageItem[]>(() => {
    const total = this.totalPages();
    if (!this.bounded()) {
      return Array.from({ length: total }, (_, index) => {
        const value = index + 1;
        return { id: value, value };
      });
    }
    const start = Math.max(Math.min(this.page() - 2, total - 4), 1);
    const end = Math.min(start + 4, total);
    return Array.from({ length: end - start + 1 }, (_, index) => {
      const value = start + index;
      return { id: value, value };
    });
  });

  protected changePageSize(event: Event): void {
    this.pageSizeChange.emit(Number(inputValue(event)));
  }
}
