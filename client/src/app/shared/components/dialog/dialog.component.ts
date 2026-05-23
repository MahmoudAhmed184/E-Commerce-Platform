import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  type AfterViewInit,
  type OnDestroy,
  output,
} from '@angular/core';

import { ButtonComponent } from '../button/button.component';
import { findFocusableElements, uniqueId } from '../component-utils';
import type { UiAction } from '../ui.types';

export type DialogSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (open()) {
      <div
        class="fixed inset-[var(--ui-space-0)] z-modal grid place-items-center bg-overlay-backdrop p-gutter-xs backdrop-blur-xl"
        tabindex="-1"
        (click)="backdropClick($event)"
        (keydown)="handleKeydown($event)"
      >
        <section
          class="glass-panel glass-depth-modal max-h-[var(--ui-layout-modal-max-block)] w-full overflow-auto rounded-lg p-lg text-card-foreground"
          [class]="sizeClass()"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="bodyId"
          tabindex="-1"
        >
          <header class="flex items-start justify-between gap-md">
            <div class="grid gap-2xs">
              <h2 class="type-heading-md text-card-foreground" [id]="titleId">{{ title() }}</h2>
              @if (description()) {
                <p class="type-body-sm text-muted-foreground">{{ description() }}</p>
              }
            </div>
            @if (dismissible()) {
              <button
                class="inline-flex size-control-sm items-center justify-center rounded-full text-icon-default interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring"
                type="button"
                aria-label="Close dialog"
                (click)="closed.emit()"
              >
                <span aria-hidden="true">x</span>
              </button>
            }
          </header>

          <div class="mt-md grid gap-md type-body-md text-muted-foreground" [id]="bodyId">
            <ng-content />
          </div>

          @if (primaryAction() || secondaryAction()) {
            <footer class="mt-lg flex flex-wrap justify-end gap-sm">
              @if (secondaryAction(); as secondary) {
                <app-button
                  [variant]="secondary.variant ?? 'secondary'"
                  [disabled]="secondary.disabled ?? false"
                  [loading]="secondary.loading ?? false"
                  (pressed)="secondaryPressed.emit()"
                >
                  {{ secondary.label }}
                </app-button>
              }
              @if (primaryAction(); as primary) {
                <app-button
                  [variant]="primary.variant ?? 'primary'"
                  [disabled]="primary.disabled ?? false"
                  [loading]="primary.loading ?? false"
                  (pressed)="primaryPressed.emit()"
                >
                  {{ primary.label }}
                </app-button>
              }
            </footer>
          }
        </section>
      </div>
    }
  `,
})
export class DialogComponent implements AfterViewInit, OnDestroy {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly size = input<DialogSize>('md');
  readonly primaryAction = input<UiAction | null>(null);
  readonly secondaryAction = input<UiAction | null>(null);
  readonly closeOnBackdrop = input(true);
  readonly dismissible = input(true);

  readonly closed = output<void>();
  readonly primaryPressed = output<void>();
  readonly secondaryPressed = output<void>();

  protected readonly titleId = uniqueId('dialog-title');
  protected readonly bodyId = uniqueId('dialog-body');
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private originalParent: Node | null = null;
  private originalNextSibling: Node | null = null;
  private lastFocused: HTMLElement | null = null;

  protected readonly sizeClass = computed(() => {
    const sizes: Record<DialogSize, string> = {
      sm: 'max-w-[var(--ui-container-sm)]',
      md: 'max-w-[var(--ui-container-md)]',
      lg: 'max-w-[var(--ui-container-lg)]',
    };

    return sizes[this.size()];
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        this.lastFocused?.focus();
        return;
      }

      this.lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      queueMicrotask(() => {
        const panel = this.elementRef.nativeElement.querySelector<HTMLElement>('[role="dialog"]');
        (findFocusableElements(this.elementRef.nativeElement)[0] ?? panel)?.focus();
      });
    });
  }

  ngAfterViewInit(): void {
    const host = this.elementRef.nativeElement;
    this.originalParent = host.parentNode;
    this.originalNextSibling = host.nextSibling;
    this.document.body.append(host);
  }

  ngOnDestroy(): void {
    const host = this.elementRef.nativeElement;
    if (!this.originalParent?.isConnected) {
      host.remove();
      return;
    }

    this.originalParent.insertBefore(host, this.originalNextSibling);
  }

  protected backdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.dismissible()) {
      this.closed.emit();
      return;
    }

    if (event.key !== 'Tab') {
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
