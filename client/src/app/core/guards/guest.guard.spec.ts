import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  const isLoggedIn = vi.fn<() => boolean>();

  beforeEach(() => {
    isLoggedIn.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isLoggedIn },
        },
      ],
    });
  });

  it('allows signed-out users to open authentication pages', () => {
    isLoggedIn.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects authenticated users to products', () => {
    isLoggedIn.mockReturnValue(true);
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe('/products');
  });
});
