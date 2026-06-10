import { Routes } from '@angular/router';

import { OrderConfirmationPage } from './pages/order-confirmation/order-confirmation';
import { OrdersListPage } from './pages/orders-list/orders-list';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    component: OrdersListPage,
  },
  {
    path: ':orderNumber',
    component: OrderConfirmationPage,
  },
];
