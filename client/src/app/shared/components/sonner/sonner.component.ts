import { ChangeDetectionStrategy, Component, computed, effect, input, type OnDestroy, output, signal } from '@angular/core';

import { ButtonComponent } from '../button/button.component';

export type SonnerTone = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-sonner',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <section
      [class]="classes()"
      [attr.role]="role()"
      [attr.aria-live]="tone() === 'error' ? 'assertive' : 'polite'"
      (mouseenter)="pause()"
      (mouseleave)="resume()"
      (focusin)="pause()"
      (focusout)="resume()"
    >
      <div class="min-w-0">
        <p class="type-label-md text-card-foreground">{{ title() }}</p>
        @if (message()) {
          <p class="mt-2xs type-body-sm text-muted-foreground">{{ message() }}</p>
        }
      </div>
      @if (actionLabel()) {
        <app-button variant="ghost" size="sm" [loading]="actionLoading()" (pressed)="action.emit()">
          {{ actionLabel() }}
        </app-button>
      }
      @if (dismissible()) {
        <button
          class="inline-flex min-h-touch-min min-w-touch-min items-center justify-center rounded-full text-icon-default interactive-transition hover:bg-surface-subtle focus-visible:focus-ring"
          type="button"
          aria-label="Dismiss notification"
          (click)="dismiss.emit()"
        >
          <span aria-hidden="true">x</span>
        </button>
      }
    </section>
  `,
})
export class SonnerComponent implements OnDestroy {
  readonly tone = input<SonnerTone>('info');
  readonly title = input.required<string>();
  readonly message = input<string | null>(null);
  readonly actionLabel = input<string | null>(null);
  readonly duration = input(4200);
  readonly dismissible = input(true);
  readonly actionLoading = input(false);

  readonly action = output<void>();
  readonly dismiss = output<void>();

  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly paused = signal(false);

  protected readonly role = computed(() => this.tone() === 'error' ? 'alert' : 'status');
  protected readonly classes = computed(() => {
    const tones: Record<SonnerTone, string> = {
      info: 'border-info-600/40',
      success: 'border-success-600/40',
      warning: 'border-warning-600/40',
      error: 'border-destructive/40',
    };

    return `surface-panel surface-depth-floating fixed end-gutter-xs bottom-gutter-xs z-toast flex max-w-[var(--ui-container-sm)] items-center gap-sm rounded-md p-sm ${tones[this.tone()]}`;
  });

  constructor() {
    effect((onCleanup) => {
      this.clearTimer();
      if (!this.dismissible() || this.paused()) {
        return;
      }

      this.timeoutId = setTimeout(() => this.dismiss.emit(), this.duration());
      onCleanup(() => this.clearTimer());
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected pause(): void {
    this.paused.set(true);
  }

  protected resume(): void {
    this.paused.set(false);
  }

  private clearTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
