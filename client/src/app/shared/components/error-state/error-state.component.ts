import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonComponent } from '../button/button.component';
import type { UiAction } from '../ui.types';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [ButtonComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <section class="surface-panel surface-depth-floating mx-auto grid max-w-[var(--ui-container-md)] justify-items-center gap-md rounded-md p-xl text-center">
      <p class="type-label-sm text-text-muted">{{ statusCode() }}</p>
      <h1 class="type-heading-xl text-text-primary">{{ title() }}</h1>
      <p class="max-w-[var(--ui-container-sm)] type-body-md text-text-secondary">{{ message() }}</p>

      <div class="flex flex-wrap justify-center gap-sm">
        @if (retry(); as retryAction) {
          <app-button
            [variant]="retryAction.variant ?? 'primary'"
            [disabled]="retryAction.disabled ?? false"
            [loading]="retryAction.loading ?? false"
            (pressed)="retryPressed.emit()"
          >
            {{ retryAction.label }}
          </app-button>
        }

        @if (homeLink(); as home) {
          <a class="surface-panel surface-depth-raised inline-flex min-h-touch-min items-center rounded-md px-md py-xs type-label-md text-text-primary interactive-transition hover:shadow-md focus-visible:focus-ring" [routerLink]="home">
            Return home
          </a>
        }

        @if (supportLink(); as support) {
          <a class="surface-panel surface-depth-raised inline-flex min-h-touch-min items-center rounded-md px-md py-xs type-label-md text-text-primary interactive-transition hover:shadow-md focus-visible:focus-ring" [href]="support">
            Contact support
          </a>
        }
      </div>
    </section>
  `,
})
export class ErrorStateComponent {
  readonly statusCode = input<number | string>(500);
  readonly title = input('Something went wrong');
  readonly message = input('The page could not be loaded. Choose a recovery action to continue.');
  readonly retry = input<UiAction | null>(null);
  readonly homeLink = input<string | readonly unknown[] | null>('/');
  readonly supportLink = input<string | null>(null);

  readonly retryPressed = output<void>();
}
