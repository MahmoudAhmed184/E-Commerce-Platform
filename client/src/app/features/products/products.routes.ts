import { Routes } from '@angular/router';

import { ProductDetailPage } from './pages/product-detail/product-detail';
import { ProductListPage } from './pages/product-list/product-list';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    component: ProductListPage,
  },
  {
    path: ':slug',
    component: ProductDetailPage,
  },
];
