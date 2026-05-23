import type { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'confirm-email',
    loadComponent: () => import('./pages/confirm-email/confirm-email.page').then((m) => m.ConfirmEmailPage),
  },
  {
    path: 'confirm-pending',
    loadComponent: () => import('./pages/confirm-pending/confirm-pending.page').then((m) => m.ConfirmPendingPage),
  },
];
