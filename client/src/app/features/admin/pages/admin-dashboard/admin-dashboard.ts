import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-[calc(100dvh-68px)] bg-slate-100 text-slate-950 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside class="border-b border-slate-800 bg-slate-950 text-slate-300 lg:sticky lg:top-[68px] lg:h-[calc(100dvh-68px)] lg:border-r lg:border-b-0">
        <div class="flex items-center justify-between border-b border-white/10 px-5 py-5 lg:block lg:px-6 lg:py-7">
          <div>
            <p class="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-amber-400">Operations</p>
            <h1 class="mt-1 text-xl font-semibold tracking-tight text-white">Admin workspace</h1>
          </div>
          <a
            routerLink="/products"
            class="rounded-md border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 transition hover:border-amber-400/60 hover:text-amber-300 lg:mt-5 lg:inline-flex"
          >
            View store
          </a>
        </div>

        <nav class="flex gap-2 overflow-x-auto px-4 py-3 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-4 lg:py-5" aria-label="Admin navigation">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/20"
              [routerLinkActiveOptions]="{ exact: link.path === '/admin' }"
              class="group flex shrink-0 items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition hover:bg-white/10 hover:text-white"
            >
              <svg
                aria-hidden="true"
                class="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path [attr.d]="link.iconPath" />
              </svg>
              <span>{{ link.label }}</span>
            </a>
          }
        </nav>

        <div class="hidden border-t border-white/10 px-6 py-5 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
          <p class="truncate text-sm font-semibold text-white">{{ authService.currentUser()?.full_name }}</p>
          <p class="mt-0.5 truncate text-xs text-slate-500">{{ authService.currentUser()?.email }}</p>
        </div>
      </aside>

      <main class="min-w-0">
        <div class="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8 xl:p-10">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class AdminDashboardPage {
  protected readonly authService = inject(AuthService);

  protected readonly navLinks = [
    { path: '/admin', label: 'Overview', iconPath: 'M4 13h6V4H4v9Zm0 7h6v-3H4v3Zm10 0h6v-9h-6v9Zm0-16v3h6V4h-6Z' },
    { path: '/admin/users', label: 'Users', iconPath: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    { path: '/admin/orders', label: 'Orders', iconPath: 'm3 7 9 5 9-5M3 7l9-5 9 5v10l-9 5-9-5V7Zm9 5v10' },
    { path: '/admin/products', label: 'Products', iconPath: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6ZM3 6h18M16 10a4 4 0 0 1-8 0' },
    { path: '/admin/categories', label: 'Categories', iconPath: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z' },
    { path: '/admin/payments', label: 'Payments', iconPath: 'M2 7h20v10H2V7Zm0 3h20M6 14h2' },
    { path: '/admin/reviews', label: 'Reviews', iconPath: 'm12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z' },
  ];
}
