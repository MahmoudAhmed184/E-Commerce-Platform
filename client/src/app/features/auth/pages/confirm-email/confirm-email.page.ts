import { ChangeDetectionStrategy, Component, DestroyRef, type OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { AuthFlowService } from '../../services/auth-flow/auth-flow.service';

@Component({
  selector: 'app-confirm-email-page',
  standalone: true,
  imports: [AlertBannerComponent, RouterLink, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-surface-page">
      <section class="mx-auto grid min-h-[var(--ui-layout-min-screen-minus-header)] max-w-[var(--ui-container-sm)] place-items-center px-gutter-xs py-2xl md:px-gutter-sm">
        <div class="grid w-full gap-lg rounded-md border-hairline border-border-default bg-surface-raised p-lg shadow-xs">
          <header class="grid gap-xs">
            <p class="type-label-sm text-text-muted">Email confirmation</p>
            @if (hasConfirmationToken()) {
              <h1 class="type-heading-xl text-text-primary">Confirming email</h1>
              <p class="type-body-md text-text-secondary">Keep this page open while we confirm your account.</p>
            } @else {
              <h1 class="type-heading-xl text-text-primary">Check your email</h1>
              <p class="type-body-md text-text-secondary">Open the confirmation link sent to your inbox before signing in.</p>
            }
          </header>

          @if (hasConfirmationToken()) {
            @if (isLoading()) {
              <div class="flex items-center gap-sm rounded-md border-hairline border-border-default bg-surface-subtle p-md" role="status" aria-live="polite">
                <app-spinner size="sm" label="Confirming account" />
                <span class="type-body-sm text-text-secondary">Confirming your account...</span>
              </div>
            }

            @if (successMessage()) {
              <app-alert-banner tone="success" title="Email confirmed" [message]="successMessage()" />
              <a
                class="inline-flex min-h-control-md items-center justify-center rounded-md bg-surface-primary px-md py-xs type-label-md text-text-on-primary interactive-transition hover:bg-primary-600 focus-visible:focus-ring"
                routerLink="/auth/login"
              >
                Go to sign in
              </a>
            }

            @if (errorMessage()) {
              <app-alert-banner
                tone="error"
                title="Confirmation failed"
                [message]="errorMessage()"
                [action]="{ label: 'Back to sign in', variant: 'secondary' }"
                (actionPressed)="goToLogin()"
              />
            }
          } @else {
            @if (email()) {
              <app-alert-banner tone="success" title="Confirmation email sent" [message]="'Check ' + email() + ' for the confirmation link.'" />
            }
            <a
              class="inline-flex min-h-control-md items-center justify-center rounded-md border-hairline border-border-default bg-surface-raised px-md py-xs type-label-md text-text-primary interactive-transition hover:bg-surface-subtle focus-visible:focus-ring"
              routerLink="/auth/login"
            >
              Back to sign in
            </a>
          }
        </div>
      </section>
    </main>
  `,
})
export class ConfirmEmailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authFlow = inject(AuthFlowService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly hasConfirmationToken = signal(false);
  protected readonly email = signal<string | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    this.hasConfirmationToken.set(!!token);
    this.email.set(this.route.snapshot.queryParamMap.get('email'));

    if (token) {
      this.confirmToken(token);
    }
  }

  protected goToLogin(): void {
    void this.router.navigateByUrl('/auth/login');
  }

  private confirmToken(token: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authFlow
      .confirmEmail(token)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.successMessage.set('Your email has been confirmed.'),
        error: (error: unknown) => this.errorMessage.set(this.authFlow.confirmationError(error)),
      });
  }
}
