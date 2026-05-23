import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import type { GuardResult } from '@angular/router';
import { firstValueFrom, isObservable, type Observable, of } from 'rxjs';

import { AuthService } from '../../services/auth/auth.service';
import { authGuard } from './auth.guard';

class AuthServiceStub {
  private readonly loggedInState = signal(false);
  readonly isLoggedIn = this.loggedInState.asReadonly();
  clearSessionCalled = false;

  setLoggedIn(loggedIn: boolean): void {
    this.loggedInState.set(loggedIn);
  }

  loadCurrentUser(): Observable<void> {
    return of(undefined);
  }

  clearSession(): void {
    this.clearSessionCalled = true;
    this.loggedInState.set(false);
  }
}

describe('authGuard', () => {
  let authService: AuthServiceStub;
  let router: Router;

  beforeEach(() => {
    authService = new AuthServiceStub();

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authService }, provideRouter([])],
    });

    router = TestBed.inject(Router);
  });

  it('allows authenticated users after backend session verification', async () => {
    authService.setLoggedIn(true);

    const result = await runGuard();

    expect(result).toBe(true);
  });

  it('redirects anonymous users to login with a return url after backend session verification', async () => {
    authService.setLoggedIn(false);

    const result = expectUrlTree(await runGuard());

    expect(router.serializeUrl(result)).toBe('/auth/login?returnUrl=');
  });

  function runGuard(): Promise<GuardResult> {
    const state = router.routerState.snapshot;
    return resolveGuardResult(TestBed.runInInjectionContext(() => authGuard(state.root, state)));
  }

  function expectUrlTree(value: unknown): UrlTree {
    if (!(value instanceof UrlTree)) {
      throw new Error('Expected guard to return a UrlTree.');
    }

    return value;
  }
});

function resolveGuardResult(value: ReturnType<typeof authGuard>): Promise<GuardResult> {
  if (isObservable(value)) {
    return firstValueFrom(value);
  }

  return Promise.resolve(value);
}
