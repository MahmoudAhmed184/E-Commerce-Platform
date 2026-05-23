import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { environment } from '../../../../environments/environment';
import type { User } from '../../models/user/user.model';
import { AuthService } from '../../services/auth/auth.service';
import { SKIP_AUTH } from '../auth-http-context/auth-http-context';
import { authInterceptor } from './auth.interceptor';

const backendCustomer: User = {
  id: 'ac3bb7f3-dc62-4883-a65d-38db9e297f5c',
  email: 'customer@example.com',
  phone: null,
  full_name: 'Customer User',
  role: 'customer',
  status: 'active',
};

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let router: Router;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('sends API requests with cookies and no bearer token', () => {
    authenticateAs();

    client.get<unknown>(`${environment.apiBaseUrl}/users/me/`).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/users/me/`);
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('does not refresh requests that opt out of auth', async () => {
    authenticateAs();
    const errorPromise = new Promise<unknown>((resolve) => {
      client.get<unknown>(`${environment.apiBaseUrl}/products/`, { context: new HttpContext().set(SKIP_AUTH, true) }).subscribe({
        error: (error: unknown) => resolve(error),
      });
    });

    const request = http.expectOne(`${environment.apiBaseUrl}/products/`);
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ detail: 'Unauthorized.' }, { status: 401, statusText: 'Unauthorized' });

    await errorPromise;
  });

  it('retries the original API request after cookie-session refresh', () => {
    authenticateAs();

    client.get<unknown>(`${environment.apiBaseUrl}/users/me/`).subscribe();

    const firstRequest = http.expectOne(`${environment.apiBaseUrl}/users/me/`);
    expect(firstRequest.request.withCredentials).toBe(true);
    expect(firstRequest.request.headers.has('Authorization')).toBe(false);
    firstRequest.flush({ detail: 'Expired session.' }, { status: 401, statusText: 'Unauthorized' });

    const refreshRequest = http.expectOne(`${environment.apiBaseUrl}/auth/token/refresh/`);
    expect(refreshRequest.request.body).toEqual({});
    expect(refreshRequest.request.withCredentials).toBe(true);
    expect(refreshRequest.request.headers.has('Authorization')).toBe(false);
    refreshRequest.flush({});

    const retryRequest = http.expectOne(`${environment.apiBaseUrl}/users/me/`);
    expect(retryRequest.request.withCredentials).toBe(true);
    expect(retryRequest.request.headers.has('Authorization')).toBe(false);
    retryRequest.flush({});
  });

  it('clears session state and redirects when refresh fails', async () => {
    authenticateAs();
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const errorPromise = new Promise<unknown>((resolve) => {
      client.get<unknown>(`${environment.apiBaseUrl}/users/me/`).subscribe({
        error: (error: unknown) => resolve(error),
      });
    });

    const firstRequest = http.expectOne(`${environment.apiBaseUrl}/users/me/`);
    firstRequest.flush({ detail: 'Expired session.' }, { status: 401, statusText: 'Unauthorized' });

    const refreshRequest = http.expectOne(`${environment.apiBaseUrl}/auth/token/refresh/`);
    expect(refreshRequest.request.body).toEqual({});
    refreshRequest.flush({ detail: 'Invalid session.' }, { status: 401, statusText: 'Unauthorized' });

    const logoutRequest = http.expectOne(`${environment.apiBaseUrl}/auth/logout/`);
    expect(logoutRequest.request.body).toEqual({});
    expect(logoutRequest.request.headers.has('Authorization')).toBe(false);
    logoutRequest.flush({ message: 'Logged out.' });

    await errorPromise;

    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
    expect(authService.currentUser()).toBeNull();
    expect(authService.sessionModalOpen()).toBe(true);
    expect(authService.sessionError()).toBe('Your session expired. Sign in again to continue.');
  });

  function authenticateAs(user: User = backendCustomer): void {
    authService.login({ identifier: user.email, password: 'Password1' }).subscribe();

    const loginRequest = http.expectOne(`${environment.apiBaseUrl}/auth/login/`);
    loginRequest.flush({ user });
  }
});
