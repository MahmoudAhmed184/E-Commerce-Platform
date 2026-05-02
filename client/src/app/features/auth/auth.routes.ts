import { Routes } from '@angular/router';

import { AuthPlaceholderComponent } from './auth-placeholder.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthPlaceholderComponent,
  },
  {
    path: 'register',
    component: AuthPlaceholderComponent,
  },
  {
    path: 'login',
    component: AuthPlaceholderComponent,
  },
  {
    path: 'confirm-email',
    component: AuthPlaceholderComponent,
  },
];
