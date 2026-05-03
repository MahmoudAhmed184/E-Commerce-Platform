import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-4 py-12">
      <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-medium uppercase tracking-wide text-indigo-600">Admin</p>
        <h1 class="mt-2 text-2xl font-semibold text-slate-950">Admin shell</h1>
        <p class="mt-3 text-slate-600">Admin operations will be added by the admin feature.</p>
      </div>
    </section>
  `,
})
export class AdminPlaceholderComponent {}
