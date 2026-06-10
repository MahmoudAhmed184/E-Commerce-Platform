import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { AppError } from '../../../../core/interceptors/error.interceptor';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

type RegisterForm = FormGroup<{
  full_name: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}>;

@Component({
  selector: 'app-register-page',
  imports: [ErrorMessageComponent, LoadingSpinnerComponent, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    .auth-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: calc(100dvh - 68px);
    }

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
        radial-gradient(ellipse 80% 70% at 60% 30%, rgba(201,148,58,0.10) 0%, transparent 70%),
        radial-gradient(ellipse 60% 60% at 20% 80%, rgba(201,148,58,0.06) 0%, transparent 60%);
    }

    .art-content {
      position: relative;
      z-index: 1;
      text-align: center;
    }

    .art-number {
      font-family: var(--font-display);
      font-size: 8rem;
      font-weight: 700;
      font-style: italic;
      color: rgba(201,148,58,0.08);
      line-height: 1;
      margin-bottom: -20px;
      display: block;
    }

    .art-heading {
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-style: italic;
      font-weight: 600;
      color: var(--color-ivory);
      line-height: 1.25;
      margin: 0 0 20px;
    }

    .art-heading em {
      color: var(--color-amber);
      font-style: italic;
    }

    .art-steps {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 40px;
    }

    .art-step {
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: left;
    }

    .step-num {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      width: 24px;
      height: 24px;
      border: 1px solid var(--color-amber-dim);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-amber);
      flex-shrink: 0;
    }

    .step-text {
      font-family: var(--font-body);
      font-size: 0.875rem;
      color: var(--color-ivory-ghost);
    }

    .form-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 64px 48px;
      background: var(--color-obsidian);
      overflow-y: auto;
    }

    .form-inner {
      width: 100%;
      max-width: 420px;
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
      font-size: 2.4rem;
      font-weight: 700;
      font-style: italic;
      color: var(--color-ivory);
      margin: 0 0 36px;
      line-height: 1;
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .field {
      margin-bottom: 20px;
    }

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
      padding: 12px 16px;
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
    .field-input[aria-invalid="true"] { border-color: #A03030; }

    .field-error {
      margin-top: 8px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: #f0a8a8;
      letter-spacing: 0.04em;
    }

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
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(201,148,58,0.4);
    }

    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

    .form-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 0.875rem;
      color: var(--color-ivory-ghost);
    }

    .form-footer a {
      color: var(--color-amber-light);
      text-decoration: none;
      font-weight: 700;
      transition: color 0.2s;
    }

    .form-footer a:hover { color: var(--color-ivory); }

    @media (max-width: 900px) {
      .field-row { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .auth-layout { grid-template-columns: 1fr; }
      .art-panel { display: none; }
      .form-panel { padding: 48px 24px; min-height: calc(100dvh - 68px); }
    }
  `],
  template: `
    <div class="auth-layout">
      <!-- Art Panel -->
      <div class="art-panel" aria-hidden="true">
        <div class="art-content">
          <span class="art-number">01</span>
          <h2 class="art-heading">Join the<br><em>Stack</em> family.</h2>
          <div class="art-steps">
            <div class="art-step">
              <span class="step-num">1</span>
              <span class="step-text">Create your account in seconds</span>
            </div>
            <div class="art-step">
              <span class="step-num">2</span>
              <span class="step-text">Confirm your email address</span>
            </div>
            <div class="art-step">
              <span class="step-num">3</span>
              <span class="step-text">Start shopping premium products</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Panel -->
      <div class="form-panel">
        <div class="form-inner">
          <p class="form-eyebrow">Create account</p>
          <h1 class="form-title">Register</h1>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <app-error-message [message]="formError()" [fieldErrors]="fieldErrors()" />

            <div class="field">
              <label for="full_name" class="field-label">Full Name</label>
              <input id="full_name" type="text" class="field-input" formControlName="full_name"
                autocomplete="name" placeholder="Jane Doe"
                [attr.aria-invalid]="hasFieldError('full_name')" aria-describedby="full_name-error" />
              @if (fieldMessage('full_name'); as msg) {
                <p id="full_name-error" class="field-error">{{ msg }}</p>
              }
            </div>

            <div class="field-row">
              <div class="field">
                <label for="email" class="field-label">Email</label>
                <input id="email" type="email" class="field-input" formControlName="email"
                  autocomplete="email" placeholder="you@example.com"
                  [attr.aria-invalid]="hasFieldError('email')" aria-describedby="email-error" />
                @if (fieldMessage('email'); as msg) {
                  <p id="email-error" class="field-error">{{ msg }}</p>
                }
              </div>

              <div class="field">
                <label for="phone" class="field-label">Phone</label>
                <input id="phone" type="tel" class="field-input" formControlName="phone"
                  autocomplete="tel" placeholder="+1 234 567 8900"
                  [attr.aria-invalid]="hasFieldError('phone')" aria-describedby="phone-error" />
                @if (fieldMessage('phone'); as msg) {
                  <p id="phone-error" class="field-error">{{ msg }}</p>
                }
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="password" class="field-label">Password</label>
                <input id="password" type="password" class="field-input" formControlName="password"
                  autocomplete="new-password" placeholder="••••••••"
                  [attr.aria-invalid]="hasFieldError('password')" aria-describedby="password-error" />
                @if (fieldMessage('password'); as msg) {
                  <p id="password-error" class="field-error">{{ msg }}</p>
                }
              </div>

              <div class="field">
                <label for="confirmPassword" class="field-label">Confirm</label>
                <input id="confirmPassword" type="password" class="field-input" formControlName="confirmPassword"
                  autocomplete="new-password" placeholder="••••••••"
                  [attr.aria-invalid]="hasFieldError('confirmPassword')" aria-describedby="confirmPassword-error" />
                @if (fieldMessage('confirmPassword'); as msg) {
                  <p id="confirmPassword-error" class="field-error">{{ msg }}</p>
                }
              </div>
            </div>

            <button id="register-submit-btn" type="submit" class="btn-submit" [disabled]="isLoading()">
              @if (isLoading()) { <app-loading-spinner size="sm" /> }
              {{ isLoading() ? 'Creating Account…' : 'Create Account' }}
            </button>
          </form>

          <p class="form-footer">
            Already have an account? <a routerLink="/auth/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(false);
  protected readonly formError = signal('');
  protected readonly fieldErrors = signal<Record<string, string[]> | null>(null);

  protected readonly form: RegisterForm = this.fb.group(
    {
      full_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, phoneValidator()]],
      password: ['', [Validators.required, Validators.minLength(8), passwordDigitValidator()]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [passwordsMatchValidator()],
    },
  );

  protected submit(): void {
    this.formError.set('');
    this.fieldErrors.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const phone = value.phone.trim();
    this.isLoading.set(true);

    this.authService
      .register({
        full_name: value.full_name.trim(),
        email: value.email.trim(),
        phone,
        password: value.password,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/auth/confirm-email'], {
            queryParams: {
              email: value.email.trim(),
            },
          });
        },
        error: (error: unknown) => this.applyError(error),
      });
  }

  protected hasFieldError(field: keyof RegisterForm['controls']): boolean {
    return !!this.fieldMessage(field);
  }

  protected fieldMessage(field: keyof RegisterForm['controls']): string | null {
    const apiError = this.fieldErrors()?.[field]?.[0];

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

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (control.hasError('phone')) {
      return 'Phone must contain 7 to 15 digits.';
    }

    if (control.hasError('minlength')) {
      return 'Password must be at least 8 characters.';
    }

    if (control.hasError('passwordDigit')) {
      return 'Password must contain at least 1 digit.';
    }

    if (field === 'confirmPassword' && this.form.hasError('passwordMismatch')) {
      return 'Passwords must match.';
    }

    return null;
  }

  private applyError(error: unknown): void {
    if (isAppError(error)) {
      this.fieldErrors.set(error.fieldErrors ?? null);
      this.formError.set(error.message);
      return;
    }

    this.formError.set('Registration could not be completed.');
  }
}

function phoneValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value.trim();

    if (!value) {
      return null;
    }

    return /^\d{7,15}$/.test(value) ? null : { phone: true };
  };
}

function passwordDigitValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => (/\d/.test(control.value) ? null : { passwordDigit: true });
}

function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}

function isAppError(error: unknown): error is AppError {
  return !!error && typeof error === 'object' && 'status' in error && 'message' in error;
}
