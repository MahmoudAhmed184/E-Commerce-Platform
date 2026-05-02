import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('test_attaches_bearer_token_to_api_requests', () => {
    localStorage.setItem('access_token', 'access-token');

    client.get(`${environment.apiBaseUrl}/users/me/`).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/users/me/`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush({});
  });

  it('test_retries_with_refreshed_token_on_401', () => {
    localStorage.setItem('access_token', 'old-access-token');
    localStorage.setItem('refresh_token', 'refresh-token');

    client.get(`${environment.apiBaseUrl}/users/me/`).subscribe();

    const firstRequest = http.expectOne(`${environment.apiBaseUrl}/users/me/`);
    expect(firstRequest.request.headers.get('Authorization')).toBe('Bearer old-access-token');
    firstRequest.flush({ detail: 'Expired token.' }, { status: 401, statusText: 'Unauthorized' });

    const refreshRequest = http.expectOne(`${environment.apiBaseUrl}/auth/token/refresh/`);
    expect(refreshRequest.request.headers.has('Authorization')).toBe(false);
    refreshRequest.flush({
      access: 'new-access-token',
      refresh: 'new-refresh-token',
    });

    const retryRequest = http.expectOne(`${environment.apiBaseUrl}/users/me/`);
    expect(retryRequest.request.headers.get('Authorization')).toBe('Bearer new-access-token');
    retryRequest.flush({});

    expect(localStorage.getItem('access_token')).toBe('new-access-token');
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
  });

  it('test_redirects_to_login_if_refresh_fails', async () => {
    localStorage.setItem('access_token', 'old-access-token');
    localStorage.setItem('refresh_token', 'refresh-token');
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const authService = TestBed.inject(AuthService);
    authService.currentUser.set({
      id: 'ac3bb7f3-dc62-4883-a65d-38db9e297f5c',
      email: 'customer@example.com',
      phone: null,
      full_name: 'Customer User',
      role: 'customer',
      status: 'active',
    });

    const errorPromise = new Promise<unknown>((resolve) => {
      client.get(`${environment.apiBaseUrl}/users/me/`).subscribe({
        error: (error: unknown) => resolve(error),
      });
    });

    const firstRequest = http.expectOne(`${environment.apiBaseUrl}/users/me/`);
    firstRequest.flush({ detail: 'Expired token.' }, { status: 401, statusText: 'Unauthorized' });

    const refreshRequest = http.expectOne(`${environment.apiBaseUrl}/auth/token/refresh/`);
    refreshRequest.flush({ detail: 'Invalid refresh.' }, { status: 401, statusText: 'Unauthorized' });

    const logoutRequest = http.expectOne(`${environment.apiBaseUrl}/auth/logout/`);
    logoutRequest.flush({ message: 'Logged out.' });

    await errorPromise;

    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(authService.currentUser()).toBeNull();
  });
});
