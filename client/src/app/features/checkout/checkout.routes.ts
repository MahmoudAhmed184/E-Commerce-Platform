import type { Routes } from '@angular/router';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'review',
        pathMatch: 'full',
      },
      {
        path: 'review',
        loadComponent: () => import('./pages/review-page/review-page').then((m) => m.ReviewPage),
      },
      {
        path: 'delivery',
        loadComponent: () => import('./pages/delivery-page/delivery-page').then((m) => m.DeliveryPage),
      },
      {
        path: 'payment',
        loadComponent: () => import('./pages/payment-page/payment-page').then((m) => m.PaymentPage),
      },
    ],
  },
];
