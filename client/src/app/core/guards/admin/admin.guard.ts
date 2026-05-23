import { inject } from '@angular/core';
import { type CanActivateFn, Router, type UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../../services/auth/auth.service';

export const adminGuard: CanActivateFn = (): ReturnType<CanActivateFn> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // UI guard only — backend must enforce permissions.
  const forbiddenRedirect = (): UrlTree =>
    router.createUrlTree(['/error'], {
      queryParams: {
        status: 403,
        reason: 'admin_required',
        primaryAction: 'return-home',
        secondaryAction: 'sign-in-as-admin',
      },
    });

  return authService.loadCurrentUser({ refreshOnUnauthorized: true }).pipe(
    map(() => (authService.isAdmin() ? true : forbiddenRedirect())),
    catchError(() => {
      authService.clearSession();
      return of(forbiddenRedirect());
    }),
  );
};
