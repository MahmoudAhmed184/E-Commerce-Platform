import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import type { User } from '../../models/user/user.model';
import { AuthService } from './auth.service';

const backendCustomer = {
  id: '4ad7ca43-12ac-4a41-b0aa-62a50e2d71d0',
  email: 'customer@example.com',
  phone: '201000000000',
  full_name: 'Customer User',
  role: 'customer',
  status: 'active',
  is_email_confirmed: true,
} as const;

const adminUser: User = {
  id: 'ab4d1be9-62aa-4a91-9330-a625ad36b40a',
  email: 'admin@example.com',
  phone: null,
  full_name: 'Admin User',
  role: 'admin',
  status: 'active',
  is_email_confirmed: true,
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
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

  it('test_login_does_not_store_bearer_tokens_in_frontend_state', () => {
    service.login({ identifier: 'customer@example.com', password: 'Password1' }).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/auth/login/`);
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      user: backendCustomer,
    });

    expect(service.currentUser()?.email).toBe('customer@example.com');
    expect('getAccessToken' in service).toBe(false);
    expect('getRefreshToken' in service).toBe(false);
  });

  it('test_login_sets_currentUser_signal', () => {
    service.login({ identifier: 'customer@example.com', password: 'Password1' }).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/auth/login/`);
    request.flush({
      user: backendCustomer,
    });

    expect(service.currentUser()).toEqual({
      id: backendCustomer.id,
      email: backendCustomer.email,
      phone: backendCustomer.phone,
      full_name: backendCustomer.full_name,
      role: 'customer',
      status: 'active',
      is_email_confirmed: true,
    });
  });

  it('test_logout_clears_session_and_resets_signal', () => {
    authenticateAs(adminUser);

    service.logout().subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/auth/logout/`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    expect(request.request.withCredentials).toBe(true);
    request.flush({ message: 'Logged out.' });

    expect(service.currentUser()).toBeNull();
  });

  it('test_loadCurrentUser_sets_signal_on_success', () => {
    authenticateAs();

    service.loadCurrentUser().subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/users/me/`);
    expect(request.request.method).toBe('GET');
    request.flush(backendCustomer);

    expect(service.currentUser()?.email).toBe('customer@example.com');
    expect(service.currentUser()?.role).toBe('customer');
    expect(service.currentUser()?.is_email_confirmed).toBe(true);
  });

  it('test_updateProfile_updates_currentUser_signal', () => {
    authenticateAs();

    service.updateProfile({ full_name: 'Updated Customer', phone: '201999999999' }).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/users/me/`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      full_name: 'Updated Customer',
      phone: '201999999999',
    });
    request.flush({
      ...backendCustomer,
      full_name: 'Updated Customer',
      phone: '201999999999',
    });

    expect(service.currentUser()).toEqual({
      id: backendCustomer.id,
      email: backendCustomer.email,
      phone: '201999999999',
      full_name: 'Updated Customer',
      role: 'customer',
      status: 'active',
      is_email_confirmed: true,
    });
  });

  it('test_isLoggedIn_computed_reflects_currentUser', () => {
    expect(service.isLoggedIn()).toBe(false);

    authenticateAs(adminUser);

    expect(service.isLoggedIn()).toBe(true);
  });

  it('test_isAdmin_computed_returns_true_for_admin_role', () => {
    authenticateAs(adminUser);

    expect(service.isAdmin()).toBe(true);
  });

  function authenticateAs(user: User = backendCustomer): void {
    service.login({ identifier: user.email, password: 'Password1' }).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/auth/login/`);
    request.flush({
      user,
    });
  }
});
