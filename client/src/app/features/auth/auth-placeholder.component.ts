import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-placeholder',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-4 py-12">
      <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-medium uppercase tracking-wide text-indigo-600">Auth</p>
        <h1 class="mt-2 text-2xl font-semibold text-slate-950">Authentication shell</h1>
        <p class="mt-3 text-slate-600">Register, login, and email confirmation routes land here until the auth feature is implemented.</p>
        <a routerLink="/products" class="mt-6 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          View products
        </a>
      </div>
    </section>
  `,
})
export class AuthPlaceholderComponent {}
