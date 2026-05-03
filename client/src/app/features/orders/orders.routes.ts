import { Routes } from '@angular/router';

import { OrderConfirmationPage } from './pages/order-confirmation/order-confirmation';

export const ORDERS_ROUTES: Routes = [
  {
    path: ':orderNumber',
    component: OrderConfirmationPage,
  },
];
