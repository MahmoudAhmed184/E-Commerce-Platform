import { NgOptimizedImage } from '@angular/common';
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
import {
  NavigationMenuComponent,
  type NavigationMenuLink,
} from '../../shared/components/navigation-menu/navigation-menu.component';
import {
  SearchBarComponent,
  type SearchSuggestion,
} from '../../shared/components/search-bar/search-bar.component';
import { SheetComponent } from '../../shared/components/sheet/sheet.component';
import type { UiMenuItem } from '../../shared/components/ui.types';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

interface NavLink {
  label: string;
  path: string;
  auth: 'all' | 'guest' | 'customer' | 'admin';
}

const catalogSearchSuggestionId = 'catalog-search-query';

@Component({
  selector: 'app-global-nav',
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
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive,
    SearchBarComponent,
    SheetComponent,
    ThemeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="sticky top-0 z-sticky border-b border-border-default bg-surface-raised shadow-xs"
    >
      <div
        class="mx-auto grid min-h-[4.75rem] max-w-[var(--ui-container-2xl)] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-sm px-gutter-xs md:px-gutter-sm lg:gap-lg lg:px-gutter-lg"
      >
        <a
          class="group inline-flex min-h-touch-min shrink-0 items-center gap-xs rounded-md no-underline focus-visible:focus-ring"
          routerLink="/"
          aria-label="Vendra home"
          (click)="closeMobileNav()"
        >
          <span
            class="inline-flex size-11 items-center justify-center rounded-md border-hairline border-border-default bg-surface-subtle shadow-xs interactive-transition group-hover:bg-surface-primary-subtle"
          >
            <img
              class="size-8 object-contain"
              ngSrc="logo-icon.png?v=20260522"
              alt=""
              width="1024"
              height="1024"
              aria-hidden="true"
              priority
            />
          </span>
          <span class="hidden leading-none sm:grid">
            <span class="type-label-lg text-text-primary">Vendra</span>
            <span class="type-label-sm text-text-muted">Everyday essentials</span>
          </span>
        </a>

        <div class="hidden min-w-0 items-center gap-lg xl:flex">
          <app-navigation-menu [links]="visibleMenuLinks()" />

          <div class="min-w-[20rem] max-w-[34rem] flex-1">
            <app-search-bar
              [query]="searchQuery()"
              [suggestions]="searchSuggestions()"
              scope="Catalog"
              placeholder="Search catalog"
              (queryChange)="searchQuery.set($event)"
              (submitted)="submitSearch($event)"
              (suggestionSelected)="selectSuggestion($event)"
              (cleared)="searchQuery.set('')"
            />
          </div>
        </div>

        <div class="ms-auto flex shrink-0 items-center justify-end gap-1">
          <app-theme-toggle />

          <a
            class="relative inline-flex min-h-touch-min min-w-touch-min items-center justify-center rounded-md text-icon-default no-underline interactive-transition hover:bg-surface-subtle hover:text-text-primary focus-visible:focus-ring"
            routerLink="/cart"
            routerLinkActive="bg-surface-subtle text-text-primary"
            [attr.aria-label]="'Cart with ' + cartCount() + ' items'"
          >
            <svg lucideShoppingCart class="h-4 w-4" aria-hidden="true"></svg>
            <span
              class="absolute right-1 top-1 inline-flex min-w-4 justify-center rounded-full bg-surface-primary px-1 font-mono text-[0.625rem] leading-4 text-text-on-primary shadow-xs"
            >
              {{ cartCount() }}
            </span>
          </a>

          @if (authService.currentUser(); as user) {
            <div class="hidden items-center gap-2 md:flex">
              <app-dropdown-menu
                label="Account"
                trigger="avatar"
                [avatarName]="user.full_name || user.email"
                [items]="accountMenuItems()"
                (selected)="selectAccountAction($event)"
              />
            </div>
          } @else {
            <span class="hidden md:inline-flex">
              <app-button variant="ghost" [routerLink]="'/auth/login'">
                <svg lucideLogIn class="h-4 w-4" aria-hidden="true"></svg>
                Sign in
              </app-button>
            </span>
            <span class="hidden md:inline-flex">
              <app-button [routerLink]="'/auth/register'">
                <svg lucideUserPlus class="h-4 w-4" aria-hidden="true"></svg>
                Create account
              </app-button>
            </span>
          }

          <button
            class="inline-flex min-h-touch-min min-w-touch-min items-center justify-center rounded-md text-icon-default interactive-transition hover:bg-surface-subtle hover:text-text-primary focus-visible:focus-ring xl:hidden"
            type="button"
            aria-label="Open navigation"
            aria-controls="mobile-global-navigation"
            [attr.aria-expanded]="mobileNavOpen()"
            (click)="mobileNavOpen.set(true)"
          >
            <svg lucideMenu class="h-5 w-5" aria-hidden="true"></svg>
          </button>
        </div>
      </div>

      <div class="border-t border-border-default px-gutter-xs py-2 md:px-gutter-sm xl:hidden">
        <app-search-bar
          [query]="searchQuery()"
          [suggestions]="searchSuggestions()"
          scope="Catalog"
          placeholder="Search catalog"
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
      <div id="mobile-global-navigation" class="grid gap-5">
        <div class="rounded-md border-hairline border-border-default bg-surface-subtle p-md">
          <div class="inline-flex items-center gap-2">
            <img
              class="size-11 object-contain"
              ngSrc="logo-icon.png?v=20260522"
              alt=""
              width="1024"
              height="1024"
              aria-hidden="true"
            />
            <div>
              <p class="type-label-md text-text-primary">Vendra</p>
              <p class="type-label-sm text-text-muted">Everyday essentials</p>
            </div>
          </div>
          <p class="mt-sm type-body-sm text-text-secondary">
            Shop reliable products with clear availability, secure checkout, and order tracking.
          </p>
        </div>

        <app-search-bar
          [query]="searchQuery()"
          [suggestions]="searchSuggestions()"
          scope="Catalog"
          placeholder="Search catalog"
          (queryChange)="searchQuery.set($event)"
          (submitted)="submitSearch($event)"
          (suggestionSelected)="selectSuggestion($event)"
          (cleared)="searchQuery.set('')"
        />

        <nav class="grid gap-1" aria-label="Mobile navigation">
          @for (link of visibleLinks(); track link.path) {
            <a
              class="min-h-touch-min rounded-md px-sm py-xs type-label-md text-text-secondary no-underline interactive-transition hover:bg-surface-subtle hover:text-text-primary focus-visible:focus-ring"
              [routerLink]="link.path"
              routerLinkActive="!text-text-primary bg-surface-subtle font-semibold"
              [routerLinkActiveOptions]="{ exact: link.path === '/' }"
              (click)="closeMobileNav()"
            >
              {{ link.label }}
            </a>
          }
        </nav>

        <div class="grid gap-3 border-t border-border-default pt-5">
          @if (authService.currentUser(); as user) {
            <div class="flex items-center gap-3">
              <app-avatar [name]="user.full_name || user.email" size="sm" />
              <div class="min-w-0">
                <p class="truncate type-label-md text-text-primary">
                  {{ user.full_name || user.email }}
                </p>
                <p class="type-label-sm text-text-muted">{{ user.role }}</p>
              </div>
            </div>
            <div class="grid gap-2">
              <app-button
                variant="secondary"
                [routerLink]="'/profile'"
                [fullWidth]="true"
                (pressed)="closeMobileNav()"
              >
                <svg lucideCircleUserRound class="h-4 w-4" aria-hidden="true"></svg>
                Profile
              </app-button>
              @if (user.role === 'admin') {
                <app-button
                  variant="secondary"
                  [routerLink]="'/admin'"
                  [fullWidth]="true"
                  (pressed)="closeMobileNav()"
                >
                  <svg lucideLayoutDashboard class="h-4 w-4" aria-hidden="true"></svg>
                  Admin
                </app-button>
              }
              <app-button variant="secondary" (pressed)="logout()" [fullWidth]="true">
                <svg lucideLogOut class="h-4 w-4" aria-hidden="true"></svg>
                Sign out
              </app-button>
            </div>
          } @else {
            <app-button
              variant="ghost"
              [routerLink]="'/auth/login'"
              [fullWidth]="true"
              (pressed)="closeMobileNav()"
            >
              <svg lucideLogIn class="h-4 w-4" aria-hidden="true"></svg>
              Sign in
            </app-button>
            <app-button
              [routerLink]="'/auth/register'"
              [fullWidth]="true"
              (pressed)="closeMobileNav()"
            >
              <svg lucideUserPlus class="h-4 w-4" aria-hidden="true"></svg>
              Create account
            </app-button>
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
  private readonly defaultSearchSuggestions: readonly SearchSuggestion[] = [
    {
      id: 'all-products',
      label: 'All products',
      description: 'Search the full catalog',
      href: '/products',
    },
    {
      id: 'orders-help',
      label: 'Order support',
      description: 'Track orders and delivery status',
      href: '/orders',
    },
  ];
  protected readonly searchSuggestions = computed<readonly SearchSuggestion[]>(() => {
    const query = this.searchQuery().trim();
    if (!query) {
      return this.defaultSearchSuggestions;
    }

    return [
      {
        id: catalogSearchSuggestionId,
        label: `Search "${query}"`,
        description: 'Show matching products',
      },
      {
        id: 'all-products',
        label: 'All products',
        description: 'Browse the full catalog',
        href: '/products',
      },
    ];
  });
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
    if (suggestion.id === catalogSearchSuggestionId) {
      const trimmed = this.searchQuery().trim();
      void this.router.navigate(['/products'], trimmed ? { queryParams: { search: trimmed } } : {});
      return;
    }

    if (suggestion.id === 'all-products') {
      this.searchQuery.set('');
    }

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
