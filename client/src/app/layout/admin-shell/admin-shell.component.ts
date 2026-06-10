import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideCreditCard,
  LucideExternalLink,
  LucideLayoutDashboard,
  LucideMenu,
  LucidePackage,
  LucideReceiptText,
  LucideShieldCheck,
  LucideStar,
  LucideTags,
  LucideUsersRound,
} from '@lucide/angular';

import { SheetComponent } from '../../shared/components/sheet/sheet.component';

export type AdminShellIcon = 'dashboard' | 'users' | 'orders' | 'payments' | 'products' | 'categories' | 'reviews';

export interface AdminShellLink {
  label: string;
  path: string | readonly unknown[];
  icon: AdminShellIcon;
  description?: string;
  exact?: boolean;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    LucideCreditCard,
    LucideExternalLink,
    LucideLayoutDashboard,
    LucideMenu,
    LucidePackage,
    LucideReceiptText,
    LucideShieldCheck,
    LucideStar,
    LucideTags,
    LucideUsersRound,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    SheetComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="admin-shell">
      <aside class="admin-sidebar" aria-label="Admin sidebar">
        <a class="admin-sidebar-brand focus-visible:focus-ring" routerLink="/admin" aria-label="Vendra admin home">
          <img class="size-10 object-contain" src="logo-icon.png?v=20260522" alt="" width="1024" height="1024" />
          <span class="grid leading-none">
            <span class="type-heading-sm text-text-primary">Vendra</span>
            <span class="type-label-sm text-text-muted">Admin console</span>
          </span>
        </a>

        <nav class="admin-nav-list" aria-label="Admin navigation">
          @for (link of navLinks(); track link.path) {
            <a
              class="admin-nav-link focus-visible:focus-ring"
              [routerLink]="link.path"
              routerLinkActive="admin-nav-link-active"
              ariaCurrentWhenActive="page"
              [routerLinkActiveOptions]="{ exact: link.exact ?? false }"
            >
              <span class="admin-nav-icon" aria-hidden="true">
                @switch (link.icon) {
                  @case ('dashboard') {
                    <svg lucideLayoutDashboard class="size-icon-sm"></svg>
                  }
                  @case ('users') {
                    <svg lucideUsersRound class="size-icon-sm"></svg>
                  }
                  @case ('orders') {
                    <svg lucideReceiptText class="size-icon-sm"></svg>
                  }
                  @case ('payments') {
                    <svg lucideCreditCard class="size-icon-sm"></svg>
                  }
                  @case ('products') {
                    <svg lucidePackage class="size-icon-sm"></svg>
                  }
                  @case ('categories') {
                    <svg lucideTags class="size-icon-sm"></svg>
                  }
                  @case ('reviews') {
                    <svg lucideStar class="size-icon-sm"></svg>
                  }
                }
              </span>
              <span class="grid min-w-0 gap-3xs">
                <span class="truncate type-label-md">{{ link.label }}</span>
                @if (link.description) {
                  <span class="truncate type-label-sm text-text-muted">{{ link.description }}</span>
                }
              </span>
            </a>
          }
        </nav>

        <div class="admin-sidebar-footer">
          <div class="flex items-start gap-sm">
            <span class="admin-stat-icon" data-tone="success" aria-hidden="true">
              <svg lucideShieldCheck class="size-icon-sm"></svg>
            </span>
            <div class="min-w-0">
              <p class="type-label-md text-text-primary">Protected workspace</p>
              <p class="type-body-sm text-text-secondary">Customer, catalog, order, and payment tools stay behind admin access.</p>
            </div>
          </div>
        </div>
      </aside>

      <div class="admin-main">
        <header class="admin-topbar">
          <div class="min-w-0">
            <p class="admin-kicker">Admin</p>
            <h1 class="truncate type-heading-md text-text-primary">{{ title() }}</h1>
          </div>

          <div class="flex shrink-0 items-center gap-xs">
            <a
              class="hidden min-h-touch-min items-center gap-xs rounded-md border-hairline border-border-default bg-surface-raised px-sm type-label-sm text-text-primary no-underline shadow-xs interactive-transition hover:bg-surface-subtle focus-visible:focus-ring md:inline-flex"
              routerLink="/products"
            >
              Storefront
              <svg lucideExternalLink class="size-icon-sm" aria-hidden="true"></svg>
            </a>
            <button
              class="inline-flex min-h-touch-min min-w-touch-min items-center justify-center rounded-md border-hairline border-border-default bg-surface-raised text-icon-default shadow-xs interactive-transition hover:bg-surface-subtle hover:text-text-primary focus-visible:focus-ring lg:hidden"
              type="button"
              aria-label="Open admin navigation"
              [attr.aria-expanded]="drawerOpen()"
              (click)="drawerOpen.set(true)"
            >
              <svg lucideMenu class="size-icon-md" aria-hidden="true"></svg>
            </button>
          </div>
        </header>

        <main class="admin-content">
          <ng-content />
          <router-outlet />
        </main>
      </div>
    </section>

    <app-sheet
      [title]="'Admin navigation'"
      description="Move between dashboard, catalog, order, and moderation tools."
      side="start"
      size="sm"
      [open]="drawerOpen()"
      (closed)="drawerOpen.set(false)"
    >
      <div class="mb-md inline-flex items-center gap-sm">
        <img class="size-10 object-contain" src="logo-icon.png?v=20260522" alt="" width="1024" height="1024" />
        <div>
          <p class="type-heading-sm text-card-foreground">{{ brandLabel() }}</p>
          <p class="type-label-sm text-text-muted">Operations console</p>
        </div>
      </div>

      <nav class="grid gap-xs" aria-label="Admin mobile navigation">
        @for (link of navLinks(); track link.path) {
          <a
            class="admin-nav-link focus-visible:focus-ring"
            [routerLink]="link.path"
            routerLinkActive="admin-nav-link-active"
            ariaCurrentWhenActive="page"
            [routerLinkActiveOptions]="{ exact: link.exact ?? false }"
            (click)="drawerOpen.set(false)"
          >
            <span class="admin-nav-icon" aria-hidden="true">
              @switch (link.icon) {
                @case ('dashboard') {
                  <svg lucideLayoutDashboard class="size-icon-sm"></svg>
                }
                @case ('users') {
                  <svg lucideUsersRound class="size-icon-sm"></svg>
                }
                @case ('orders') {
                  <svg lucideReceiptText class="size-icon-sm"></svg>
                }
                @case ('payments') {
                  <svg lucideCreditCard class="size-icon-sm"></svg>
                }
                @case ('products') {
                  <svg lucidePackage class="size-icon-sm"></svg>
                }
                @case ('categories') {
                  <svg lucideTags class="size-icon-sm"></svg>
                }
                @case ('reviews') {
                  <svg lucideStar class="size-icon-sm"></svg>
                }
              }
            </span>
            <span class="grid min-w-0 gap-3xs">
              <span class="type-label-md">{{ link.label }}</span>
              @if (link.description) {
                <span class="type-label-sm text-text-muted">{{ link.description }}</span>
              }
            </span>
          </a>
        }
      </nav>
    </app-sheet>
  `,
})
export class AdminShellComponent {
  readonly title = input('Dashboard');
  readonly brandLabel = input('Vendra Admin');
  readonly navLinks = input<readonly AdminShellLink[]>([
    { label: 'Dashboard', path: '/admin', icon: 'dashboard', description: 'Operational overview', exact: true },
    { label: 'Users', path: '/admin/users', icon: 'users', description: 'Accounts and access' },
    { label: 'Orders', path: '/admin/orders', icon: 'orders', description: 'Fulfillment queue' },
    { label: 'Payments', path: '/admin/payments', icon: 'payments', description: 'Transaction records' },
    { label: 'Products', path: '/admin/products', icon: 'products', description: 'Catalog editing' },
    { label: 'Categories', path: '/admin/categories', icon: 'categories', description: 'Browse taxonomy' },
    { label: 'Reviews', path: '/admin/reviews', icon: 'reviews', description: 'Moderation' },
  ]);

  protected readonly drawerOpen = signal(false);
}
