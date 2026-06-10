import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, output } from '@angular/core';

import { findFocusableElements, uniqueId } from '../component-utils';

export type SheetSide = 'start' | 'end';
export type SheetSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (open()) {
      <div
        class="fixed inset-[var(--ui-space-0)] z-drawer bg-overlay-backdrop "
        [attr.role]="modal() ? 'dialog' : null"
        [attr.aria-modal]="modal() ? 'true' : null"
        [attr.aria-labelledby]="titleId"
        tabindex="-1"
        (click)="backdropClick($event)"
        (keydown)="handleKeydown($event)"
      >
        <aside [class]="panelClasses()" tabindex="-1">
          <header class="flex items-center justify-between gap-md border-b border-border-default pb-md">
            <div class="flex items-center gap-xs">
              @if (backButton()) {
                <button
                  class="inline-flex min-h-touch-min min-w-touch-min items-center justify-center rounded-full text-icon-default interactive-transition hover:bg-surface-subtle focus-visible:focus-ring"
                  type="button"
                  aria-label="Go back"
                  (click)="back.emit()"
                >
                  <span aria-hidden="true">&lt;</span>
                </button>
              }
              <div class="grid gap-2xs">
                <h2 class="type-heading-md text-card-foreground" [id]="titleId">{{ title() }}</h2>
                @if (description()) {
                  <p class="type-body-sm text-muted-foreground">{{ description() }}</p>
                }
              </div>
            </div>
            @if (dismissible()) {
              <button
                class="inline-flex min-h-touch-min min-w-touch-min items-center justify-center rounded-full text-icon-default interactive-transition hover:bg-surface-subtle focus-visible:focus-ring"
                type="button"
                aria-label="Close panel"
                (click)="closed.emit()"
              >
                <span aria-hidden="true">x</span>
              </button>
            }
          </header>

          <div class="min-h-0 flex-1 overflow-auto py-md">
            <ng-content />
          </div>
        </aside>
      </div>
    }
  `,
})
export class SheetComponent {
  readonly open = input(false);
  readonly side = input<SheetSide>('end');
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly size = input<SheetSize>('md');
  readonly dismissible = input(true);
  readonly backButton = input(false);
  readonly modal = input(true);

  readonly closed = output<void>();
  readonly back = output<void>();

  protected readonly titleId = uniqueId('sheet-title');
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private lastFocused: HTMLElement | null = null;

  protected readonly panelClasses = computed(() => {
    const base = 'surface-panel surface-depth-overlay absolute inset-y-0 flex h-full flex-col p-md text-card-foreground';
    const sizes: Record<SheetSize, string> = {
      sm: 'w-full max-w-[var(--ui-container-sm)]',
      md: 'w-full max-w-[var(--ui-container-md)]',
      lg: 'w-full max-w-[var(--ui-container-lg)]',
    };
    const sides: Record<SheetSide, string> = {
      start: `start-0 border-e ${sizes[this.size()]}`,
      end: `end-0 border-s ${sizes[this.size()]}`,
    };

    return `${base} ${sides[this.side()]}`;
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        this.lastFocused?.focus();
        return;
      }

      this.lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      queueMicrotask(() => {
        const panel = this.elementRef.nativeElement.querySelector<HTMLElement>('aside');
        (findFocusableElements(this.elementRef.nativeElement)[0] ?? panel)?.focus();
      });
    });
  }

  protected backdropClick(event: MouseEvent): void {
    if (this.dismissible() && event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.dismissible()) {
      this.closed.emit();
      return;
    }

    if (event.key !== 'Tab' || !this.modal()) {
      return;
    }

    const focusable = findFocusableElements(this.elementRef.nativeElement);
    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
