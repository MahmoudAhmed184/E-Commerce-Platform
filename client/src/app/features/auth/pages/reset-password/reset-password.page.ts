import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { AppError } from '../../../../core/interceptors/error.interceptor';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

type ResetPasswordForm = FormGroup<{
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}>;

@Component({
  selector: 'app-reset-password-page',
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
      max-width: 460px;
      padding: 40px;
      background: var(--color-carbon);
      border: 1px solid var(--color-charcoal);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      animation: fadeUp 0.5s var(--ease-out) both;
    }
    .eyebrow {
      color: var(--color-amber);
      font-family: var(--font-mono);
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
    .field { margin-top: 20px; }
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
    .hint {
      margin-top: 9px;
      color: var(--color-ivory-ghost);
      font-size: 0.78rem;
    }
    button {
      width: 100%;
      margin-top: 24px;
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
    .login-link {
      display: block;
      margin-top: 24px;
      color: var(--color-amber-light);
      text-align: center;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 700;
    }
    .login-link:hover { color: var(--color-ivory); }
    @media (max-width: 480px) {
      .auth-page { padding: 32px 16px; }
      .auth-card { padding: 28px 22px; }
    }
  `],
  template: `
    <main class="auth-page">
      <section class="auth-card" aria-labelledby="reset-password-title">
        <p class="eyebrow">Secure recovery</p>
        <h1 id="reset-password-title">Choose a new password</h1>
        <p class="intro">Use a strong password you have not used for this account before.</p>

        @if (success()) {
          <div class="success" role="status">
            Your password has been changed. You can now sign in with the new password.
          </div>
          <a routerLink="/auth/login" class="login-link">Continue to sign in</a>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <app-error-message [message]="formError()" [fieldErrors]="fieldErrors()" />

            <div class="field">
              <label for="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                formControlName="password"
                autocomplete="new-password"
                [attr.aria-invalid]="fieldMessage('password') ? 'true' : null"
                aria-describedby="new-password-error new-password-hint"
              />
              <p id="new-password-hint" class="hint">At least 8 characters and one number.</p>
              @if (fieldMessage('password'); as message) {
                <p id="new-password-error" class="field-error">{{ message }}</p>
              }
            </div>

            <div class="field">
              <label for="confirm-new-password">Confirm new password</label>
              <input
                id="confirm-new-password"
                type="password"
                formControlName="confirmPassword"
                autocomplete="new-password"
                [attr.aria-invalid]="fieldMessage('confirmPassword') ? 'true' : null"
                aria-describedby="confirm-new-password-error"
              />
              @if (fieldMessage('confirmPassword'); as message) {
                <p id="confirm-new-password-error" class="field-error">{{ message }}</p>
              }
            </div>

            <button type="submit" [disabled]="isLoading() || !hasResetLink">
              @if (isLoading()) { <app-loading-spinner size="sm" /> }
              {{ isLoading() ? 'Updating...' : 'Update password' }}
            </button>
          </form>

          <a routerLink="/auth/forgot-password" class="login-link">Request another reset link</a>
        }
      </section>
    </main>
  `,
})
export class ResetPasswordPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  private readonly uid = this.route.snapshot.paramMap.get('uid') ?? '';
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  protected readonly hasResetLink = !!this.uid && !!this.token;
  protected readonly isLoading = signal(false);
  protected readonly success = signal(false);
  protected readonly formError = signal(this.hasResetLink ? '' : 'This password reset link is incomplete.');
  protected readonly fieldErrors = signal<Record<string, string[]> | null>(null);

  protected readonly form: ResetPasswordForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), passwordDigitValidator()]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordsMatchValidator()] },
  );

  protected submit(): void {
    this.formError.set('');
    this.fieldErrors.set(null);

    if (!this.hasResetLink) {
      this.formError.set('This password reset link is incomplete.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.isLoading.set(true);
    this.authService
      .resetPassword({
        uid: this.uid,
        token: this.token,
        new_password: value.password,
        confirm_password: value.confirmPassword,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.success.set(true),
        error: (error: unknown) => {
          if (isAppError(error)) {
            this.fieldErrors.set(error.fieldErrors ?? null);
            this.formError.set(error.message);
            return;
          }
          this.formError.set('This password reset link is invalid or expired.');
        },
      });
  }

  protected fieldMessage(field: keyof ResetPasswordForm['controls']): string | null {
    const apiField = field === 'password' ? 'new_password' : 'confirm_password';
    const apiError = this.fieldErrors()?.[apiField]?.[0];
    if (apiError) {
      return apiError;
    }

    const control = this.form.controls[field];
    if (!control.touched && !control.dirty) {
      return null;
    }
    if (control.hasError('required')) {
      return 'This field is required.';
    }
    if (control.hasError('minlength')) {
      return 'Password must be at least 8 characters long.';
    }
    if (control.hasError('passwordDigit')) {
      return 'Password must contain at least one number.';
    }
    if (field === 'confirmPassword' && this.form.hasError('passwordMismatch')) {
      return 'Passwords do not match.';
    }
    return null;
  }
}

function passwordDigitValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    /\d/.test(control.value) ? null : { passwordDigit: true };
}

function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    control.get('password')?.value === control.get('confirmPassword')?.value
      ? null
      : { passwordMismatch: true };
}

function isAppError(error: unknown): error is AppError {
  return !!error && typeof error === 'object' && 'status' in error && 'message' in error;
}
