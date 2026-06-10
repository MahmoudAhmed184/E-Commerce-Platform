import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { AppError } from '../../../../core/interceptors/error.interceptor';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

type ForgotPasswordForm = FormGroup<{
  email: FormControl<string>;
}>;

@Component({
  selector: 'app-forgot-password-page',
  imports: [ErrorMessageComponent, LoadingSpinnerComponent, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }
    .auth-page {
      min-height: calc(100dvh - 68px);
      display: grid;
      place-items: center;
      padding: 48px 24px;
      background:
        radial-gradient(circle at 50% 0%, rgba(201,148,58,0.12), transparent 38%),
        var(--color-obsidian);
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 40px;
      background: var(--color-carbon);
      border: 1px solid var(--color-charcoal);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      animation: fadeUp 0.5s var(--ease-out) both;
    }
    .eyebrow {
      font-family: var(--font-mono);
      color: var(--color-amber);
      font-size: 0.7rem;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }
    h1 {
      margin-top: 10px;
      color: var(--color-ivory);
      font-family: var(--font-display);
      font-size: 2.35rem;
      font-style: italic;
      line-height: 1.1;
    }
    .intro {
      margin-top: 14px;
      color: var(--color-ivory-ghost);
      font-size: 0.95rem;
      line-height: 1.7;
    }
    form { margin-top: 28px; }
    label {
      display: block;
      margin-bottom: 9px;
      color: var(--color-ivory-ghost);
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    input {
      width: 100%;
      padding: 13px 16px;
      color: var(--color-ivory);
      background: var(--color-obsidian);
      border: 1px solid var(--color-muted);
      border-radius: var(--radius-md);
      outline: none;
    }
    input:focus {
      border-color: var(--color-amber);
      box-shadow: 0 0 0 3px rgba(201,148,58,0.12);
    }
    input[aria-invalid="true"] { border-color: var(--color-danger); }
    .field-error {
      margin-top: 8px;
      color: #f0a8a8;
      font-family: var(--font-mono);
      font-size: 0.72rem;
    }
    button {
      width: 100%;
      margin-top: 22px;
      padding: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--color-void);
      background: linear-gradient(135deg, var(--color-amber), var(--color-amber-light));
      border: 0;
      border-radius: var(--radius-sm);
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      cursor: pointer;
    }
    button:disabled { cursor: wait; opacity: 0.65; }
    .success {
      margin-top: 26px;
      padding: 16px;
      color: #b6edc8;
      background: rgba(45,138,78,0.12);
      border: 1px solid rgba(45,138,78,0.4);
      border-radius: var(--radius-md);
      line-height: 1.6;
    }
    .back-link {
      display: block;
      margin-top: 24px;
      color: var(--color-amber-light);
      text-align: center;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 700;
    }
    .back-link:hover { color: var(--color-ivory); }
    @media (max-width: 480px) {
      .auth-page { padding: 32px 16px; }
      .auth-card { padding: 28px 22px; }
    }
  `],
  template: `
    <main class="auth-page">
      <section class="auth-card" aria-labelledby="forgot-password-title">
        <p class="eyebrow">Account recovery</p>
        <h1 id="forgot-password-title">Reset password</h1>
        <p class="intro">Enter your account email and we will send you a secure reset link.</p>

        @if (success()) {
          <div class="success" role="status">
            If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <app-error-message [message]="formError()" />
            <label for="reset-email">Email address</label>
            <input
              id="reset-email"
              type="email"
              formControlName="email"
              autocomplete="email"
              placeholder="you@example.com"
              [attr.aria-invalid]="emailError() ? 'true' : null"
              aria-describedby="reset-email-error"
            />
            @if (emailError(); as message) {
              <p id="reset-email-error" class="field-error">{{ message }}</p>
            }
            <button type="submit" [disabled]="isLoading()">
              @if (isLoading()) { <app-loading-spinner size="sm" /> }
              {{ isLoading() ? 'Sending...' : 'Send reset link' }}
            </button>
          </form>
        }

        <a routerLink="/auth/login" class="back-link">Back to sign in</a>
      </section>
    </main>
  `,
})
export class ForgotPasswordPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoading = signal(false);
  protected readonly success = signal(false);
  protected readonly formError = signal('');

  protected readonly form: ForgotPasswordForm = this.fb.group({
    email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
  });

  protected submit(): void {
    this.formError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authService
      .requestPasswordReset(this.form.controls.email.value.trim())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.success.set(true),
        error: (error: unknown) => {
          this.formError.set(isAppError(error) ? error.message : 'The reset email could not be sent.');
        },
      });
  }

  protected emailError(): string | null {
    const control = this.form.controls.email;
    if (!control.touched && !control.dirty) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Email is required.';
    }
    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }
    return null;
  }
}

function isAppError(error: unknown): error is AppError {
  return !!error && typeof error === 'object' && 'status' in error && 'message' in error;
}
