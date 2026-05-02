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
  template: `
    <section class="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-4 py-10">
      <div class="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p class="text-sm font-medium uppercase tracking-wide text-indigo-600">Create account</p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-950">Register</h1>
          <p class="mt-2 text-sm text-slate-600">Use an email address and phone number for your customer account.</p>
        </div>

        <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <app-error-message [message]="formError()" [fieldErrors]="fieldErrors()" />

          <div>
            <label for="full_name" class="block text-sm font-medium text-slate-700">Full Name</label>
            <input
              id="full_name"
              type="text"
              formControlName="full_name"
              autocomplete="name"
              class="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
              [attr.aria-invalid]="hasFieldError('full_name')"
              aria-describedby="full_name-error"
            />
            @if (fieldMessage('full_name'); as message) {
              <p id="full_name-error" class="mt-2 text-sm text-red-700">{{ message }}</p>
            }
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              autocomplete="email"
              class="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
              [attr.aria-invalid]="hasFieldError('email')"
              aria-describedby="email-error"
            />
            @if (fieldMessage('email'); as message) {
              <p id="email-error" class="mt-2 text-sm text-red-700">{{ message }}</p>
            }
          </div>

          <div>
            <label for="phone" class="block text-sm font-medium text-slate-700">Phone</label>
            <input
              id="phone"
              type="tel"
              formControlName="phone"
              autocomplete="tel"
              class="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
              [attr.aria-invalid]="hasFieldError('phone')"
              aria-describedby="phone-error"
            />
            @if (fieldMessage('phone'); as message) {
              <p id="phone-error" class="mt-2 text-sm text-red-700">{{ message }}</p>
            }
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="new-password"
              class="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
              [attr.aria-invalid]="hasFieldError('password')"
              aria-describedby="password-error"
            />
            @if (fieldMessage('password'); as message) {
              <p id="password-error" class="mt-2 text-sm text-red-700">{{ message }}</p>
            }
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-slate-700">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              autocomplete="new-password"
              class="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
              [attr.aria-invalid]="hasFieldError('confirmPassword')"
              aria-describedby="confirmPassword-error"
            />
            @if (fieldMessage('confirmPassword'); as message) {
              <p id="confirmPassword-error" class="mt-2 text-sm text-red-700">{{ message }}</p>
            }
          </div>

          <button
            type="submit"
            class="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            [disabled]="isLoading()"
          >
            @if (isLoading()) {
              <app-loading-spinner size="sm" />
            }
            Register
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-600">
          Already have an account?
          <a routerLink="/auth/login" class="font-medium text-indigo-700 hover:text-indigo-800">Login</a>
        </p>
      </div>
    </section>
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
