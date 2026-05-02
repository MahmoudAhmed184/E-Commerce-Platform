import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, of, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { SKIP_AUTH, SKIP_REFRESH } from './auth-http-context';

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isApiRequest = request.url.startsWith(environment.apiBaseUrl);
  const skipsAuth = request.context.get(SKIP_AUTH);
  const skipsRefresh = request.context.get(SKIP_REFRESH);
  const accessToken = authService.getAccessToken();
  const authorizedRequest = isApiRequest && !skipsAuth && accessToken ? withBearerToken(request, accessToken) : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !isApiRequest || skipsAuth || skipsRefresh) {
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap((newAccessToken) => next(withBearerToken(request, newAccessToken))),
        catchError((refreshError: unknown) =>
          authService.logout().pipe(
            catchError(() => of(undefined)),
            switchMap(() => from(router.navigate(['/auth/login']))),
            switchMap(() => throwError(() => refreshError)),
          ),
        ),
      );
    }),
  );
};

function withBearerToken<T>(request: HttpRequest<T>, token: string): HttpRequest<T> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}
