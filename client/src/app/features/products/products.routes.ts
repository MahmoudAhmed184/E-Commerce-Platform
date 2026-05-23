import type { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/product-listing-page/product-listing-page').then((m) => m.ProductListingPage),
  },
  {
    path: ':slug',
    loadComponent: () => import('./pages/product-detail-page/product-detail-page').then((m) => m.ProductDetailPage),
  },
];
