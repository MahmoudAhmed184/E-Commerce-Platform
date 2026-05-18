import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-dvh bg-slate-50 overflow-hidden">
      <!-- Sidebar -->
      <aside class="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div class="flex h-16 items-center px-6 border-b border-slate-100">
          <p class="text-sm font-bold tracking-widest text-indigo-700 uppercase">Store Admin</p>
        </div>
        
        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Admin navigation">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold"
              class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span class="text-lg">{{ link.icon }}</span>{{ link.label }}
            </a>
          }
        </nav>

        <div class="border-t border-slate-200 p-4 space-y-2">
          <a
            routerLink="/"
            class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span class="text-lg">🏪</span> Go To Store
          </a>
          <button
            type="button"
            (click)="logout()"
            class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <span class="text-lg">🚪</span> Logout
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex flex-1 flex-col overflow-hidden">
        
        <!-- Header -->
        <header class="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
          <h1 class="text-lg font-semibold text-slate-800">Admin Dashboard</h1>
          
          <div class="flex items-center gap-4">
            <!-- Theme Toggle Stub -->
            <button class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
              🌙
            </button>
            
            <div class="h-8 w-px bg-slate-200"></div>
            
            <!-- User Profile -->
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {{ userInitials() }}
              </div>
              <span class="text-sm font-medium text-slate-700">{{ currentUser()?.full_name || 'Admin User' }}</span>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-auto p-8 bg-slate-50/50">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminDashboardPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  
  protected readonly navLinks = [
    { path: 'overview',   label: 'Overview',   icon: '📊' },
    { path: 'users',      label: 'Users',      icon: '👥' },
    { path: 'orders',     label: 'Orders',     icon: '📦' },
    { path: 'products',   label: 'Products',   icon: '🛍️' },
    { path: 'categories', label: 'Categories', icon: '🗂️' },
    { path: 'payments',   label: 'Payments',   icon: '💳' },
    { path: 'reviews',    label: 'Reviews',    icon: '⭐' },
  ];

  protected userInitials(): string {
    const name = this.currentUser()?.full_name;
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigateByUrl('/auth/login'),
      error: () => void this.router.navigateByUrl('/auth/login'),
    });
  }
}
