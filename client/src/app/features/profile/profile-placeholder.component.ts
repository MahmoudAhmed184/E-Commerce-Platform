import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-4 py-12">
      <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-medium uppercase tracking-wide text-indigo-600">Profile</p>
        <h1 class="mt-2 text-2xl font-semibold text-slate-950">Account status</h1>
        @if (authService.currentUser(); as user) {
          <dl class="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-slate-500">Name</dt>
              <dd class="mt-1 text-slate-950">{{ user.full_name }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-slate-500">Email</dt>
              <dd class="mt-1 text-slate-950">{{ user.email }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-slate-500">Role</dt>
              <dd class="mt-1 text-slate-950">{{ user.role }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-slate-500">Status</dt>
              <dd class="mt-1 text-slate-950">{{ user.status }}</dd>
            </div>
          </dl>
        } @else {
          <p class="mt-3 text-slate-600">Sign in to load your account details.</p>
        }
      </div>
    </section>
  `,
})
export class ProfilePlaceholderComponent {
  protected readonly authService = inject(AuthService);
}
