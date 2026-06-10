import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { OrderConfirmationPage } from './pages/order-confirmation/order-confirmation';
import { OrderHistoryPage } from './pages/order-history/order-history';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    component: OrderHistoryPage,
    canActivate: [authGuard],
  },
  {
    path: ':orderNumber',
    component: OrderConfirmationPage,
  },
];
