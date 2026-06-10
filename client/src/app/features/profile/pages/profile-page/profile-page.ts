import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule, type ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { TabsComponent, type UiTab } from '../../../../shared/components/tabs/tabs.component';
import type { UiTone } from '../../../../shared/components/ui.types';

type ProfileForm = FormGroup<{
  full_name: FormControl<string>;
  phone: FormControl<string>;
}>;

interface ProfileBadge {
  id: string;
  tone: UiTone;
  label: string;
}

const requiredValidator: ValidatorFn = (control) => Validators.required(control);

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [AlertBannerComponent, AvatarComponent, BadgeComponent, ButtonComponent, EmptyStateComponent, ReactiveFormsModule, SpinnerComponent, TabsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-surface-page">
      <div class="mx-auto grid max-w-[var(--ui-container-xl)] gap-lg px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        <header class="grid gap-xs">
          <p class="type-label-sm text-text-muted">Account</p>
          <h1 class="type-heading-xl text-text-primary">Profile</h1>
          <p class="type-body-md text-text-secondary">Manage the contact details used for checkout, delivery, and order support.</p>
        </header>

        @if (loadingUser()) {
          <section class="flex items-center gap-sm rounded-md border-hairline border-border-default bg-surface-raised p-md shadow-xs" aria-label="Loading profile">
            <app-spinner size="sm" label="Loading profile" />
            <span class="type-body-sm text-text-secondary">Loading profile.</span>
          </section>
        } @else if (user(); as currentUser) {
          <section class="grid gap-lg lg:grid-cols-[minmax(var(--ui-container-aside-md),var(--ui-container-aside-xl))_minmax(0,1fr)] lg:items-start">
            <aside class="grid min-w-0 gap-md">
              <section class="grid gap-md rounded-md border border-border bg-card p-md shadow-xs" aria-labelledby="profile-summary-title">
                <div class="flex items-center gap-md">
                  <app-avatar [name]="currentUser.full_name || currentUser.email" size="lg" />
                  <div class="min-w-0">
                    <p class="truncate type-heading-md text-card-foreground">{{ currentUser.full_name }}</p>
                    <p class="truncate type-body-sm text-muted-foreground">{{ currentUser.email }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap gap-xs">
                  @for (badge of profileBadges(); track badge.id) {
                    <app-badge [tone]="badge.tone" [label]="badge.label" />
                  }
                </div>

                <div class="grid gap-sm rounded-md border border-border bg-muted p-sm">
                  <div>
                    <p class="type-label-sm text-muted-foreground">Primary phone</p>
                    <p class="type-body-md text-card-foreground">{{ currentUser.phone || 'Not set' }}</p>
                  </div>
                  <div>
                    <p class="type-label-sm text-muted-foreground">Checkout identity</p>
                    <p class="type-body-sm text-card-foreground">Used for delivery updates and support verification.</p>
                  </div>
                </div>
              </section>
            </aside>

            <div class="grid min-w-0 gap-md">
              <app-tabs [tabs]="tabs" [activeId]="activeTab()" (activeIdChange)="setActiveTab($event)">
                @switch (activeTab()) {
                  @case ('addresses') {
                    <section class="grid gap-md rounded-md border border-border bg-card p-md shadow-xs" aria-labelledby="address-title">
                      <div>
                        <p class="type-label-sm text-muted-foreground">Addresses</p>
                        <h2 id="address-title" class="type-heading-lg text-card-foreground">Saved addresses</h2>
                      </div>
                      <p class="type-body-sm text-muted-foreground">Saved address management is coming soon. For now, delivery details are captured securely during checkout.</p>
                    </section>
                  }
                  @case ('preferences') {
                    <section class="grid gap-md rounded-md border border-border bg-card p-md shadow-xs" aria-labelledby="preferences-title">
                      <div>
                        <p class="type-label-sm text-muted-foreground">Preferences</p>
                        <h2 id="preferences-title" class="type-heading-lg text-card-foreground">Payment and notifications</h2>
                      </div>
                      <p class="type-body-sm text-muted-foreground">Payment methods are selected during checkout. Raw card data and wallet credentials are never stored in the profile workspace.</p>
                    </section>
                  }
                  @default {
                    <form class="grid gap-md rounded-md border border-border bg-card p-md shadow-xs" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
                      <div>
                        <p class="type-label-sm text-muted-foreground">Profile</p>
                        <h2 class="type-heading-lg text-card-foreground">Personal information</h2>
                      </div>

                      @if (error()) {
                        <app-alert-banner tone="error" title="Profile update failed" [message]="error()" />
                      }
                      @if (success()) {
                        <app-alert-banner tone="success" title="Profile updated" message="Your profile changes were saved." />
                      }

                      <div class="grid gap-md md:grid-cols-2">
                        <label class="grid gap-xs type-label-md text-text-primary">
                          Full name
                          <input
                            class="min-h-touch-min w-full rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs type-body-sm text-text-primary shadow-xs interactive-transition placeholder:text-text-muted focus-visible:border-border-focus focus-visible:focus-ring disabled:state-disabled aria-invalid:border-border-error"
                            type="text"
                            formControlName="full_name"
                            autocomplete="name"
                            [attr.aria-invalid]="form.controls.full_name.touched && form.controls.full_name.invalid ? 'true' : null"
                          />
                          @if (form.controls.full_name.touched && form.controls.full_name.invalid) {
                            <span class="type-body-sm text-text-error">Full name is required.</span>
                          }
                        </label>

                        <label class="grid gap-xs type-label-md text-text-primary">
                          Phone number
                          <input
                            class="min-h-touch-min w-full rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs type-body-sm text-text-primary shadow-xs interactive-transition placeholder:text-text-muted focus-visible:border-border-focus focus-visible:focus-ring disabled:state-disabled"
                            type="tel"
                            formControlName="phone"
                            autocomplete="tel"
                          />
                        </label>
                      </div>

                      <label class="grid gap-xs type-label-md text-text-primary">
                        Email address
                        <input
                          class="min-h-touch-min w-full rounded-sm border-hairline border-border-default bg-surface-subtle px-sm py-xs type-body-sm text-text-muted shadow-xs disabled:state-disabled"
                          type="email"
                          [value]="currentUser.email"
                          autocomplete="email"
                          disabled
                        />
                        <span class="type-body-sm text-muted-foreground">Email changes require support verification.</span>
                      </label>

                      <app-button type="submit" [loading]="submitting()" [disabled]="form.invalid">Save changes</app-button>
                    </form>
                  }
                }
              </app-tabs>
            </div>
          </section>
        } @else {
          <app-empty-state
            type="generic"
            title="Sign in required"
            message="Sign in to view and update your profile details."
            [action]="{ label: 'Go to sign in', variant: 'primary' }"
            (actionPressed)="goToLogin()"
          />
        }
      </div>
    </main>
  `,
})
export class ProfilePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly loadingUser = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);
  protected readonly activeTab = signal<'profile' | 'addresses' | 'preferences'>('profile');
  protected readonly profileBadges = computed<readonly ProfileBadge[]>(() => {
    const currentUser = this.user();
    if (!currentUser) {
      return [];
    }

    return [
      { id: 'role', tone: currentUser.role === 'admin' ? 'primary' : 'neutral', label: currentUser.role },
      { id: 'status', tone: currentUser.status === 'active' ? 'success' : 'warning', label: currentUser.status.replace(/_/g, ' ') },
      {
        id: 'email-confirmation',
        tone: currentUser.is_email_confirmed ? 'success' : 'warning',
        label: currentUser.is_email_confirmed ? 'email confirmed' : 'email pending',
      },
    ];
  });
  protected readonly tabs: readonly UiTab[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'preferences', label: 'Preferences' },
  ];

  protected readonly form: ProfileForm = this.fb.group({
    full_name: ['', [requiredValidator]],
    phone: [''],
  });

  ngOnInit(): void {
    if (this.user()) {
      this.populateForm();
      return;
    }

    this.loadingUser.set(true);
    this.auth.loadCurrentUser().pipe(
      finalize(() => this.loadingUser.set(false)),
    ).subscribe({
      next: () => this.populateForm(),
      error: () => this.error.set('Failed to load profile data.'),
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(false);

    this.auth.updateProfile(this.form.getRawValue()).pipe(
      finalize(() => this.submitting.set(false)),
    ).subscribe({
      next: () => {
        this.success.set(true);
        window.setTimeout(() => this.success.set(false), 5000);
      },
      error: (error: unknown) => this.error.set(profileErrorMessage(error)),
    });
  }

  protected goToLogin(): void {
    void this.router.navigateByUrl('/auth/login');
  }

  protected setActiveTab(value: string): void {
    if (value === 'addresses' || value === 'preferences') {
      this.activeTab.set(value);
      return;
    }
    this.activeTab.set('profile');
  }

  private populateForm(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.form.patchValue({
        full_name: currentUser.full_name,
        phone: currentUser.phone ?? '',
      });
    }
  }
}

function profileErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return 'Profile could not be updated.';
}
