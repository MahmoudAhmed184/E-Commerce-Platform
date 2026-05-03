import { Routes } from '@angular/router';

import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { AdminUsersPage } from './pages/admin-users/admin-users';
import { AdminOrdersPage } from './pages/admin-orders/admin-orders';
import { AdminReviewsPage } from './pages/admin-reviews/admin-reviews';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminDashboard,
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users',   component: AdminUsersPage },
      { path: 'orders',  component: AdminOrdersPage },
      { path: 'reviews', component: AdminReviewsPage },
    ],
  },
];
