import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../features/cart/services/cart.service';
import { CartService } from '../../features/cart/services/cart.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <!-- Brand -->
        <a routerLink="/" class="flex items-center gap-2 text-neutral-950 font-semibold tracking-tight text-sm">
          <span class="h-2 w-2 rounded-full bg-neutral-950"></span>
          EQUIPMENT &bull; CO
        </a>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <a routerLink="/products" routerLinkActive="text-neutral-950" class="text-sm font-medium text-neutral-600 hover:text-neutral-900">Products</a>
          <a routerLink="/cart" routerLinkActive="text-neutral-950" class="text-sm font-medium text-neutral-600 hover:text-neutral-900">Bag ({{ cartService.itemCount() }})</a>
          @if (authService.isLoggedIn()) {
            <button type="button" class="text-sm font-medium text-neutral-600 hover:text-neutral-900" (click)="logout()">Logout</button>
          } @else {
            <a routerLink="/auth/login" class="text-sm font-medium text-neutral-600 hover:text-neutral-900">Login</a>
          }
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/auth/login']),
      error: () => void this.router.navigate(['/auth/login']),
    });
  }
}
