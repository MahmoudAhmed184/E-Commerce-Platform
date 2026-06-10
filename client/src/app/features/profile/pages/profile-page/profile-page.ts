import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { AppError } from '../../../../core/interceptors/error.interceptor';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [UpperCasePipe, ReactiveFormsModule, RouterLink],
  styles: [`
    :host { display: block; }

    .profile-container {
      max-width: 820px;
      margin: 0 auto;
      padding: 56px 32px;
      animation: fadeUp 0.5s var(--ease-out) both;
    }

    /* ─── Page Header ─── */
    .page-header {
      margin-bottom: 40px;
      padding-bottom: 32px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .page-eyebrow {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 500;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--color-amber);
      margin-bottom: 10px;
    }

    .page-title {
      font-family: var(--font-display);
      font-size: 2.4rem;
      font-weight: 700;
      font-style: italic;
      color: var(--color-ivory);
      margin: 0;
      line-height: 1;
    }

    .page-subtitle {
      font-size: 0.9rem;
      color: var(--color-ivory-ghost);
      margin-top: 10px;
    }

    /* ─── Card ─── */
    .profile-card {
      background: var(--color-carbon);
      border: 1px solid var(--color-charcoal);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }

    .security-card { margin-top: 28px; }

    .security-header {
      padding: 28px 32px;
      background: var(--color-charcoal);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .security-title {
      margin: 0;
      color: var(--color-ivory);
      font-family: var(--font-display);
      font-size: 1.35rem;
      font-weight: 600;
    }

    .security-copy {
      margin-top: 7px;
      color: var(--color-ivory-ghost);
      font-size: 0.875rem;
      line-height: 1.6;
    }

    /* ─── User Identity Strip ─── */
    .identity-strip {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 28px 32px;
      background: var(--color-charcoal);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-amber-dim), var(--color-amber));
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--color-void);
      flex-shrink: 0;
    }

    .identity-info { flex-grow: 1; }

    .identity-name {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--color-ivory);
      margin: 0 0 4px;
    }

    .identity-email {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: var(--color-ivory-ghost);
      letter-spacing: 0.02em;
    }

    .badge-row { display: flex; gap: 8px; align-items: center; }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.62rem;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .badge-role {
      background: rgba(201,148,58,0.12);
      border: 1px solid rgba(201,148,58,0.25);
      color: var(--color-amber);
    }

    .badge-admin {
      background: rgba(130,100,210,0.15);
      border: 1px solid rgba(130,100,210,0.3);
      color: #c4b5f4;
    }

    .badge-status-active {
      background: rgba(45,138,78,0.12);
      border: 1px solid rgba(45,138,78,0.25);
      color: #6edc9a;
    }

    .badge-status-pending {
      background: rgba(180,140,30,0.12);
      border: 1px solid rgba(180,140,30,0.25);
      color: #f0d070;
    }

    .badge-status-other {
      background: rgba(160,48,48,0.12);
      border: 1px solid rgba(160,48,48,0.25);
      color: #f0a8a8;
    }

    /* ─── Form Body ─── */
    .form-body {
      padding: 32px;
    }

    .field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .field-full { grid-column: 1 / -1; }

    .field { display: flex; flex-direction: column; gap: 10px; }

    .field-label {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--color-amber);
    }

    .field-input {
      width: 100%;
      padding: 12px 16px;
      background: var(--color-charcoal);
      border: 1px solid var(--color-muted);
      border-radius: var(--radius-md);
      color: var(--color-ivory);
      font-family: var(--font-body);
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.25s, box-shadow 0.25s;
      box-sizing: border-box;
    }

    .field-input::placeholder { color: var(--color-ivory-ghost); }

    .field-input:focus {
      border-color: var(--color-amber);
      box-shadow: 0 0 0 3px rgba(201,148,58,0.12);
    }

    .field-input:disabled {
      background: var(--color-carbon);
      color: var(--color-ivory-ghost);
      cursor: not-allowed;
      border-color: var(--color-charcoal);
    }

    .field-note {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: var(--color-ivory-ghost);
      letter-spacing: 0.04em;
    }

    .field-error {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: #f0a8a8;
      letter-spacing: 0.04em;
    }

    /* ─── Alerts ─── */
    .alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: var(--radius-md);
      margin-bottom: 24px;
      font-size: 0.875rem;
    }

    .alert-error {
      background: rgba(160,48,48,0.12);
      border: 1px solid rgba(160,48,48,0.25);
      color: #f0a8a8;
    }

    .alert-success {
      background: rgba(45,138,78,0.12);
      border: 1px solid rgba(45,138,78,0.25);
      color: #6edc9a;
    }

    /* ─── Form Actions ─── */
    .form-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 20px;
      padding-top: 28px;
      margin-top: 28px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .btn-save {
      padding: 13px 32px;
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
      transition: all 0.25s var(--ease-out);
    }

    .btn-save:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(201,148,58,0.35);
    }

    .btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .recovery-link {
      margin-right: auto;
      color: var(--color-amber-light);
      font-size: 0.82rem;
      font-weight: 700;
      line-height: 1.5;
      text-decoration: none;
    }

    .recovery-link:hover { color: var(--color-ivory); }

    /* ─── States ─── */
    .loading-state, .empty-state {
      text-align: center;
      padding: 64px 0;
    }

    .loading-state p, .empty-state p {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      color: var(--color-ivory-ghost);
      margin-top: 16px;
      letter-spacing: 0.05em;
    }

    .empty-state a {
      display: inline-block;
      margin-top: 20px;
      color: var(--color-amber-light);
      font-family: var(--font-mono);
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      text-decoration: none;
      text-transform: uppercase;
      transition: color 0.2s;
    }

    .empty-state a:hover { color: var(--color-ivory); }

    @media (max-width: 600px) {
      .profile-container { padding: 32px 16px; }
      .field-grid { grid-template-columns: 1fr; }
      .identity-strip { padding: 20px; }
      .form-body { padding: 20px; }
      .security-header { padding: 20px; }
      .form-actions {
        align-items: stretch;
        flex-direction: column;
      }
      .recovery-link {
        margin-right: 0;
        text-align: center;
      }
    }
  `],
  template: `
    <div class="profile-container">
      <div class="page-header">
        <p class="page-eyebrow">Account</p>
        <h1 class="page-title">My Profile</h1>
        <p class="page-subtitle">Manage your personal information and account preferences.</p>
      </div>

      @if (loadingUser()) {
        <div class="loading-state">
          <div class="sc-spinner"></div>
          <p>Loading profile…</p>
        </div>
      } @else if (user()) {
        <div class="profile-card">

          <!-- Identity strip -->
          <div class="identity-strip">
            <div class="avatar">{{ (user()?.full_name ?? 'U').charAt(0).toUpperCase() }}</div>
            <div class="identity-info">
              <p class="identity-name">{{ user()?.full_name }}</p>
              <p class="identity-email">{{ user()?.email }}</p>
            </div>
            <div class="badge-row">
              <span class="badge" [class.badge-admin]="user()?.role === 'admin'" [class.badge-role]="user()?.role !== 'admin'">
                {{ user()?.role }}
              </span>
              <span class="badge"
                [class.badge-status-active]="user()?.status === 'active'"
                [class.badge-status-pending]="user()?.status === 'pending_approval'"
                [class.badge-status-other]="user()?.status !== 'active' && user()?.status !== 'pending_approval'">
                {{ user()?.status | uppercase }}
              </span>
            </div>
          </div>

          <!-- Form -->
          <div class="form-body">
            <form [formGroup]="form" (ngSubmit)="onSubmit()">

              @if (error()) {
                <div class="alert alert-error">
                  <span>{{ error() }}</span>
                </div>
              }

              @if (success()) {
                <div class="alert alert-success">
                  <span>Profile updated successfully.</span>
                </div>
              }

              <div class="field-grid">
                <div class="field field-full">
                  <label for="full_name" class="field-label">Full Name</label>
                  <input id="full_name" type="text" class="field-input" formControlName="full_name" placeholder="Jane Doe" />
                  @if (form.controls.full_name.touched && form.controls.full_name.invalid) {
                    <span class="field-error">Full name is required.</span>
                  }
                </div>

                <div class="field field-full">
                  <label for="email" class="field-label">Email Address</label>
                  <input id="email" type="email" class="field-input" [value]="user()?.email" disabled />
                  <span class="field-note">Email address cannot be changed.</span>
                </div>

                <div class="field field-full">
                  <label for="phone" class="field-label">Phone Number <span style="opacity:0.5;font-size:0.85em">(optional)</span></label>
                  <input id="phone" type="tel" class="field-input" formControlName="phone" placeholder="+1 234 567 8900" />
                </div>
              </div>

              <div class="form-actions">
                <button id="profile-save-btn" type="submit" class="btn-save" [disabled]="form.invalid || submitting()">
                  {{ submitting() ? 'Saving…' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="profile-card security-card">
          <div class="security-header">
            <h2 class="security-title">Password &amp; Security</h2>
            <p class="security-copy">Change your password using your current password, or request a secure email reset link.</p>
          </div>

          <div class="form-body">
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" novalidate>
              @if (passwordError()) {
                <div class="alert alert-error" role="alert">
                  <span>{{ passwordError() }}</span>
                </div>
              }

              @if (passwordSuccess()) {
                <div class="alert alert-success" role="status">
                  <span>Password updated successfully.</span>
                </div>
              }

              <div class="field-grid">
                <div class="field field-full">
                  <label for="current_password" class="field-label">Current Password</label>
                  <input
                    id="current_password"
                    type="password"
                    class="field-input"
                    formControlName="current_password"
                    autocomplete="current-password"
                  />
                  @if (passwordFieldMessage('current_password'); as message) {
                    <span class="field-error">{{ message }}</span>
                  }
                </div>

                <div class="field">
                  <label for="new_password" class="field-label">New Password</label>
                  <input
                    id="new_password"
                    type="password"
                    class="field-input"
                    formControlName="new_password"
                    autocomplete="new-password"
                  />
                  <span class="field-note">At least 8 characters and one number.</span>
                  @if (passwordFieldMessage('new_password'); as message) {
                    <span class="field-error">{{ message }}</span>
                  }
                </div>

                <div class="field">
                  <label for="confirm_password" class="field-label">Confirm New Password</label>
                  <input
                    id="confirm_password"
                    type="password"
                    class="field-input"
                    formControlName="confirm_password"
                    autocomplete="new-password"
                  />
                  @if (passwordFieldMessage('confirm_password'); as message) {
                    <span class="field-error">{{ message }}</span>
                  }
                </div>
              </div>

              <div class="form-actions">
                <a
                  routerLink="/auth/forgot-password"
                  [queryParams]="{ email: user()?.email }"
                  class="recovery-link"
                >
                  Forgot your current password? Send a reset email
                </a>
                <button
                  id="profile-password-save-btn"
                  type="submit"
                  class="btn-save"
                  [disabled]="passwordForm.invalid || passwordSubmitting()"
                >
                  {{ passwordSubmitting() ? 'Updating…' : 'Update Password' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <p>You must be signed in to view your profile.</p>
          <a routerLink="/auth/login">Sign in →</a>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly user = this.auth.currentUser;
  readonly loadingUser = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly passwordSubmitting = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal(false);
  readonly passwordFieldErrors = signal<Record<string, string[]> | null>(null);

  readonly form = this.fb.group({
    full_name: ['', [Validators.required]],
    phone: [''],
  });

  readonly passwordForm = this.fb.group(
    {
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8), passwordDigitValidator()]],
      confirm_password: ['', [Validators.required]],
    },
    { validators: [passwordsMatchValidator()] },
  );

  ngOnInit(): void {
    if (this.user()) {
      this.populateForm();
    } else {
      this.loadingUser.set(true);
      this.auth.loadCurrentUser().pipe(
        finalize(() => this.loadingUser.set(false))
      ).subscribe({
        next: () => this.populateForm(),
        error: () => this.error.set('Failed to load profile data.')
      });
    }
  }

  private populateForm(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.form.patchValue({
        full_name: currentUser.full_name,
        phone: currentUser.phone || '',
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(false);

    this.auth.updateProfile(this.form.getRawValue()).pipe(
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: () => {
        this.success.set(true);
        setTimeout(() => this.success.set(false), 5000);
      },
      error: (err) => {
        this.error.set(err.message || 'An error occurred while updating your profile.');
      }
    });
  }

  changePassword(): void {
    this.passwordError.set(null);
    this.passwordSuccess.set(false);
    this.passwordFieldErrors.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordSubmitting.set(true);
    this.auth
      .changePassword(this.passwordForm.getRawValue())
      .pipe(finalize(() => this.passwordSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.passwordSuccess.set(true);
          setTimeout(() => this.passwordSuccess.set(false), 5000);
        },
        error: (error: unknown) => {
          if (isAppError(error)) {
            this.passwordFieldErrors.set(error.fieldErrors ?? null);
            this.passwordError.set(error.message);
            return;
          }
          this.passwordError.set('Password could not be updated.');
        },
      });
  }

  passwordFieldMessage(field: keyof typeof this.passwordForm.controls): string | null {
    const apiError = this.passwordFieldErrors()?.[field]?.[0];
    if (apiError) {
      return apiError;
    }

    const control = this.passwordForm.controls[field];
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
    if (field === 'confirm_password' && this.passwordForm.hasError('passwordMismatch')) {
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
    control.get('new_password')?.value === control.get('confirm_password')?.value
      ? null
      : { passwordMismatch: true };
}

function isAppError(error: unknown): error is AppError {
  return !!error && typeof error === 'object' && 'status' in error && 'message' in error;
}
