import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { type AbstractControl, type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule, type ValidationErrors, type ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { RegisterPayload } from '../../../../core/models/user/user.model';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
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
  imports: [AlertBannerComponent, ButtonComponent, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-background">
      <section class="mx-auto grid min-h-[var(--ui-layout-min-screen-minus-header)] max-w-[var(--ui-container-xl)] px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        <div class="grid overflow-hidden rounded-md border border-border bg-card shadow-sm lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
          <aside class="hidden content-between gap-xl border-e border-border bg-muted p-xl lg:grid">
            <div class="grid gap-sm">
              <p class="type-label-sm text-muted-foreground">New customer</p>
              <h1 class="type-heading-xl text-card-foreground">Create your account</h1>
              <p class="max-w-[32rem] type-body-md text-muted-foreground">Create an account to save contact details, track orders, and move faster through checkout.</p>
            </div>

            <dl class="grid gap-sm">
              <div class="rounded-lg border border-border bg-card p-sm">
                <dt class="type-label-sm text-muted-foreground">Checkout</dt>
                <dd class="mt-2xs type-heading-sm text-card-foreground">Save contact details</dd>
              </div>
              <div class="rounded-lg border border-border bg-card p-sm">
                <dt class="type-label-sm text-muted-foreground">Order support</dt>
                <dd class="mt-2xs type-heading-sm text-card-foreground">Track purchases in one place</dd>
              </div>
            </dl>
          </aside>

          <div class="grid content-center gap-lg p-lg md:p-xl">
            <header class="grid gap-xs">
              <p class="type-label-sm text-muted-foreground">Create account</p>
              <h2 class="type-heading-xl text-card-foreground">Create your shopping account</h2>
              <p class="type-body-md text-muted-foreground">Enter your details, confirm your email, and start shopping with order tracking.</p>
            </header>

            <form class="grid gap-md" [formGroup]="form" (ngSubmit)="submit()" novalidate>
              @if (formError()) {
                <app-alert-banner tone="error" title="Account creation failed" [message]="formError()" />
              }

              <div class="grid gap-md">
                <div class="grid gap-xs">
                  <label class="type-label-md text-card-foreground" for="full_name">Full name</label>
	                  <input
	                    id="full_name"
	                    class="min-h-control-md rounded-sm border border-border bg-card px-sm py-xs text-card-foreground interactive-transition focus-visible:focus-ring aria-invalid:border-border-error"
	                    type="text"
	                    formControlName="full_name"
	                    autocomplete="name"
	                    [attr.aria-invalid]="fullNameAriaInvalid"
	                    [attr.aria-describedby]="fullNameAriaDescribedBy"
	                  />
	                  @if (fullNameApiError(); as message) {
	                    <p id="full_name-error" class="type-body-sm text-text-error" aria-live="polite">{{ message }}</p>
	                  } @else if (fullNameRequiredVisible) {
	                    <p id="full_name-error" class="type-body-sm text-text-error" aria-live="polite">This field is required.</p>
	                  }
	                </div>

                <div class="grid gap-xs">
                  <label class="type-label-md text-card-foreground" for="phone">Phone</label>
	                  <input
	                    id="phone"
	                    class="min-h-control-md rounded-sm border border-border bg-card px-sm py-xs text-card-foreground interactive-transition focus-visible:focus-ring aria-invalid:border-border-error"
	                    type="tel"
	                    formControlName="phone"
	                    autocomplete="tel"
	                    [attr.aria-invalid]="phoneAriaInvalid"
	                    [attr.aria-describedby]="phoneAriaDescribedBy"
	                  />
	                  @if (phoneApiError(); as message) {
	                    <p id="phone-error" class="type-body-sm text-text-error" aria-live="polite">{{ message }}</p>
	                  } @else if (phoneRequiredVisible) {
	                    <p id="phone-error" class="type-body-sm text-text-error" aria-live="polite">This field is required.</p>
	                  } @else if (phoneFormatVisible) {
	                    <p id="phone-error" class="type-body-sm text-text-error" aria-live="polite">Phone must contain 7 to 15 digits.</p>
	                  }
	                </div>
              </div>

              <div class="grid gap-xs">
                <label class="type-label-md text-card-foreground" for="email">Email</label>
	                <input
	                  id="email"
	                  class="min-h-control-md rounded-sm border border-border bg-card px-sm py-xs text-card-foreground interactive-transition focus-visible:focus-ring aria-invalid:border-border-error"
	                  type="email"
	                  formControlName="email"
	                  autocomplete="email"
	                  [attr.aria-invalid]="emailAriaInvalid"
	                  [attr.aria-describedby]="emailAriaDescribedBy"
	                />
	                @if (emailApiError(); as message) {
	                  <p id="email-error" class="type-body-sm text-text-error" aria-live="polite">{{ message }}</p>
	                } @else if (emailRequiredVisible) {
	                  <p id="email-error" class="type-body-sm text-text-error" aria-live="polite">This field is required.</p>
	                } @else if (emailFormatVisible) {
	                  <p id="email-error" class="type-body-sm text-text-error" aria-live="polite">Enter a valid email address.</p>
	                }
	              </div>

              <div class="grid gap-md">
                <div class="grid gap-xs">
                  <label class="type-label-md text-card-foreground" for="password">Password</label>
	                  <input
	                    id="password"
	                    class="min-h-control-md rounded-sm border border-border bg-card px-sm py-xs text-card-foreground interactive-transition focus-visible:focus-ring aria-invalid:border-border-error"
	                    type="password"
	                    formControlName="password"
	                    autocomplete="new-password"
	                    [attr.aria-invalid]="passwordAriaInvalid"
	                    [attr.aria-describedby]="passwordAriaDescribedBy"
	                  />
	                  @if (passwordApiError(); as message) {
	                    <p id="password-error" class="type-body-sm text-text-error" aria-live="polite">{{ message }}</p>
	                  } @else if (passwordRequiredVisible) {
	                    <p id="password-error" class="type-body-sm text-text-error" aria-live="polite">This field is required.</p>
	                  } @else if (passwordTooShortVisible) {
	                    <p id="password-error" class="type-body-sm text-text-error" aria-live="polite">Password must be at least 8 characters.</p>
	                  } @else if (passwordDigitVisible) {
	                    <p id="password-error" class="type-body-sm text-text-error" aria-live="polite">Password must contain at least 1 digit.</p>
	                  }
	                </div>

                <div class="grid gap-xs">
                  <label class="type-label-md text-card-foreground" for="confirmPassword">Confirm password</label>
	                  <input
	                    id="confirmPassword"
	                    class="min-h-control-md rounded-sm border border-border bg-card px-sm py-xs text-card-foreground interactive-transition focus-visible:focus-ring aria-invalid:border-border-error"
	                    type="password"
	                    formControlName="confirmPassword"
	                    autocomplete="new-password"
	                    [attr.aria-invalid]="confirmPasswordAriaInvalid"
	                    [attr.aria-describedby]="confirmPasswordAriaDescribedBy"
	                  />
	                  @if (confirmPasswordApiError(); as message) {
	                    <p id="confirmPassword-error" class="type-body-sm text-text-error" aria-live="polite">{{ message }}</p>
	                  } @else if (confirmPasswordRequiredVisible) {
	                    <p id="confirmPassword-error" class="type-body-sm text-text-error" aria-live="polite">This field is required.</p>
	                  } @else if (confirmPasswordMismatchVisible) {
	                    <p id="confirmPassword-error" class="type-body-sm text-text-error" aria-live="polite">Passwords must match.</p>
	                  }
	                </div>
	              </div>

              <app-button type="submit" [loading]="isLoading()" [fullWidth]="true">Create account</app-button>
            </form>

            <p class="type-body-sm text-muted-foreground">
              Already have an account?
              <a class="type-label-md text-text-info focus-visible:focus-ring" routerLink="/auth/login">Sign in</a>
            </p>
          </div>
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

  protected get confirmPasswordAriaInvalid(): 'true' | null {
    return this.confirmPasswordApiError() || this.confirmPasswordRequiredVisible || this.confirmPasswordMismatchVisible ? 'true' : null;
  }

  protected get confirmPasswordAriaDescribedBy(): 'confirmPassword-error' | null {
    return this.confirmPasswordAriaInvalid ? 'confirmPassword-error' : null;
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
