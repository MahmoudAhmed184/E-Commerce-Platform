import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule, type ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { LoginPayload, User } from '../../../../core/models/user/user.model';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
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
  imports: [AlertBannerComponent, ButtonComponent, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-background">
      <section class="mx-auto grid min-h-[var(--ui-layout-min-screen-minus-header)] max-w-[var(--ui-container-xl)] px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        <div class="grid overflow-hidden rounded-md border border-border bg-card shadow-sm lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
          <aside class="hidden content-between gap-xl border-e border-border bg-muted p-xl lg:grid">
            <div class="grid gap-sm">
              <p class="type-label-sm text-muted-foreground">Customer access</p>
              <h1 class="type-heading-xl text-card-foreground">Sign in</h1>
              <p class="max-w-[32rem] type-body-md text-muted-foreground">Access your saved cart, delivery details, and order history from one secure account.</p>
            </div>

            <dl class="grid gap-sm md:grid-cols-3">
              <div class="rounded-lg border border-border bg-card p-sm">
                <dt class="type-label-sm text-muted-foreground">Checkout</dt>
                <dd class="mt-2xs type-heading-sm text-card-foreground">Resume saved details</dd>
              </div>
              <div class="rounded-lg border border-border bg-card p-sm">
                <dt class="type-label-sm text-muted-foreground">Orders</dt>
                <dd class="mt-2xs type-heading-sm text-card-foreground">Track every order</dd>
              </div>
              <div class="rounded-lg border border-border bg-card p-sm">
                <dt class="type-label-sm text-muted-foreground">Support</dt>
                <dd class="mt-2xs type-heading-sm text-card-foreground">Get account help</dd>
              </div>
            </dl>
          </aside>

          <div class="grid content-center gap-lg p-lg md:p-xl">
            <header class="grid gap-xs">
              <p class="type-label-sm text-muted-foreground">Welcome back</p>
              <h2 class="type-heading-xl text-card-foreground">Sign in to continue</h2>
              <p class="type-body-md text-muted-foreground">Use your email or phone number to continue shopping and track orders.</p>
            </header>

            <form class="grid gap-md" [formGroup]="form" (ngSubmit)="submit()" novalidate>
              @if (formError()) {
                <app-alert-banner tone="error" title="Sign in failed" [message]="formError()" />
              }

              <div class="grid gap-xs">
                <label class="type-label-md text-card-foreground" for="identifier">Email or phone</label>
	                <input
	                  id="identifier"
	                  class="min-h-control-md rounded-sm border border-border bg-card px-sm py-xs text-card-foreground interactive-transition placeholder:text-muted-foreground focus-visible:focus-ring aria-invalid:border-border-error"
	                  type="text"
	                  formControlName="identifier"
	                  autocomplete="username"
	                  [attr.aria-invalid]="identifierAriaInvalid"
	                  [attr.aria-describedby]="identifierAriaDescribedBy"
	                />
	                @if (identifierApiError(); as message) {
	                  <p id="identifier-error" class="type-body-sm text-text-error" aria-live="polite">{{ message }}</p>
	                } @else if (identifierRequiredVisible) {
	                  <p id="identifier-error" class="type-body-sm text-text-error" aria-live="polite">This field is required.</p>
	                }
	              </div>

              <div class="grid gap-xs">
                <label class="type-label-md text-card-foreground" for="password">Password</label>
	                <input
	                  id="password"
	                  class="min-h-control-md rounded-sm border border-border bg-card px-sm py-xs text-card-foreground interactive-transition placeholder:text-muted-foreground focus-visible:focus-ring aria-invalid:border-border-error"
	                  type="password"
	                  formControlName="password"
	                  autocomplete="current-password"
	                  [attr.aria-invalid]="passwordAriaInvalid"
	                  [attr.aria-describedby]="passwordAriaDescribedBy"
	                />
	                @if (passwordApiError(); as message) {
	                  <p id="password-error" class="type-body-sm text-text-error" aria-live="polite">{{ message }}</p>
	                } @else if (passwordRequiredVisible) {
	                  <p id="password-error" class="type-body-sm text-text-error" aria-live="polite">This field is required.</p>
	                }
	              </div>

              <app-button type="submit" [loading]="isLoading()" [fullWidth]="true">Sign in</app-button>
            </form>

            <p class="type-body-sm text-muted-foreground">
              Need an account?
              <a class="type-label-md text-text-info focus-visible:focus-ring" routerLink="/auth/register">Create one</a>
            </p>
          </div>
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

  protected get identifierAriaInvalid(): 'true' | null {
    return this.identifierApiError() || this.identifierRequiredVisible ? 'true' : null;
  }

  protected get identifierAriaDescribedBy(): 'identifier-error' | null {
    return this.identifierAriaInvalid ? 'identifier-error' : null;
  }

  protected get passwordRequiredVisible(): boolean {
    return shouldShowControlError(this.passwordControl, 'required');
  }

  protected get passwordAriaInvalid(): 'true' | null {
    return this.passwordApiError() || this.passwordRequiredVisible ? 'true' : null;
  }

  protected get passwordAriaDescribedBy(): 'password-error' | null {
    return this.passwordAriaInvalid ? 'password-error' : null;
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
