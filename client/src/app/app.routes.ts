import type { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin/admin.guard';
import { authGuard } from './core/guards/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/products/pages/home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.routes').then((m) => m.PRODUCTS_ROUTES),
  },
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.routes').then((m) => m.CART_ROUTES),
  },
  {
    path: 'checkout',
    loadChildren: () => import('./features/checkout/checkout.routes').then((m) => m.CHECKOUT_ROUTES),
  },
  {
    path: 'orders',
    loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    canActivate: [authGuard, adminGuard],
    canActivateChild: [authGuard, adminGuard],
  },
  {
    path: 'reviews',
    loadChildren: () => import('./features/reviews/reviews.routes').then((m) => m.REVIEWS_ROUTES),
  },
  {
    path: 'error',
    loadComponent: () => import('./layout/server-error-page/server-error-page').then((m) => m.ServerErrorPage),
  },
  {
    path: '**',
    loadComponent: () => import('./layout/not-found-page/not-found-page').then((m) => m.NotFoundPage),
  },
];
