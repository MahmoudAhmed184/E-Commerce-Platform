import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen bg-slate-50">
      <!-- Sidebar -->
      <aside class="w-56 shrink-0 border-r border-slate-200 bg-white">
        <div class="px-4 py-6">
          <p class="text-xs font-semibold uppercase tracking-widest text-indigo-600">Admin Panel</p>
        </div>
        <nav class="flex flex-col gap-1 px-2 pb-6" aria-label="Admin navigation">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold"
              class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              <span>{{ link.icon }}</span>{{ link.label }}
            </a>
          }
        </nav>
      </aside>

      <!-- Content -->
      <main class="flex-1 overflow-auto p-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminDashboardPage {
  protected readonly navLinks = [
    { path: 'overview',   label: 'Overview',   icon: '📊' },
    { path: 'users',      label: 'Users',      icon: '👤' },
    { path: 'orders',     label: 'Orders',     icon: '📦' },
    { path: 'products',   label: 'Products',   icon: '🛍️' },
    { path: 'categories', label: 'Categories', icon: '🗂️' },
    { path: 'payments',   label: 'Payments',   icon: '💳' },
    { path: 'reviews',    label: 'Reviews',    icon: '⭐' },
  ];
}
