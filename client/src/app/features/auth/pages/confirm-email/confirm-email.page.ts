import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { AppError } from '../../../../core/interceptors/error.interceptor';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-confirm-email-page',
  imports: [ErrorMessageComponent, LoadingSpinnerComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex min-h-[70vh] w-full max-w-lg items-center px-4 py-10">
      <div class="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p class="text-sm font-medium uppercase tracking-wide text-indigo-600">Email confirmation</p>

        @if (token()) {
          <h1 class="mt-2 text-2xl font-semibold text-slate-950">Confirming email</h1>

          <div class="mt-6 space-y-4">
            @if (isLoading()) {
              <div class="flex items-center gap-3 text-slate-700">
                <app-loading-spinner />
                <span>Confirming your account.</span>
              </div>
            }

            @if (successMessage()) {
              <div class="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
                {{ successMessage() }}
              </div>
              <a routerLink="/auth/login" class="inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Go to login</a>
            }

            <app-error-message [message]="errorMessage()" />
          </div>
        } @else {
          <h1 class="mt-2 text-2xl font-semibold text-slate-950">Check your email</h1>
          <p class="mt-3 text-slate-600">Check your email for a confirmation link.</p>
          @if (email()) {
            <p class="mt-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">Confirmation email sent to {{ email() }}.</p>
          }
          <a routerLink="/auth/login" class="mt-6 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Back to login</a>
        }
      </div>
    </section>
  `,
})
export class ConfirmEmailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly token = signal<string | null>(null);
  protected readonly email = signal<string | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') || this.route.snapshot.queryParamMap.get('token');
    this.email.set(this.route.snapshot.queryParamMap.get('email'));

    if (token) {
      // Handle cases where the token might be mangled by Quoted-Printable encoding in development terminals
      // (e.g. leading '3D' or soft line breaks '=')
      let cleanToken = token;
      if (cleanToken.startsWith('3D')) {
        cleanToken = cleanToken.substring(2);
      }
      cleanToken = cleanToken.replace(/=/g, '').trim();

      this.token.set(cleanToken);
      this.confirmToken(cleanToken);
    }
  }

  private confirmToken(token: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .confirmEmail(token)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.successMessage.set('Your email has been confirmed.'),
        error: (error: unknown) => {
          if (isAppError(error)) {
            this.errorMessage.set(error.message);
            return;
          }

          this.errorMessage.set('This confirmation link is invalid, expired, or has already been used.');
        },
      });
  }
}

function isAppError(error: unknown): error is AppError {
  return !!error && typeof error === 'object' && 'status' in error && 'message' in error;
}
