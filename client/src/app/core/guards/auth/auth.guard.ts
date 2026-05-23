import { inject } from '@angular/core';
import { type CanActivateFn, Router, type UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../../services/auth/auth.service';

export const authGuard: CanActivateFn = (_route, state): ReturnType<CanActivateFn> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // UI guard only — backend must enforce permissions.
  const loginRedirect = (): UrlTree =>
    router.createUrlTree(['/auth/login'], {
      queryParams: {
        returnUrl: state.url,
      },
    });

  return authService.loadCurrentUser({ refreshOnUnauthorized: true }).pipe(
    map(() => (authService.isLoggedIn() ? true : loginRedirect())),
    catchError(() => {
      authService.clearSession();
      return of(loginRedirect());
    }),
  );
};
