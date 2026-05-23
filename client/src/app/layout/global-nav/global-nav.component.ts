import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideCircleUserRound,
  LucideLayoutDashboard,
  LucideLogIn,
  LucideLogOut,
  LucideMenu,
  LucideShoppingCart,
  LucideUserPlus,
} from '@lucide/angular';

import { AuthService } from '../../core/services/auth/auth.service';
import { CartService } from '../../core/services/cart/cart.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { DropdownMenuComponent } from '../../shared/components/dropdown-menu/dropdown-menu.component';
import { NavigationMenuComponent, type NavigationMenuLink } from '../../shared/components/navigation-menu/navigation-menu.component';
import { SearchBarComponent, type SearchSuggestion } from '../../shared/components/search-bar/search-bar.component';
import { SheetComponent } from '../../shared/components/sheet/sheet.component';
import type { UiMenuItem } from '../../shared/components/ui.types';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

interface NavLink {
  label: string;
  path: string;
  auth: 'all' | 'guest' | 'customer' | 'admin';
}

@Component({
  selector: 'app-global-nav',
  standalone: true,
  imports: [
    AvatarComponent,
    ButtonComponent,
    DropdownMenuComponent,
    LucideCircleUserRound,
    LucideLayoutDashboard,
    LucideLogIn,
    LucideLogOut,
    LucideMenu,
    LucideShoppingCart,
    LucideUserPlus,
    NavigationMenuComponent,
    RouterLink,
    RouterLinkActive,
    SearchBarComponent,
    SheetComponent,
    ThemeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="glass-panel glass-depth-floating sticky top-0 z-sticky border-b border-glass-border">
      <div class="border-b border-glass-border bg-glass-white-6">
        <div class="mx-auto flex max-w-[var(--ui-container-2xl)] flex-wrap items-center justify-between gap-xs px-gutter-xs py-2xs md:px-gutter-sm lg:px-gutter-lg">
          <div class="flex flex-wrap items-center gap-sm">
            <span class="type-label-sm text-text-secondary">Fast dispatch on available items</span>
            <span class="hidden text-text-muted md:inline" aria-hidden="true">•</span>
            <span class="type-label-sm text-text-secondary">Secure checkout</span>
            <span class="hidden text-text-muted md:inline" aria-hidden="true">•</span>
            <span class="hidden type-label-sm text-text-secondary md:inline">Order tracking available</span>
          </div>
          <span class="type-label-sm text-text-secondary">support@vendra.com</span>
        </div>
      </div>

      <div class="mx-auto flex max-w-[var(--ui-container-2xl)] flex-wrap items-center gap-md px-gutter-xs py-sm md:px-gutter-sm lg:px-gutter-lg">
        <a class="inline-flex min-h-12 shrink-0 items-center gap-xs rounded-sm focus-visible:focus-ring" routerLink="/" aria-label="Vendra home" (click)="closeMobileNav()">
          <img class="size-10 object-contain" src="logo-icon.png?v=20260522" alt="" width="1024" height="1024" />
          <span class="grid gap-3xs">
            <span class="type-label-sm text-text-muted">Everyday essentials</span>
            <span class="type-heading-sm text-card-foreground">Vendra</span>
          </span>
        </a>

        <app-navigation-menu [links]="visibleMenuLinks()" />

        <div class="hidden min-w-0 flex-1 lg:flex">
          <div class="ms-auto w-full max-w-[var(--ui-container-sm)]">
            <app-search-bar
              [query]="searchQuery()"
              [suggestions]="suggestions"
              scope="Product"
              placeholder="Search products"
              (queryChange)="searchQuery.set($event)"
              (submitted)="submitSearch($event)"
              (suggestionSelected)="selectSuggestion($event)"
              (cleared)="searchQuery.set('')"
            />
          </div>
        </div>

        <div class="ms-auto flex shrink-0 items-center justify-end gap-xs">
          <app-theme-toggle />

          <a
            class="glass-panel glass-depth-raised relative inline-flex min-h-control-md items-center gap-xs rounded-md px-sm type-label-md text-card-foreground interactive-transition hover:shadow-glass-floating focus-visible:focus-ring"
            routerLink="/cart"
            routerLinkActive="bg-glass-white-12 text-text-primary shadow-glass-raised"
            [attr.aria-label]="'Cart with ' + cartCount() + ' items'"
          >
            <svg lucideShoppingCart class="size-icon-sm" aria-hidden="true"></svg>
            <span class="hidden sm:inline">Cart</span>
            <span class="inline-flex min-w-icon-md justify-center rounded-full bg-glass-white-12 px-2xs type-label-sm text-text-primary">
              {{ cartCount() }}
            </span>
          </a>

          @if (authService.currentUser(); as user) {
            <div class="hidden items-center gap-sm md:flex">
              <app-dropdown-menu
                label="Account"
                trigger="avatar"
                [avatarName]="user.full_name || user.email"
                [items]="accountMenuItems()"
                (selected)="selectAccountAction($event)"
              />
            </div>
          } @else {
            <a class="hidden min-h-control-md items-center gap-xs rounded-md px-sm type-label-md text-muted-foreground interactive-transition hover:bg-glass-white-12 hover:text-card-foreground focus-visible:focus-ring md:inline-flex" routerLink="/auth/login">
              <svg lucideLogIn class="size-icon-sm" aria-hidden="true"></svg>
              Sign in
            </a>
            <a class="hidden min-h-control-md items-center gap-xs rounded-md border-hairline border-glass-border bg-[linear-gradient(135deg,var(--ui-color-iridescent-violet),var(--ui-color-iridescent-cyan),var(--ui-color-iridescent-emerald))] px-sm type-label-md text-text-on-primary shadow-glass-raised interactive-transition hover:shadow-glass-floating focus-visible:focus-ring md:inline-flex" routerLink="/auth/register">
              <svg lucideUserPlus class="size-icon-sm" aria-hidden="true"></svg>
              Create account
            </a>
          }

          <button
            class="glass-panel glass-depth-raised inline-flex size-control-md items-center justify-center rounded-md type-label-md text-card-foreground interactive-transition hover:shadow-glass-floating focus-visible:focus-ring lg:hidden"
            type="button"
            aria-label="Open navigation"
            aria-controls="mobile-global-navigation"
            [attr.aria-expanded]="mobileNavOpen()"
            (click)="mobileNavOpen.set(true)"
          >
            <svg lucideMenu class="size-icon-md" aria-hidden="true"></svg>
          </button>
        </div>
      </div>

      <div class="border-t border-glass-border px-gutter-xs py-xs md:px-gutter-sm lg:hidden">
          <app-search-bar
            [query]="searchQuery()"
            [suggestions]="suggestions"
            scope="Product"
            placeholder="Search products"
            (queryChange)="searchQuery.set($event)"
            (submitted)="submitSearch($event)"
            (suggestionSelected)="selectSuggestion($event)"
            (cleared)="searchQuery.set('')"
          />
      </div>
    </header>

      <app-sheet
        title="Navigation"
        description="Search products, review your cart, and manage your account."
      side="end"
      size="md"
      [open]="mobileNavOpen()"
      (closed)="closeMobileNav()"
      >
      <div id="mobile-global-navigation" class="grid gap-md">
        <div class="glass-panel glass-depth-raised rounded-md p-sm">
          <div class="inline-flex items-center gap-xs">
            <img class="size-10 object-contain" src="logo-icon.png?v=20260522" alt="" width="1024" height="1024" />
            <p class="type-label-sm text-text-muted">Vendra</p>
          </div>
          <p class="mt-2xs type-body-sm text-text-secondary">Shop reliable products with clear availability, secure checkout, and order tracking.</p>
        </div>

        <app-search-bar
          [query]="searchQuery()"
          [suggestions]="suggestions"
          scope="Product"
          placeholder="Search products"
          (queryChange)="searchQuery.set($event)"
          (submitted)="submitSearch($event)"
          (suggestionSelected)="selectSuggestion($event)"
          (cleared)="searchQuery.set('')"
        />

        <nav class="grid gap-2xs" aria-label="Mobile navigation">
          @for (link of visibleLinks(); track link.path) {
            <a
              class="min-h-control-md rounded-md px-sm py-xs type-label-md text-card-foreground interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring"
              [routerLink]="link.path"
              routerLinkActive="bg-glass-white-12 text-text-primary shadow-glass-flat"
              [routerLinkActiveOptions]="{ exact: link.path === '/' }"
              (click)="closeMobileNav()"
            >
              {{ link.label }}
            </a>
          }
        </nav>

        <div class="grid gap-xs border-t border-glass-border pt-md">
          @if (authService.currentUser(); as user) {
            <div class="flex items-center gap-sm">
              <app-avatar [name]="user.full_name || user.email" size="sm" />
              <div class="min-w-0">
                <p class="truncate type-label-md text-card-foreground">{{ user.full_name || user.email }}</p>
                <p class="type-body-sm text-muted-foreground">{{ user.role }}</p>
              </div>
            </div>
            <div class="grid gap-xs">
              <a class="glass-panel glass-depth-raised inline-flex min-h-control-md items-center justify-center gap-xs rounded-md px-sm py-xs text-center type-label-md text-card-foreground interactive-transition hover:shadow-glass-floating focus-visible:focus-ring" routerLink="/profile" (click)="closeMobileNav()">
                <svg lucideCircleUserRound class="size-icon-sm" aria-hidden="true"></svg>
                Profile
              </a>
              @if (user.role === 'admin') {
                <a class="glass-panel glass-depth-raised inline-flex min-h-control-md items-center justify-center gap-xs rounded-md px-sm py-xs text-center type-label-md text-card-foreground interactive-transition hover:shadow-glass-floating focus-visible:focus-ring" routerLink="/admin" (click)="closeMobileNav()">
                  <svg lucideLayoutDashboard class="size-icon-sm" aria-hidden="true"></svg>
                  Admin
                </a>
              }
              <app-button variant="secondary" size="sm" (pressed)="logout()">
                <svg lucideLogOut class="size-icon-sm" aria-hidden="true"></svg>
                Sign out
              </app-button>
            </div>
          } @else {
            <a class="glass-panel glass-depth-raised inline-flex min-h-control-md items-center justify-center gap-xs rounded-md px-sm py-xs text-center type-label-md text-card-foreground interactive-transition hover:shadow-glass-floating focus-visible:focus-ring" routerLink="/auth/login" (click)="closeMobileNav()">
              <svg lucideLogIn class="size-icon-sm" aria-hidden="true"></svg>
              Sign in
            </a>
            <a class="inline-flex min-h-control-md items-center justify-center gap-xs rounded-md border-hairline border-glass-border bg-[linear-gradient(135deg,var(--ui-color-iridescent-violet),var(--ui-color-iridescent-cyan),var(--ui-color-iridescent-emerald))] px-sm py-xs text-center type-label-md text-text-on-primary shadow-glass-raised interactive-transition hover:shadow-glass-floating focus-visible:focus-ring" routerLink="/auth/register" (click)="closeMobileNav()">
              <svg lucideUserPlus class="size-icon-sm" aria-hidden="true"></svg>
              Create account
            </a>
          }
        </div>
      </div>
    </app-sheet>
  `,
})
export class GlobalNavComponent {
  protected readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  protected readonly mobileNavOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly cartCount = computed(() => this.cartService.itemCount());
  protected readonly suggestions: readonly SearchSuggestion[] = [
    { id: 'all-products', label: 'All products', description: 'Search the full catalog', href: '/products' },
    { id: 'orders-help', label: 'Order support', description: 'Track orders and delivery status', href: '/orders' },
  ];
  protected readonly accountMenuItems = computed<readonly UiMenuItem[]>(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return [];
    }

    const items: UiMenuItem[] = [
      { id: 'profile', label: 'Profile', description: 'Manage contact and delivery details' },
      { id: 'orders', label: 'Orders', description: 'Track purchases and payment status' },
    ];

    if (user.role === 'admin') {
      items.push({ id: 'admin', label: 'Admin', description: 'Open the operations workspace' });
    }

    items.push({ id: 'sign-out', label: 'Sign out', destructive: true });
    return items;
  });

  private readonly navLinks: readonly NavLink[] = [
    { label: 'Home', path: '/', auth: 'all' },
    { label: 'Products', path: '/products', auth: 'all' },
    { label: 'Orders', path: '/orders', auth: 'customer' },
    { label: 'Account', path: '/profile', auth: 'customer' },
    { label: 'Admin', path: '/admin', auth: 'admin' },
  ];

  protected readonly visibleLinks = computed(() => {
    const user = this.authService.currentUser();
    return this.navLinks.filter((link) => {
      if (link.auth === 'all') {
        return true;
      }
      if (link.auth === 'guest') {
        return !user;
      }
      if (link.auth === 'admin') {
        return user?.role === 'admin';
      }
      return !!user;
    });
  });
  protected readonly visibleMenuLinks = computed<readonly NavigationMenuLink[]>(() =>
    this.visibleLinks().map((link) => ({
      label: link.label,
      path: link.path,
      exact: link.path === '/',
    })),
  );

  protected submitSearch(query: string): void {
    const trimmed = query.trim();
    this.closeMobileNav();
    void this.router.navigate(['/products'], trimmed ? { queryParams: { search: trimmed } } : {});
  }

  protected selectSuggestion(suggestion: SearchSuggestion): void {
    this.closeMobileNav();
    void this.router.navigateByUrl(suggestion.href ?? '/products');
  }

  protected logout(): void {
    this.closeMobileNav();
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/']),
      error: () => {
        this.authService.clearSession();
        void this.router.navigate(['/']);
      },
    });
  }

  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  protected selectAccountAction(action: UiMenuItem): void {
    if (action.id === 'profile') {
      void this.router.navigateByUrl('/profile');
      return;
    }
    if (action.id === 'orders') {
      void this.router.navigateByUrl('/orders');
      return;
    }
    if (action.id === 'admin') {
      void this.router.navigateByUrl('/admin');
      return;
    }
    this.logout();
  }
}
