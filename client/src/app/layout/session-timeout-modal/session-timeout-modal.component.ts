import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { AlertBannerComponent } from '../../shared/components/alert-banner/alert-banner.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import type { UiAction } from '../../shared/components/ui.types';

@Component({
  selector: 'app-session-timeout-modal',
  standalone: true,
  imports: [AlertBannerComponent, DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog
      [open]="open()"
      title="Your session is about to expire"
      description="Extend the session to keep your cart, checkout progress, and saved form work active."
      size="sm"
      [primaryAction]="primaryAction()"
      [secondaryAction]="{ label: 'Sign out' }"
      [closeOnBackdrop]="false"
      [dismissible]="false"
      (primaryPressed)="extend.emit()"
      (secondaryPressed)="signOut.emit()"
      (closed)="closed.emit()"
    >
      <div class="grid gap-md">
        <p class="type-body-md text-text-secondary">
          For security, your session will expire in {{ minutesRemainingLabel() }}. Extend it to keep your cart, checkout, and form progress active.
        </p>

        @if (draftSaved()) {
          <app-alert-banner
            tone="info"
            title="Progress saved"
            message="Your current form draft has been preserved in this browser."
          />
        }

        @if (error()) {
          <app-alert-banner tone="error" title="Could not extend session" [message]="error()" />
        }
      </div>
    </app-dialog>
  `,
})
export class SessionTimeoutModalComponent {
  readonly open = input(false);
  readonly secondsRemaining = input(300);
  readonly extending = input(false);
  readonly error = input<string | null>(null);
  readonly hasDraft = input(false);

  readonly extend = output<void>();
  readonly signOut = output<void>();
  readonly closed = output<void>();

  protected readonly draftSaved = computed(() => this.open() && this.hasDraft());
  protected readonly primaryAction = computed<UiAction>(() => ({ label: 'Extend session', loading: this.extending() }));
  protected readonly minutesRemainingLabel = computed(() => {
    const minutes = Math.max(Math.ceil(this.secondsRemaining() / 60), 1);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  });
}
