import type { Routes } from '@angular/router';

export const REVIEWS_ROUTES: Routes = [
  {
    path: ':slug',
    loadComponent: () => import('./pages/reviews-page/reviews-page').then((m) => m.ReviewsPage),
  },
];
