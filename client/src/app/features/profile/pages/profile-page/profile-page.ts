import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [UpperCasePipe, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="px-6 py-8 border-b border-gray-200">
          <h1 class="text-2xl font-bold text-gray-900">My Profile</h1>
          <p class="mt-1 text-sm text-gray-500">Manage your personal information and preferences.</p>
        </div>

        <div class="px-6 py-6">
          @if (loadingUser()) {
            <div class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          } @else if (user()) {
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
              
              @if (error()) {
                <div class="rounded-md bg-red-50 p-4">
                  <div class="flex">
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-red-800">Error updating profile</h3>
                      <div class="mt-2 text-sm text-red-700">
                        <p>{{ error() }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              }

              @if (success()) {
                <div class="rounded-md bg-green-50 p-4">
                  <div class="flex">
                    <div class="ml-3">
                      <p class="text-sm font-medium text-green-800">Profile updated successfully!</p>
                    </div>
                  </div>
                </div>
              }

              <div class="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                <div class="sm:col-span-2">
                  <label for="full_name" class="block text-sm font-medium text-gray-700">Full Name</label>
                  <div class="mt-1">
                    <input
                      type="text"
                      id="full_name"
                      formControlName="full_name"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>
                  @if (form.controls.full_name.touched && form.controls.full_name.invalid) {
                    <p class="mt-2 text-sm text-red-600">Full name is required.</p>
                  }
                </div>

                <div class="sm:col-span-2">
                  <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                  <div class="mt-1">
                    <input
                      type="email"
                      id="email"
                      [value]="user()?.email"
                      disabled
                      class="block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 text-gray-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <p class="mt-2 text-sm text-gray-500">Email cannot be changed.</p>
                </div>

                <div class="sm:col-span-2">
                  <label for="phone" class="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                  <div class="mt-1">
                    <input
                      type="tel"
                      id="phone"
                      formControlName="phone"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>
                </div>

                <div class="sm:col-span-1">
                  <p class="block text-sm font-medium text-gray-700">Role</p>
                  <div class="mt-1">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                          [class.bg-purple-100]="user()?.role === 'admin'"
                          [class.text-purple-800]="user()?.role === 'admin'"
                          [class.bg-gray-100]="user()?.role !== 'admin'"
                          [class.text-gray-800]="user()?.role !== 'admin'">
                      {{ user()?.role }}
                    </span>
                  </div>
                </div>

                <div class="sm:col-span-1">
                  <p class="block text-sm font-medium text-gray-700">Status</p>
                  <div class="mt-1">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [class.bg-green-100]="user()?.status === 'active'"
                          [class.text-green-800]="user()?.status === 'active'"
                          [class.bg-yellow-100]="user()?.status === 'pending_approval'"
                          [class.text-yellow-800]="user()?.status === 'pending_approval'"
                          [class.bg-red-100]="user()?.status === 'restricted' || user()?.status === 'soft_deleted'"
                          [class.text-red-800]="user()?.status === 'restricted' || user()?.status === 'soft_deleted'">
                      {{ user()?.status | uppercase }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex justify-end pt-6">
                <button
                  type="submit"
                  [disabled]="form.invalid || submitting()"
                  class="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  @if (submitting()) {
                    <span class="mr-2">Saving...</span>
                  } @else {
                    <span>Save Changes</span>
                  }
                </button>
              </div>
            </form>
          } @else {
            <div class="text-center py-8">
              <p class="text-gray-500">Please log in to view your profile.</p>
            </div>
          }
        </div>
      </div>
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

  readonly form = this.fb.group({
    full_name: ['', [Validators.required]],
    phone: [''],
  });

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
}
