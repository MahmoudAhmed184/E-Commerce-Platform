import { Routes } from '@angular/router';

import { guestGuard } from '../../core/guards/guest.guard';
import { ConfirmEmailPage } from './pages/confirm-email/confirm-email.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { ResetPasswordPage } from './pages/reset-password/reset-password.page';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'register',
    component: RegisterPage,
    canActivate: [guestGuard],
  },
  {
    path: 'login',
    component: LoginPage,
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordPage,
    canActivate: [guestGuard],
  },
  {
    path: 'reset-password/:uid/:token',
    component: ResetPasswordPage,
    canActivate: [guestGuard],
  },
  {
    path: 'confirm-email',
    component: ConfirmEmailPage,
  },
  {
    path: 'confirm-email/:token',
    component: ConfirmEmailPage,
  },
];
