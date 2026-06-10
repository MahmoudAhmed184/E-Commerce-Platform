import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { AppError } from '../../../../core/interceptors/error.interceptor';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

type LoginForm = FormGroup<{
  identifier: FormControl<string>;
  password: FormControl<string>;
}>;

@Component({
  selector: 'app-login-page',
  imports: [ErrorMessageComponent, LoadingSpinnerComponent, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    .auth-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: calc(100dvh - 68px);
    }

    /* Left panel — editorial art */
    .art-panel {
      background: var(--color-carbon);
      border-right: 1px solid rgba(201,148,58,0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 48px;
      position: relative;
      overflow: hidden;
    }

    .art-panel::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 70% 60% at 30% 40%, rgba(201,148,58,0.12) 0%, transparent 70%),
        radial-gradient(ellipse 50% 50% at 80% 80%, rgba(201,148,58,0.05) 0%, transparent 60%);
    }

    .art-quote {
      position: relative;
      z-index: 1;
      text-align: center;
    }

    .art-quote blockquote {
      font-family: var(--font-display);
      font-size: 2.4rem;
      font-style: italic;
      font-weight: 600;
      color: var(--color-ivory);
      line-height: 1.25;
      margin: 0 0 32px;
    }

    .art-quote blockquote span {
      color: var(--color-amber);
    }

    .art-tagline {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--color-ivory-ghost);
    }

    .art-ornament {
      position: absolute;
      width: 200px;
      height: 200px;
      border: 1px solid rgba(201,148,58,0.08);
      border-radius: 50%;
      animation: spin 30s linear infinite;
    }

    .art-ornament-2 {
      width: 320px;
      height: 320px;
      border-color: rgba(201,148,58,0.04);
      animation-duration: 45s;
      animation-direction: reverse;
    }

    /* Right panel — form */
    .form-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 64px 48px;
      background: var(--color-obsidian);
    }

    .form-inner {
      width: 100%;
      max-width: 400px;
      animation: fadeUp 0.6s var(--ease-out) both;
    }

    .form-eyebrow {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--color-amber);
      margin-bottom: 12px;
    }

    .form-title {
      font-family: var(--font-display);
      font-size: 2.6rem;
      font-weight: 700;
      font-style: italic;
      color: var(--color-ivory);
      margin: 0 0 40px;
      line-height: 1;
    }

    .field {
      margin-bottom: 24px;
      animation: fadeUp 0.6s var(--ease-out) both;
    }

    .field:nth-child(2) { animation-delay: 0.05s; }
    .field:nth-child(3) { animation-delay: 0.10s; }

    .field-label {
      display: block;
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--color-ivory-ghost);
      margin-bottom: 10px;
    }

    .field-input {
      width: 100%;
      padding: 13px 16px;
      background: var(--color-carbon);
      border: 1px solid var(--color-muted);
      border-radius: var(--radius-md);
      color: var(--color-ivory);
      font-family: var(--font-body);
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.25s, box-shadow 0.25s;
    }

    .field-input::placeholder { color: var(--color-ivory-ghost); }
    .field-input:focus {
      border-color: var(--color-amber);
      box-shadow: 0 0 0 3px rgba(201,148,58,0.12);
    }
    .field-input[aria-invalid="true"] {
      border-color: #A03030;
    }

    .field-error {
      margin-top: 8px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: #f0a8a8;
      letter-spacing: 0.04em;
    }

    .forgot-link {
      display: block;
      margin-top: 10px;
      text-align: right;
      color: var(--color-amber-light);
      font-size: 0.8rem;
      font-weight: 700;
      text-decoration: none;
    }

    .forgot-link:hover { color: var(--color-ivory); }

    .btn-submit {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, var(--color-amber), var(--color-amber-light));
      color: var(--color-void);
      border: none;
      border-radius: var(--radius-sm);
      font-family: var(--font-body);
      font-size: 0.875rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      cursor: pointer;
      margin-top: 8px;
      transition: all 0.25s var(--ease-out);
      animation: fadeUp 0.6s 0.15s var(--ease-out) both;
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(201,148,58,0.4);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-footer {
      margin-top: 28px;
      text-align: center;
      font-size: 0.875rem;
      color: var(--color-ivory-ghost);
      animation: fadeIn 0.6s 0.2s var(--ease-out) both;
    }

    .form-footer a {
      color: var(--color-amber-light);
      text-decoration: none;
      font-weight: 700;
      transition: color 0.2s;
    }

    .form-footer a:hover { color: var(--color-ivory); }

    @media (max-width: 768px) {
      .auth-layout {
        grid-template-columns: 1fr;
      }
      .art-panel { display: none; }
      .form-panel { padding: 48px 24px; min-height: calc(100dvh - 68px); }
    }
  `],
  template: `
    <div class="auth-layout">
      <!-- Art Panel -->
      <div class="art-panel" aria-hidden="true">
        <div class="art-ornament"></div>
        <div class="art-ornament art-ornament-2"></div>
        <div class="art-quote">
          <blockquote>Premium goods,<br><span>delivered</span> with care.</blockquote>
          <p class="art-tagline">Stack Commerce — Est. 2024</p>
        </div>
      </div>

      <!-- Form Panel -->
      <div class="form-panel">
        <div class="form-inner">
          <p class="form-eyebrow">Welcome back</p>
          <h1 class="form-title">Sign In</h1>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <app-error-message [message]="formError()" [fieldErrors]="fieldErrors()" />

            <div class="field">
              <label for="identifier" class="field-label">Email or Phone</label>
              <input
                id="identifier"
                type="text"
                class="field-input"
                formControlName="identifier"
                autocomplete="username"
                placeholder="you@example.com"
                [attr.aria-invalid]="hasFieldError('identifier')"
                aria-describedby="identifier-error"
              />
              @if (fieldMessage('identifier'); as msg) {
                <p id="identifier-error" class="field-error">{{ msg }}</p>
              }
            </div>

            <div class="field">
              <label for="password" class="field-label">Password</label>
              <input
                id="password"
                type="password"
                class="field-input"
                formControlName="password"
                autocomplete="current-password"
                placeholder="••••••••"
                [attr.aria-invalid]="hasFieldError('password')"
                aria-describedby="password-error"
              />
              @if (fieldMessage('password'); as msg) {
                <p id="password-error" class="field-error">{{ msg }}</p>
              }
              <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              class="btn-submit"
              [disabled]="isLoading()"
            >
              @if (isLoading()) {
                <app-loading-spinner size="sm" />
              }
              {{ isLoading() ? 'Signing In…' : 'Sign In' }}
            </button>
          </form>

          <p class="form-footer">
            No account yet?
            <a routerLink="/auth/register">Create one</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoading = signal(false);
  protected readonly formError = signal('');
  protected readonly fieldErrors = signal<Record<string, string[]> | null>(null);

  protected readonly form: LoginForm = this.fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    this.formError.set('');
    this.fieldErrors.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.isLoading.set(true);

    this.authService
      .login({
        identifier: value.identifier.trim(),
        password: value.password,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/products';
          void this.router.navigateByUrl(returnUrl);
        },
        error: (error: unknown) => this.applyError(error),
      });
  }

  protected hasFieldError(field: keyof LoginForm['controls']): boolean {
    return !!this.fieldMessage(field);
  }

  protected fieldMessage(field: keyof LoginForm['controls']): string | null {
    const apiError = this.fieldErrors()?.[field]?.[0];

    if (apiError) {
      return apiError;
    }

    const control = this.form.controls[field];

    if ((control.touched || control.dirty) && control.hasError('required')) {
      return 'This field is required.';
    }

    return null;
  }

  private applyError(error: unknown): void {
    if (isAppError(error)) {
      this.fieldErrors.set(error.fieldErrors ?? null);
      this.formError.set(loginErrorMessage(error));
      return;
    }

    this.formError.set('Login could not be completed.');
  }
}

export function loginErrorMessage(error: AppError): string {
  if (error.status === 401) {
    return 'Invalid credentials.';
  }

  if (error.status === 403) {
    if (error.code === 'account_restricted' || error.accountStatus === 'restricted') {
      return 'Your account has been restricted. Contact support.';
    }

    if (error.code === 'account_deleted' || error.accountStatus === 'soft_deleted') {
      return 'This account no longer exists.';
    }

    if (error.code === 'email_confirmation_required' || error.accountStatus === 'pending_approval') {
      return 'Please confirm your email before logging in.';
    }

    const message = error.message.toLowerCase();

    if (message.includes('restricted')) {
      return 'Your account has been restricted. Contact support.';
    }

    if (message.includes('deleted') || message.includes('soft_deleted')) {
      return 'This account no longer exists.';
    }

    return 'Please confirm your email before logging in.';
  }

  return error.message;
}

function isAppError(error: unknown): error is AppError {
  return !!error && typeof error === 'object' && 'status' in error && 'message' in error;
}
