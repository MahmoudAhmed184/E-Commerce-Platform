import { TestBed } from '@angular/core/testing';
import { firstValueFrom, type Observable, of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth/auth.service';
import { AuthFlowService, loginErrorMessage } from './auth-flow.service';

class AuthServiceStub {
  readonly loginPayloads: unknown[] = [];
  readonly registerPayloads: unknown[] = [];
  readonly confirmationTokens: string[] = [];

  login(payload: unknown): Observable<void> {
    this.loginPayloads.push(payload);
    return of(undefined);
  }

  register(payload: unknown): Observable<void> {
    this.registerPayloads.push(payload);
    return of(undefined);
  }

  confirmEmail(token: string): Observable<void> {
    this.confirmationTokens.push(token);
    return of(undefined);
  }
}

describe('AuthFlowService', () => {
  let authService: AuthServiceStub;
  let service: AuthFlowService;

  beforeEach(() => {
    authService = new AuthServiceStub();

    TestBed.configureTestingModule({
      providers: [AuthFlowService, { provide: AuthService, useValue: authService }],
    });

    service = TestBed.inject(AuthFlowService);
  });

  it('delegates login payloads to AuthService', async () => {
    await firstValueFrom(service.login({ identifier: 'buyer@example.com', password: 'secret' }));

    expect(authService.loginPayloads).toEqual([{ identifier: 'buyer@example.com', password: 'secret' }]);
  });

  it('normalizes credential failures without exposing backend wording', () => {
    const message = loginErrorMessage({
      status: 401,
      message: 'No active account found with the given credentials',
      fieldErrors: { non_field_errors: ['No active account found with the given credentials'] },
    });

    expect(message).toBe('Invalid credentials.');
  });
});
