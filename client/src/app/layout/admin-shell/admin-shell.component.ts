import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ButtonComponent } from '../../shared/components/button/button.component';
import { SheetComponent } from '../../shared/components/sheet/sheet.component';
import { SidebarComponent, type SidebarLink } from '../../shared/components/sidebar/sidebar.component';

export type AdminShellLink = SidebarLink;

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [ButtonComponent, RouterLink, RouterLinkActive, RouterOutlet, SheetComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-screen bg-transparent text-foreground lg:grid lg:grid-cols-[var(--ui-layout-admin-shell-grid)]">
      <app-sidebar
        [brandLabel]="brandLabel()"
        homeLink="/admin"
        [links]="navLinks()"
        ariaLabel="Admin sidebar"
        navLabel="Admin navigation"
      />

      <div class="min-w-0">
        <header class="glass-panel glass-depth-floating sticky top-0 z-sticky flex items-center justify-between gap-sm border-b border-glass-border px-gutter-xs py-sm md:px-gutter-sm lg:px-gutter-lg">
          <div class="min-w-0">
            <p class="type-label-sm text-muted-foreground">Admin</p>
            <h1 class="truncate type-heading-md text-card-foreground">{{ title() }}</h1>
          </div>
          <app-button class="lg:hidden" variant="secondary" size="sm" (pressed)="drawerOpen.set(true)">Menu</app-button>
        </header>

        <main class="min-w-0 px-gutter-xs py-lg md:px-gutter-sm lg:px-gutter-lg">
          <ng-content />
          <router-outlet />
        </main>
      </div>
    </section>

    <app-sheet
      title="Admin navigation"
      description="Move between dashboard, catalog, order, and moderation tools."
      side="start"
      size="sm"
      [open]="drawerOpen()"
      (closed)="drawerOpen.set(false)"
    >
      <div class="mb-md inline-flex items-center gap-xs">
        <img class="size-9 object-contain" src="logo-icon.png?v=20260522" alt="" width="1024" height="1024" />
        <p class="type-heading-sm text-card-foreground">{{ brandLabel() }}</p>
      </div>

      <nav class="grid gap-2xs" aria-label="Admin mobile navigation">
        @for (link of navLinks(); track link.path) {
          <a
            class="min-h-control-md rounded-md px-sm py-xs type-label-md text-card-foreground interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring"
            [routerLink]="link.path"
            routerLinkActive="bg-glass-white-12 text-text-primary shadow-glass-flat"
            (click)="drawerOpen.set(false)"
          >
            {{ link.label }}
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
    { label: 'Dashboard', path: '/admin' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Products', path: '/admin/products' },
    { label: 'Categories', path: '/admin/categories' },
    { label: 'Orders & Payments', path: '/admin/orders' },
    { label: 'Reviews', path: '/admin/reviews' },
  ]);

  protected readonly drawerOpen = signal(false);
}
