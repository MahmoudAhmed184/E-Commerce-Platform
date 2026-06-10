import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="border-b border-slate-200 bg-white dark:bg-slate-950">
      <nav class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4" aria-label="Primary navigation">
        <a routerLink="/products" class="text-lg font-semibold text-slate-950">Stack Commerce</a>
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <a routerLink="/products" routerLinkActive="text-indigo-700" class="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Products</a>
          <a routerLink="/cart" routerLinkActive="text-indigo-700" class="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Cart</a>
          <a routerLink="/orders" routerLinkActive="text-indigo-700" class="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Orders</a>
          <a [routerLink]="authService.isAdmin() ? '/admin/profile' : '/profile'" routerLinkActive="text-indigo-700" class="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Profile</a>
          @if (authService.isLoggedIn()) {
            <button type="button" class="rounded-md bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" (click)="logout()">Logout</button>
          } @else {
            <a routerLink="/auth/login" class="rounded-md bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Login</a>
          }
        </div>
      </nav>
    </header>
  `,
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/auth/login']),
      error: () => void this.router.navigate(['/auth/login']),
    });
  }
}
