import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-products-placeholder',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col justify-center px-4 py-12">
      <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-medium uppercase tracking-wide text-indigo-600">Products</p>
        <h1 class="mt-2 text-2xl font-semibold text-slate-950">Storefront shell</h1>
        <p class="mt-3 text-slate-600">Product listing and detail pages will be implemented in the catalog feature.</p>
        <div class="mt-6 flex flex-wrap gap-3">
          @if (authService.isLoggedIn()) {
            <a routerLink="/profile" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">View profile</a>
          } @else {
            <a routerLink="/auth/login" class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Login</a>
            <a routerLink="/auth/register" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Register</a>
          }
        </div>
      </div>
    </section>
  `,
})
export class ProductsPlaceholderComponent {
  protected readonly authService = inject(AuthService);
}
