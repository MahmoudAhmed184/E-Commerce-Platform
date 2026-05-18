import { Routes } from '@angular/router';

import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard';
import { AdminOverviewPage } from './pages/admin-overview/admin-overview';
import { AdminUsersPage } from './pages/admin-users/admin-users';
import { AdminOrdersPage } from './pages/admin-orders/admin-orders';
import { AdminReviewsPage } from './pages/admin-reviews/admin-reviews';
import { AdminProductsPage } from './pages/admin-products/admin-products';
import { AdminCategoriesPage } from './pages/admin-categories/admin-categories';
import { AdminPaymentsPage } from './pages/admin-payments/admin-payments';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminDashboardPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview',   component: AdminOverviewPage },
      { path: 'users',      component: AdminUsersPage },
      { path: 'orders',     component: AdminOrdersPage },
      { path: 'products',   component: AdminProductsPage },
      { path: 'categories', component: AdminCategoriesPage },
      { path: 'payments',   component: AdminPaymentsPage },
      { path: 'reviews',    component: AdminReviewsPage },
    ],
  },
];
