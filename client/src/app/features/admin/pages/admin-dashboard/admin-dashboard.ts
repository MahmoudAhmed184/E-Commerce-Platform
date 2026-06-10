import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdminShellComponent, type AdminShellLink } from '../../../../layout/admin-shell/admin-shell.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [AdminShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-admin-shell [title]="'Admin Dashboard'" [navLinks]="navLinks" />`,
})
export class AdminDashboardPage {
  protected readonly navLinks: readonly AdminShellLink[] = [
    { path: '/admin', label: 'Dashboard', icon: 'dashboard', description: 'Operational overview', exact: true },
    { path: '/admin/users', label: 'Users', icon: 'users', description: 'Accounts and access' },
    { path: '/admin/orders', label: 'Orders', icon: 'orders', description: 'Fulfillment queue' },
    { path: '/admin/payments', label: 'Payments', icon: 'payments', description: 'Transaction records' },
    { path: '/admin/products', label: 'Products', icon: 'products', description: 'Catalog editing' },
    { path: '/admin/categories', label: 'Categories', icon: 'categories', description: 'Browse taxonomy' },
    { path: '/admin/reviews', label: 'Reviews', icon: 'reviews', description: 'Moderation' },
  ];
}
