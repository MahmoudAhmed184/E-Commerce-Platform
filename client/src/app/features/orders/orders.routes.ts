import type { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/orders-page/orders-page').then((m) => m.OrdersPage),
  },
  {
    path: ':orderNumber',
    loadComponent: () => import('./pages/order-confirmation/order-confirmation').then((m) => m.OrderConfirmationPage),
  },
  {
    path: ':orderNumber/confirmation',
    loadComponent: () => import('./pages/order-confirmation/order-confirmation').then((m) => m.OrderConfirmationPage),
  },
];
