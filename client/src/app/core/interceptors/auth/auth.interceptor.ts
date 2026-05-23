import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, switchMap, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../services/auth/auth.service';
import { SKIP_AUTH, SKIP_REFRESH } from '../auth-http-context/auth-http-context';

export const authInterceptor: HttpInterceptorFn = (request, next): ReturnType<HttpInterceptorFn> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isApiRequest = request.url.startsWith(environment.apiBaseUrl);
  const skipsAuth = request.context.get(SKIP_AUTH);
  const skipsRefresh = request.context.get(SKIP_REFRESH);
  const buildRequest = () => {
    return isApiRequest && !request.withCredentials ? request.clone({ withCredentials: true }) : request;
  };

  return next(buildRequest()).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !isApiRequest || skipsAuth || skipsRefresh) {
        return throwError(() => error);
      }

      return authService.refreshSession().pipe(
        switchMap(() => next(buildRequest())),
        catchError((refreshError: unknown) =>
          authService.logout().pipe(
            catchError(() => {
              authService.clearSession();
              return of(undefined);
            }),
            switchMap(() => {
              authService.markSessionExpired('Your session expired. Sign in again to continue.');
              return router.navigate(['/auth/login']);
            }),
            switchMap(() => throwError(() => refreshError)),
          ),
        ),
      );
    }),
  );
};
