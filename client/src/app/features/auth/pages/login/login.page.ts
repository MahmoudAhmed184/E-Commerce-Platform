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
  template: `
    <section class="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-10">
      <div class="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p class="text-sm font-medium uppercase tracking-wide text-indigo-600">Welcome back</p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-950">Login</h1>
        </div>

        <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <app-error-message [message]="formError()" [fieldErrors]="fieldErrors()" />

          <div>
            <label for="identifier" class="block text-sm font-medium text-slate-700">Email or Phone</label>
            <input
              id="identifier"
              type="text"
              formControlName="identifier"
              autocomplete="username"
              class="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
              [attr.aria-invalid]="hasFieldError('identifier')"
              aria-describedby="identifier-error"
            />
            @if (fieldMessage('identifier'); as message) {
              <p id="identifier-error" class="mt-2 text-sm text-red-700">{{ message }}</p>
            }
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              class="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
              [attr.aria-invalid]="hasFieldError('password')"
              aria-describedby="password-error"
            />
            @if (fieldMessage('password'); as message) {
              <p id="password-error" class="mt-2 text-sm text-red-700">{{ message }}</p>
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
            Login
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-600">
          Need an account?
          <a routerLink="/auth/register" class="font-medium text-indigo-700 hover:text-indigo-800">Register</a>
        </p>
      </div>
    </section>
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
