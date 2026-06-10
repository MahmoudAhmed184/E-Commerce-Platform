import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { LoginPage } from './login.page';
import { AuthService } from '../../../../core/services/auth.service';

describe('LoginPage Redirect', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let http: HttpTestingController;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  it('redirects admins to /admin/dashboard by default', async () => {
    vi.spyOn(authService, 'isAdmin').mockReturnValue(true);
    
    component['form'].setValue({ identifier: 'admin@test.com', password: 'password' });
    component['submit']();

    const req = http.expectOne(`${environment.apiBaseUrl}/auth/login/`);
    req.flush({ access: 'a', refresh: 'r', user: { role: 'ADMIN' } });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('redirects customers to /products by default', async () => {
    vi.spyOn(authService, 'isAdmin').mockReturnValue(false);
    
    component['form'].setValue({ identifier: 'user@test.com', password: 'password' });
    component['submit']();

    const req = http.expectOne(`${environment.apiBaseUrl}/auth/login/`);
    req.flush({ access: 'a', refresh: 'r', user: { role: 'CUSTOMER' } });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/products');
  });
});
