import { Routes } from '@angular/router';

import { ConfirmEmailPage } from './pages/confirm-email/confirm-email.page';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'register',
    component: RegisterPage,
  },
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: 'confirm-email',
    component: ConfirmEmailPage,
  },
];
