import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import type { GuardResult } from '@angular/router';
import { firstValueFrom, isObservable, type Observable, of } from 'rxjs';

import { AuthService } from '../../services/auth/auth.service';
import { adminGuard } from './admin.guard';

class AuthServiceStub {
  private readonly adminState = signal(false);
  readonly isAdmin = this.adminState.asReadonly();
  clearSessionCalled = false;

  setAdmin(admin: boolean): void {
    this.adminState.set(admin);
  }

  loadCurrentUser(): Observable<void> {
    return of(undefined);
  }

  clearSession(): void {
    this.clearSessionCalled = true;
    this.adminState.set(false);
  }
}

describe('adminGuard', () => {
  let authService: AuthServiceStub;
  let router: Router;

  beforeEach(() => {
    authService = new AuthServiceStub();

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authService }, provideRouter([])],
    });

    router = TestBed.inject(Router);
  });

  it('allows admin users after backend session verification', async () => {
    authService.setAdmin(true);

    const result = await runGuard();

    expect(result).toBe(true);
  });

  it('routes non-admin users to the authorization error page after backend session verification', async () => {
    authService.setAdmin(false);

    const result = expectUrlTree(await runGuard());

    expect(router.serializeUrl(result)).toBe(
      '/error?status=403&reason=admin_required&primaryAction=return-home&secondaryAction=sign-in-as-admin',
    );
  });

  function runGuard(): Promise<GuardResult> {
    const state = router.routerState.snapshot;
    return resolveGuardResult(TestBed.runInInjectionContext(() => adminGuard(state.root, state)));
  }

  function expectUrlTree(value: unknown): UrlTree {
    if (!(value instanceof UrlTree)) {
      throw new Error('Expected guard to return a UrlTree.');
    }

    return value;
  }
});

function resolveGuardResult(value: ReturnType<typeof adminGuard>): Promise<GuardResult> {
  if (isObservable(value)) {
    return firstValueFrom(value);
  }

  return Promise.resolve(value);
}
