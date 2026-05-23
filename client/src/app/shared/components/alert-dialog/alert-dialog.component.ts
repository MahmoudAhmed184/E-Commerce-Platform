import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, input, output } from '@angular/core';

import { ButtonComponent } from '../button/button.component';
import { findFocusableElements, uniqueId } from '../component-utils';
import type { UiAction } from '../ui.types';

@Component({
  selector: 'app-alert-dialog',
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
          class="glass-panel glass-depth-modal w-full max-w-[var(--ui-container-sm)] rounded-lg p-lg text-card-foreground"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="descriptionId"
          tabindex="-1"
        >
          <div class="grid gap-sm">
            <div class="grid gap-2xs">
              <h2 class="type-heading-md text-card-foreground" [id]="titleId">{{ title() }}</h2>
              <p class="type-body-sm text-muted-foreground" [id]="descriptionId">{{ description() }}</p>
            </div>

            <ng-content />
          </div>

          <footer class="mt-lg flex flex-wrap justify-end gap-sm">
            @if (cancelAction(); as cancel) {
              <app-button
                [variant]="cancel.variant ?? 'secondary'"
                [disabled]="cancel.disabled ?? false"
                [loading]="cancel.loading ?? false"
                (pressed)="cancelPressed.emit()"
              >
                {{ cancel.label }}
              </app-button>
            }
            @if (confirmAction(); as confirm) {
              <app-button
                [variant]="destructive() ? 'danger' : confirm.variant ?? 'primary'"
                [disabled]="confirm.disabled ?? false"
                [loading]="confirm.loading ?? false"
                (pressed)="confirmPressed.emit()"
              >
                {{ confirm.label }}
              </app-button>
            }
          </footer>
        </section>
      </div>
    }
  `,
})
export class AlertDialogComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly destructive = input(false);
  readonly confirmAction = input.required<UiAction>();
  readonly cancelAction = input<UiAction | null>({ label: 'Cancel', variant: 'secondary' });
  readonly closeOnBackdrop = input(false);

  readonly confirmPressed = output<void>();
  readonly cancelPressed = output<void>();
  readonly closed = output<void>();

  protected readonly titleId = uniqueId('alert-dialog-title');
  protected readonly descriptionId = uniqueId('alert-dialog-description');
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private lastFocused: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (!this.open()) {
        this.lastFocused?.focus();
        return;
      }

      this.lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      queueMicrotask(() => {
        const panel = this.elementRef.nativeElement.querySelector<HTMLElement>('[role="alertdialog"]');
        (findFocusableElements(this.elementRef.nativeElement)[0] ?? panel)?.focus();
      });
    });
  }

  protected backdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
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
