import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ButtonComponent } from '../button/button.component';
import type { UiAction } from '../ui.types';

export type AlertTone = 'success' | 'warning' | 'error' | 'info';

@Component({
  selector: 'app-alert-banner',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <section [class]="classes()" [attr.role]="role()" [attr.aria-live]="tone() === 'error' ? 'assertive' : 'polite'">
      <div class="min-w-0 flex-1">
        <h2 class="type-heading-sm">{{ title() }}</h2>
        @if (message()) {
          <p class="mt-2xs type-body-sm">{{ message() }}</p>
        }
      </div>

      @if (action(); as bannerAction) {
        <app-button
          [variant]="bannerAction.variant ?? 'secondary'"
          size="sm"
          [disabled]="bannerAction.disabled ?? false"
          [loading]="bannerAction.loading ?? false"
          [ariaLabel]="bannerAction.ariaLabel ?? null"
          (pressed)="actionPressed.emit()"
        >
          {{ bannerAction.label }}
        </app-button>
      }

      @if (dismissible()) {
        <button
          class="inline-flex size-control-sm items-center justify-center rounded-full text-current interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring"
          type="button"
          aria-label="Dismiss message"
          (click)="dismissed.emit()"
        >
          <span aria-hidden="true">x</span>
        </button>
      }
    </section>
  `,
})
export class AlertBannerComponent {
  readonly tone = input<AlertTone>('info');
  readonly title = input.required<string>();
  readonly message = input<string | null>(null);
  readonly action = input<UiAction | null>(null);
  readonly dismissible = input(false);

  readonly actionPressed = output<void>();
  readonly dismissed = output<void>();

  protected readonly role = computed(() => this.tone() === 'error' ? 'alert' : 'status');
  protected readonly classes = computed(() => {
    const tones: Record<AlertTone, string> = {
      success: 'border-success-600 bg-success-50 text-text-success shadow-glass-flat',
      warning: 'border-warning-600 bg-warning-50 text-text-warning shadow-glass-flat',
      error: 'border-border-error bg-error-50 text-text-error shadow-glass-flat',
      info: 'border-info-600 bg-info-50 text-text-info shadow-glass-flat',
    };

    return `flex items-start gap-sm rounded-md border-hairline p-md backdrop-blur-md ${tones[this.tone()]}`;
  });
}
