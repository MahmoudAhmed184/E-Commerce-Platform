import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ButtonComponent } from '../button/button.component';
import type { UiAction } from '../ui.types';

export type EmptyStateType = 'cart' | 'search' | 'orders' | 'reviews' | 'admin' | 'generic';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <section class="glass-panel glass-depth-floating mx-auto grid max-w-[var(--ui-container-md)] justify-items-center gap-md rounded-md p-xl text-center">
      <div class="text-text-muted" aria-hidden="true">
        <ng-content select="[empty-illustration]" />
      </div>
      <p class="type-label-sm text-text-muted">{{ type() }}</p>
      <h2 class="type-heading-md text-text-primary">{{ title() }}</h2>
      <p class="max-w-[var(--ui-container-sm)] type-body-md text-text-secondary">{{ message() }}</p>

      @if (action(); as stateAction) {
        <app-button
          [variant]="stateAction.variant ?? 'primary'"
          [disabled]="stateAction.disabled ?? false"
          [loading]="stateAction.loading ?? false"
          [ariaLabel]="stateAction.ariaLabel ?? null"
          (pressed)="actionPressed.emit()"
        >
          {{ stateAction.label }}
        </app-button>
      }
    </section>
  `,
})
export class EmptyStateComponent {
  readonly type = input<EmptyStateType>('generic');
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly action = input<UiAction | null>(null);

  readonly actionPressed = output<void>();
}
