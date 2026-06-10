import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule, type ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideCheck, LucideHistory, LucideShieldCheck, LucideShoppingBag } from '@lucide/angular';
import { finalize } from 'rxjs';

import type { LoginPayload, User } from '../../../../core/models/user/user.model';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { AuthFlowService, type AuthFlowError } from '../../services/auth-flow/auth-flow.service';

export { loginErrorMessage } from '../../services/auth-flow/auth-flow.service';

type LoginForm = FormGroup<{
  identifier: FormControl<string>;
  password: FormControl<string>;
}>;

const requiredValidator: ValidatorFn = (control) => Validators.required(control);

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    AlertBannerComponent,
    ButtonComponent,
    InputComponent,
    LucideCheck,
    LucideHistory,
    LucideShieldCheck,
    LucideShoppingBag,
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
              <h1 class="type-heading-xl text-text-primary">Sign in to continue shopping</h1>
              <p class="max-w-[32rem] type-body-md text-text-secondary">
                Keep your cart, delivery details, and order history ready whenever you return.
              </p>
            </div>

            <ul class="grid gap-sm">
              <li class="flex items-center gap-sm type-body-sm text-text-secondary">
                <span class="grid size-control-sm place-items-center rounded-full bg-surface-primary-subtle text-text-info">
                  <svg lucideCheck class="h-4 w-4" aria-hidden="true"></svg>
                </span>
                Saved cart synced to your account
              </li>
              <li class="flex items-center gap-sm type-body-sm text-text-secondary">
                <span class="grid size-control-sm place-items-center rounded-full bg-surface-primary-subtle text-text-info">
                  <svg lucideCheck class="h-4 w-4" aria-hidden="true"></svg>
                </span>
                Full order history and tracking
              </li>
              <li class="flex items-center gap-sm type-body-sm text-text-secondary">
                <span class="grid size-control-sm place-items-center rounded-full bg-surface-primary-subtle text-text-info">
                  <svg lucideCheck class="h-4 w-4" aria-hidden="true"></svg>
                </span>
                Faster checkout every time
              </li>
            </ul>
          </aside>

          <section class="grid content-center gap-lg p-lg md:p-xl">
            <header class="grid gap-xs">
              <p class="type-label-sm text-text-muted">Welcome back</p>
              <h2 class="type-heading-xl text-text-primary">Sign in to continue</h2>
              <p class="type-body-md text-text-secondary">Use your email or phone number to continue shopping and track orders.</p>
            </header>

            <form class="grid gap-md" [formGroup]="form" (ngSubmit)="submit()" novalidate>
              @if (formError()) {
                <app-alert-banner tone="error" title="Sign in failed" [message]="formError()" />
              }

              <app-input
                label="Email or phone"
                name="identifier"
                autocomplete="username"
                [value]="identifierControl.value"
                [required]="true"
                [error]="identifierError"
                (valueChange)="updateIdentifier($event)"
                (blurred)="identifierControl.markAsTouched()"
              />

              <app-input
                type="password"
                label="Password"
                name="password"
                autocomplete="current-password"
                [value]="passwordControl.value"
                [required]="true"
                [error]="passwordError"
                (valueChange)="updatePassword($event)"
                (blurred)="passwordControl.markAsTouched()"
              />

              <app-button type="submit" size="lg" [loading]="isLoading()" [fullWidth]="true">Sign in</app-button>
            </form>

            <p class="type-body-sm text-text-secondary">
              Need an account?
              <a class="type-label-md text-text-info focus-visible:focus-ring" routerLink="/auth/register">Create one</a>
            </p>

            <div class="grid gap-sm sm:grid-cols-3">
              <div class="rounded-md border-hairline border-border-default bg-surface-subtle p-sm">
                <svg lucideShoppingBag class="mb-xs h-4 w-4 text-icon-default" aria-hidden="true"></svg>
                <p class="type-label-sm text-text-secondary">Saved cart</p>
              </div>
              <div class="rounded-md border-hairline border-border-default bg-surface-subtle p-sm">
                <svg lucideHistory class="mb-xs h-4 w-4 text-icon-default" aria-hidden="true"></svg>
                <p class="type-label-sm text-text-secondary">Order history</p>
              </div>
              <div class="rounded-md border-hairline border-border-default bg-surface-subtle p-sm">
                <svg lucideShieldCheck class="mb-xs h-4 w-4 text-icon-default" aria-hidden="true"></svg>
                <p class="type-label-sm text-text-secondary">Secure access</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  `,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authFlow = inject(AuthFlowService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoading = signal(false);
  protected readonly formError = signal('');
  protected readonly fieldErrors = signal<Record<string, string[]> | null>(null);

  protected readonly form: LoginForm = this.fb.group({
    identifier: ['', [requiredValidator]],
    password: ['', [requiredValidator]],
  });
  protected readonly identifierControl = this.form.controls.identifier;
  protected readonly passwordControl = this.form.controls.password;
  protected readonly identifierApiError = computed(() => this.fieldErrors()?.['identifier']?.[0] ?? null);
  protected readonly passwordApiError = computed(() => this.fieldErrors()?.['password']?.[0] ?? null);
  protected get identifierRequiredVisible(): boolean {
    return shouldShowControlError(this.identifierControl, 'required');
  }

  protected get identifierError(): string | null {
    return this.identifierApiError() ?? (this.identifierRequiredVisible ? 'This field is required.' : null);
  }

  protected get passwordRequiredVisible(): boolean {
    return shouldShowControlError(this.passwordControl, 'required');
  }

  protected get passwordError(): string | null {
    return this.passwordApiError() ?? (this.passwordRequiredVisible ? 'This field is required.' : null);
  }

  protected updateIdentifier(value: string): void {
    this.identifierControl.setValue(value);
    this.identifierControl.markAsDirty();
    this.fieldErrors.set(null);
  }

  protected updatePassword(value: string): void {
    this.passwordControl.setValue(value);
    this.passwordControl.markAsDirty();
    this.fieldErrors.set(null);
  }

  protected submit(): void {
    this.formError.set('');
    this.fieldErrors.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authFlow
      .login(toLoginPayload(this.form.getRawValue()))
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.navigateAfterLogin(),
        error: (error: unknown) => this.applyError(this.authFlow.loginError(error)),
      });
  }

  private applyError(error: AuthFlowError): void {
    this.fieldErrors.set(error.fieldErrors);
    this.formError.set(error.message);
  }

  private navigateAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    void this.router.navigateByUrl(loginRedirectUrl(this.authService.currentUser(), returnUrl));
  }
}

export function loginRedirectUrl(user: User | null, returnUrl: string | null): string {
  const safeReturnUrl = internalReturnUrl(returnUrl);
  if (safeReturnUrl) {
    return safeReturnUrl;
  }

  return user?.role === 'admin' ? '/admin' : '/products';
}

function toLoginPayload(value: { identifier: string; password: string }): LoginPayload {
  return {
    identifier: value.identifier.trim(),
    password: value.password,
  };
}

function internalReturnUrl(returnUrl: string | null): string | null {
  const trimmed = returnUrl?.trim();
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return null;
  }

  return trimmed;
}

function shouldShowControlError(control: FormControl<string>, errorName: string): boolean {
  return (control.touched || control.dirty) && control.hasError(errorName);
}
