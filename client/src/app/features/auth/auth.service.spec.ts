import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

const backendCustomer = {
  id: '4ad7ca43-12ac-4a41-b0aa-62a50e2d71d0',
  email: 'customer@example.com',
  phone: '201000000000',
  full_name: 'Customer User',
  role: 'customer',
  status: 'active',
} as const;

const adminUser: User = {
  id: 'ab4d1be9-62aa-4a91-9330-a625ad36b40a',
  email: 'admin@example.com',
  phone: null,
  full_name: 'Admin User',
  role: 'admin',
  status: 'active',
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('test_register_calls_post_auth_register', () => {
    let completed = false;

    service
      .register({
        email: 'new@example.com',
        phone: '201111111111',
        password: 'Password1',
        full_name: 'New Customer',
      })
      .subscribe(() => {
        completed = true;
      });

    const request = http.expectOne(`${environment.apiBaseUrl}/auth/register/`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'new@example.com',
      phone: '201111111111',
      password: 'Password1',
      full_name: 'New Customer',
    });

    request.flush({ message: 'Confirmation email sent.' }, { status: 201, statusText: 'Created' });
    expect(completed).toBe(true);
  });

  it('test_login_stores_tokens_in_localStorage', () => {
    service.login({ identifier: 'customer@example.com', password: 'Password1' }).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/auth/login/`);
    request.flush({
      access: 'access-token',
      refresh: 'refresh-token',
      user: backendCustomer,
    });

    expect(localStorage.getItem('access_token')).toBe('access-token');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
  });

  it('test_login_sets_currentUser_signal', () => {
    service.login({ identifier: 'customer@example.com', password: 'Password1' }).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/auth/login/`);
    request.flush({
      access: 'access-token',
      refresh: 'refresh-token',
      user: backendCustomer,
    });

    expect(service.currentUser()).toEqual({
      id: backendCustomer.id,
      email: backendCustomer.email,
      phone: backendCustomer.phone,
      full_name: backendCustomer.full_name,
      role: 'customer',
      status: 'active',
    });
  });

  it('test_logout_clears_localStorage_and_resets_signal', () => {
    localStorage.setItem('access_token', 'access-token');
    localStorage.setItem('refresh_token', 'refresh-token');
    service.currentUser.set(adminUser);

    service.logout().subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/auth/logout/`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ refresh: 'refresh-token' });
    request.flush({ message: 'Logged out.' });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('test_loadCurrentUser_sets_signal_on_success', () => {
    localStorage.setItem('access_token', 'access-token');

    service.loadCurrentUser().subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/users/me/`);
    expect(request.request.method).toBe('GET');
    request.flush(backendCustomer);

    expect(service.currentUser()?.email).toBe('customer@example.com');
    expect(service.currentUser()?.role).toBe('customer');
  });

  it('test_isLoggedIn_computed_reflects_currentUser', () => {
    expect(service.isLoggedIn()).toBe(false);

    service.currentUser.set(adminUser);

    expect(service.isLoggedIn()).toBe(true);
  });

  it('test_isAdmin_computed_returns_true_for_admin_role', () => {
    service.currentUser.set(adminUser);

    expect(service.isAdmin()).toBe(true);
  });
});
