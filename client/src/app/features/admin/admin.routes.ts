import type { Routes } from '@angular/router';

import { adminGuard } from '../../core/guards/admin/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboardPage),
    canActivateChild: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin-users/admin-users').then((m) => m.AdminUsersPage),
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/admin-orders/admin-orders').then((m) => m.AdminOrdersPage),
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/admin-products/admin-products').then((m) => m.AdminProductsPage),
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/admin-categories/admin-categories').then((m) => m.AdminCategoriesPage),
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/admin-payments/admin-payments').then((m) => m.AdminPaymentsPage),
      },
      {
        path: 'reviews',
        loadComponent: () => import('./pages/admin-reviews/admin-reviews').then((m) => m.AdminReviewsPage),
      },
    ],
  },
];
