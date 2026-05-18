import { ChangeDetectionStrategy, Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-dvh bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      <!-- Sidebar -->
      <aside class="flex w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors duration-200">
        <div class="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <p class="text-sm font-bold tracking-widest text-indigo-700 dark:text-indigo-400 uppercase">Store Admin</p>
        </div>
        
        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Admin navigation">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold"
              class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <span class="text-lg">{{ link.icon }}</span>{{ link.label }}
            </a>
          }
        </nav>

        <div class="border-t border-slate-200 dark:border-slate-800 p-4 space-y-2">
          <a
            routerLink="/"
            class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span class="text-lg">🏪</span> Go To Store
          </a>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex flex-1 flex-col overflow-hidden">
        
        <!-- Header -->
        <header class="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-8 shadow-sm transition-colors duration-200">
          <h1 class="text-lg font-semibold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>
          
          <div class="flex items-center gap-4 relative">
            <!-- Theme Toggle -->
            <button 
              (click)="themeService.toggleTheme()"
              class="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme">
              {{ themeService.theme() === 'dark' ? '☀️' : '🌙' }}
            </button>
            
            <div class="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
            
            <!-- User Profile Dropdown -->
            <div class="relative">
              <button 
                (click)="toggleProfileMenu($event)"
                class="flex items-center gap-3 p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none">
                <div class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-sm font-bold text-indigo-700 dark:text-indigo-300">
                  {{ userInitials() }}
                </div>
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">{{ currentUser()?.full_name || 'Admin User' }}</span>
                <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              @if (isProfileMenuOpen()) {
                <div class="absolute right-0 mt-2 w-48 rounded-md bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50 overflow-hidden">
                  <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{{ currentUser()?.full_name }}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ currentUser()?.email }}</p>
                  </div>
                  
                  <a routerLink="profile" (click)="closeProfileMenu()" class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    View Profile
                  </a>
                  <a href="#" (click)="$event.preventDefault(); closeProfileMenu()" class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Settings
                  </a>
                  <div class="border-t border-slate-100 dark:border-slate-800"></div>
                  <button 
                    (click)="logout()" 
                    class="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Logout
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-auto p-8 bg-slate-50/50 dark:bg-slate-900/50 transition-colors duration-200">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminDashboardPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  public readonly themeService = inject(ThemeService);
  private readonly elementRef = inject(ElementRef);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly isProfileMenuOpen = signal(false);
  
  protected readonly navLinks = [
    { path: 'overview',   label: 'Overview',   icon: '📊' },
    { path: 'users',      label: 'Users',      icon: '👥' },
    { path: 'orders',     label: 'Orders',     icon: '📦' },
    { path: 'products',   label: 'Products',   icon: '🛍️' },
    { path: 'categories', label: 'Categories', icon: '🗂️' },
    { path: 'payments',   label: 'Payments',   icon: '💳' },
    { path: 'reviews',    label: 'Reviews',    icon: '⭐' },
  ];

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (this.isProfileMenuOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeProfileMenu();
    }
  }

  protected toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.isProfileMenuOpen.update(val => !val);
  }

  protected closeProfileMenu(): void {
    this.isProfileMenuOpen.set(false);
  }

  protected userInitials(): string {
    const name = this.currentUser()?.full_name;
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  protected logout(): void {
    this.closeProfileMenu();
    this.authService.logout().subscribe({
      next: () => void this.router.navigateByUrl('/auth/login'),
      error: () => void this.router.navigateByUrl('/auth/login'),
    });
  }
}
