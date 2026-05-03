import { Routes } from '@angular/router';

import { ReviewsPage } from './pages/reviews-page/reviews-page';

export const REVIEWS_ROUTES: Routes = [
  {
    path: ':slug',
    component: ReviewsPage,
  },
];
