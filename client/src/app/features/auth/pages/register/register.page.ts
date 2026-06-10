import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { type AbstractControl, type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule, type ValidationErrors, type ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideCheck, LucideMailCheck, LucidePackageCheck, LucideUserCheck } from '@lucide/angular';
import { finalize } from 'rxjs';

import type { RegisterPayload } from '../../../../core/models/user/user.model';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { AuthFlowService, type AuthFlowError } from '../../services/auth-flow/auth-flow.service';

type RegisterForm = FormGroup<{
  full_name: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}>;

const requiredValidator: ValidatorFn = (control) => Validators.required(control);
const emailValidator: ValidatorFn = (control) => Validators.email(control);

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    AlertBannerComponent,
    ButtonComponent,
    InputComponent,
    LucideCheck,
    LucideMailCheck,
    LucidePackageCheck,
    LucideUserCheck,
    ReactiveFormsModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-surface-page">
      <section class="mx-auto grid min-h-[var(--ui-layout-min-screen-minus-header)] max-w-[var(--ui-container-xl)] px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        <div class="grid overflow-hidden rounded-md border-hairline border-border-default bg-surface-raised shadow-sm lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
          <aside class="hidden content-between gap-xl border-e-hairline border-border-default bg-surface-subtle p-xl lg:grid">
            <div class="grid gap-sm">
              <div class="inline-flex items-center gap-xs">
                <img class="size-11 object-contain" src="logo-icon.png?v=20260522" alt="" width="1024" height="1024" aria-hidden="true" />
                <span class="type-label-lg text-text-primary">Vendra</span>
              </div>
              <h1 class="type-heading-xl text-text-primary">Create your account</h1>
              <p class="max-w-[32rem] type-body-md text-text-secondary">
                Save checkout details, confirm your email, and track every purchase from one secure account.
              </p>
            </div>

            <ul class="grid gap-sm">
              <li class="flex items-center gap-sm type-body-sm text-text-secondary">
                <span class="grid size-control-sm place-items-center rounded-full bg-surface-primary-subtle text-text-info">
                  <svg lucideCheck class="h-4 w-4" aria-hidden="true"></svg>
                </span>
                Contact details ready for checkout
              </li>
              <li class="flex items-center gap-sm type-body-sm text-text-secondary">
                <span class="grid size-control-sm place-items-center rounded-full bg-surface-primary-subtle text-text-info">
                  <svg lucideCheck class="h-4 w-4" aria-hidden="true"></svg>
                </span>
                Email confirmation protects access
              </li>
              <li class="flex items-center gap-sm type-body-sm text-text-secondary">
                <span class="grid size-control-sm place-items-center rounded-full bg-surface-primary-subtle text-text-info">
                  <svg lucideCheck class="h-4 w-4" aria-hidden="true"></svg>
                </span>
                Order tracking from your first purchase
              </li>
            </ul>
          </aside>

          <section class="grid content-center gap-lg p-lg md:p-xl">
            <header class="grid gap-xs">
              <p class="type-label-sm text-text-muted">New account</p>
              <h2 class="type-heading-xl text-text-primary">Set up your checkout profile</h2>
              <p class="type-body-md text-text-secondary">Enter your contact details once, then use them for faster orders and support.</p>
            </header>

            <form class="grid gap-md" [formGroup]="form" (ngSubmit)="submit()" novalidate>
              @if (formError()) {
                <app-alert-banner tone="error" title="Account creation failed" [message]="formError()" />
              }

              <div class="grid gap-md md:grid-cols-2">
                <app-input
                  label="Full name"
                  name="full_name"
                  autocomplete="name"
                  [value]="fullNameControl.value"
                  [required]="true"
                  [error]="fullNameError"
                  (valueChange)="updateControl(fullNameControl, $event)"
                  (blurred)="fullNameControl.markAsTouched()"
                />

                <app-input
                  type="tel"
                  label="Phone"
                  name="phone"
                  autocomplete="tel"
                  [value]="phoneControl.value"
                  [required]="true"
                  [error]="phoneError"
                  (valueChange)="updateControl(phoneControl, $event)"
                  (blurred)="phoneControl.markAsTouched()"
                />
              </div>

              <app-input
                type="email"
                label="Email"
                name="email"
                autocomplete="email"
                [value]="emailControl.value"
                [required]="true"
                [error]="emailError"
                (valueChange)="updateControl(emailControl, $event)"
                (blurred)="emailControl.markAsTouched()"
              />

              <div class="grid gap-md md:grid-cols-2">
                <app-input
                  type="password"
                  label="Password"
                  name="password"
                  autocomplete="new-password"
                  [value]="passwordControl.value"
                  [required]="true"
                  [error]="passwordError"
                  (valueChange)="updateControl(passwordControl, $event)"
                  (blurred)="passwordControl.markAsTouched()"
                />

                <app-input
                  type="password"
                  label="Confirm password"
                  name="confirmPassword"
                  autocomplete="new-password"
                  [value]="confirmPasswordControl.value"
                  [required]="true"
                  [error]="confirmPasswordError"
                  (valueChange)="updateControl(confirmPasswordControl, $event)"
                  (blurred)="confirmPasswordControl.markAsTouched()"
                />
              </div>

              <app-button type="submit" size="lg" [loading]="isLoading()" [fullWidth]="true">Create account</app-button>
            </form>

            <p class="type-body-sm text-text-secondary">
              Already have an account?
              <a class="type-label-md text-text-info focus-visible:focus-ring" routerLink="/auth/login">Sign in</a>
            </p>

            <div class="grid gap-sm sm:grid-cols-3">
              <div class="rounded-md border-hairline border-border-default bg-surface-subtle p-sm">
                <svg lucideUserCheck class="mb-xs h-4 w-4 text-icon-default" aria-hidden="true"></svg>
                <p class="type-label-sm text-text-secondary">Checkout profile</p>
              </div>
              <div class="rounded-md border-hairline border-border-default bg-surface-subtle p-sm">
                <svg lucideMailCheck class="mb-xs h-4 w-4 text-icon-default" aria-hidden="true"></svg>
                <p class="type-label-sm text-text-secondary">Email confirmation</p>
              </div>
              <div class="rounded-md border-hairline border-border-default bg-surface-subtle p-sm">
                <svg lucidePackageCheck class="mb-xs h-4 w-4 text-icon-default" aria-hidden="true"></svg>
                <p class="type-label-sm text-text-secondary">Order tracking</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  `,
})
export class RegisterPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authFlow = inject(AuthFlowService);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(false);
  protected readonly formError = signal('');
  protected readonly fieldErrors = signal<Record<string, string[]> | null>(null);

  protected readonly form: RegisterForm = this.fb.group(
    {
      full_name: ['', [requiredValidator]],
      email: ['', [requiredValidator, emailValidator]],
      phone: ['', [requiredValidator, phoneValidator()]],
      password: ['', [requiredValidator, Validators.minLength(8), passwordDigitValidator()]],
      confirmPassword: ['', [requiredValidator]],
    },
    {
      validators: [passwordsMatchValidator()],
    },
  );
  protected readonly fullNameControl = this.form.controls.full_name;
  protected readonly emailControl = this.form.controls.email;
  protected readonly phoneControl = this.form.controls.phone;
  protected readonly passwordControl = this.form.controls.password;
  protected readonly confirmPasswordControl = this.form.controls.confirmPassword;
  protected readonly fullNameApiError = computed(() => this.fieldErrors()?.['full_name']?.[0] ?? null);
  protected readonly emailApiError = computed(() => this.fieldErrors()?.['email']?.[0] ?? null);
  protected readonly phoneApiError = computed(() => this.fieldErrors()?.['phone']?.[0] ?? null);
  protected readonly passwordApiError = computed(() => this.fieldErrors()?.['password']?.[0] ?? null);
  protected readonly confirmPasswordApiError = computed(() => this.fieldErrors()?.['confirmPassword']?.[0] ?? null);

  protected get fullNameRequiredVisible(): boolean {
    return shouldShowControlError(this.fullNameControl, 'required');
  }

  protected get fullNameError(): string | null {
    return this.fullNameApiError() ?? (this.fullNameRequiredVisible ? 'This field is required.' : null);
  }

  protected get fullNameAriaInvalid(): 'true' | null {
    return this.fullNameApiError() || this.fullNameRequiredVisible ? 'true' : null;
  }

  protected get fullNameAriaDescribedBy(): 'full_name-error' | null {
    return this.fullNameAriaInvalid ? 'full_name-error' : null;
  }

  protected get phoneRequiredVisible(): boolean {
    return shouldShowControlError(this.phoneControl, 'required');
  }

  protected get phoneFormatVisible(): boolean {
    return shouldShowControlError(this.phoneControl, 'phone');
  }

  protected get phoneError(): string | null {
    return this.phoneApiError()
      ?? (this.phoneRequiredVisible ? 'This field is required.' : null)
      ?? (this.phoneFormatVisible ? 'Phone must contain 7 to 15 digits.' : null);
  }

  protected get phoneAriaInvalid(): 'true' | null {
    return this.phoneApiError() || this.phoneRequiredVisible || this.phoneFormatVisible ? 'true' : null;
  }

  protected get phoneAriaDescribedBy(): 'phone-error' | null {
    return this.phoneAriaInvalid ? 'phone-error' : null;
  }

  protected get emailRequiredVisible(): boolean {
    return shouldShowControlError(this.emailControl, 'required');
  }

  protected get emailFormatVisible(): boolean {
    return shouldShowControlError(this.emailControl, 'email');
  }

  protected get emailError(): string | null {
    return this.emailApiError()
      ?? (this.emailRequiredVisible ? 'This field is required.' : null)
      ?? (this.emailFormatVisible ? 'Enter a valid email address.' : null);
  }

  protected get emailAriaInvalid(): 'true' | null {
    return this.emailApiError() || this.emailRequiredVisible || this.emailFormatVisible ? 'true' : null;
  }

  protected get emailAriaDescribedBy(): 'email-error' | null {
    return this.emailAriaInvalid ? 'email-error' : null;
  }

  protected get passwordRequiredVisible(): boolean {
    return shouldShowControlError(this.passwordControl, 'required');
  }

  protected get passwordTooShortVisible(): boolean {
    return shouldShowControlError(this.passwordControl, 'minlength');
  }

  protected get passwordDigitVisible(): boolean {
    return shouldShowControlError(this.passwordControl, 'passwordDigit');
  }

  protected get passwordError(): string | null {
    return this.passwordApiError()
      ?? (this.passwordRequiredVisible ? 'This field is required.' : null)
      ?? (this.passwordTooShortVisible ? 'Password must be at least 8 characters.' : null)
      ?? (this.passwordDigitVisible ? 'Password must contain at least 1 digit.' : null);
  }

  protected get passwordAriaInvalid(): 'true' | null {
    return this.passwordApiError() || this.passwordRequiredVisible || this.passwordTooShortVisible || this.passwordDigitVisible ? 'true' : null;
  }

  protected get passwordAriaDescribedBy(): 'password-error' | null {
    return this.passwordAriaInvalid ? 'password-error' : null;
  }

  protected get confirmPasswordRequiredVisible(): boolean {
    return shouldShowControlError(this.confirmPasswordControl, 'required');
  }

  protected get confirmPasswordMismatchVisible(): boolean {
    return (this.confirmPasswordControl.touched || this.confirmPasswordControl.dirty) && this.form.hasError('passwordMismatch');
  }

  protected get confirmPasswordError(): string | null {
    return this.confirmPasswordApiError()
      ?? (this.confirmPasswordRequiredVisible ? 'This field is required.' : null)
      ?? (this.confirmPasswordMismatchVisible ? 'Passwords must match.' : null);
  }

  protected get confirmPasswordAriaInvalid(): 'true' | null {
    return this.confirmPasswordApiError() || this.confirmPasswordRequiredVisible || this.confirmPasswordMismatchVisible ? 'true' : null;
  }

  protected get confirmPasswordAriaDescribedBy(): 'confirmPassword-error' | null {
    return this.confirmPasswordAriaInvalid ? 'confirmPassword-error' : null;
  }

  protected updateControl(control: FormControl<string>, value: string): void {
    control.setValue(value);
    control.markAsDirty();
    this.fieldErrors.set(null);
  }

  protected submit(): void {
    this.formError.set('');
    this.fieldErrors.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.isLoading.set(true);

    this.authFlow
      .register(toRegisterPayload(value))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.navigateToConfirmation(value.email),
        error: (error: unknown) => this.applyError(this.authFlow.registrationError(error)),
      });
  }

  private applyError(error: AuthFlowError): void {
    this.fieldErrors.set(error.fieldErrors);
    this.formError.set(error.message);
  }

  private navigateToConfirmation(email: string): void {
    void this.router.navigate(['/auth/confirm-email'], {
      queryParams: { email: email.trim() },
    });
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
    const password = stringControlValue(control, 'password');
    const confirmPassword = stringControlValue(control, 'confirmPassword');

    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}

function stringControlValue(control: AbstractControl, name: string): string {
  const child = control.get(name);
  if (!child) {
    return '';
  }

  const value: unknown = child.value;
  return typeof value === 'string' ? value : '';
}

function toRegisterPayload(value: { full_name: string; email: string; phone: string; password: string }): RegisterPayload {
  return {
    full_name: value.full_name.trim(),
    email: value.email.trim(),
    phone: value.phone.trim(),
    password: value.password,
  };
}

function shouldShowControlError(control: FormControl<string>, errorName: string): boolean {
  return (control.touched || control.dirty) && control.hasError(errorName);
}
