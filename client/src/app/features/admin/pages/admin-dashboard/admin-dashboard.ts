import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdminShellComponent, type AdminShellLink } from '../../../../layout/admin-shell/admin-shell.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [AdminShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-admin-shell title="Admin Dashboard" [navLinks]="navLinks" />`,
})
export class AdminDashboardPage {
  protected readonly navLinks: readonly AdminShellLink[] = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/orders', label: 'Orders & Payments' },
    { path: '/admin/products', label: 'Products' },
    { path: '/admin/categories', label: 'Categories' },
    { path: '/admin/reviews', label: 'Reviews' },
  ];
}
