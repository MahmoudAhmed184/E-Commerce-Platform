import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import type { AppError } from './error.interceptor';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    http.verify();
  });

  it('preserves blocked-account code and account status', async () => {
    const errorPromise = new Promise<AppError>((resolve) => {
      client.post(`${environment.apiBaseUrl}/auth/login/`, {}).subscribe({
        error: (error: AppError) => resolve(error),
      });
    });

    const request = http.expectOne(`${environment.apiBaseUrl}/auth/login/`);
    request.flush(
      {
        detail: 'Your account has been restricted. Contact support.',
        code: 'account_restricted',
        account_status: 'restricted',
      },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(errorPromise).resolves.toEqual({
      status: 403,
      message: 'Your account has been restricted. Contact support.',
      code: 'account_restricted',
      accountStatus: 'restricted',
    });
  });
});
