import { HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

import { SKIP_AUTH, SKIP_REFRESH } from '../interceptors/auth-http-context';
import { LoginPayload, RegisterPayload, User } from '../models/user.model';
import { ApiService } from './api.service';

interface BackendUser {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: 'customer' | 'admin' | 'CUSTOMER' | 'ADMIN';
  status: 'pending_approval' | 'active' | 'restricted' | 'soft_deleted' | 'PENDING' | 'ACTIVE' | 'RESTRICTED' | 'DELETED';
}

interface BackendAuthTokens {
  access: string;
  refresh: string;
  user: BackendUser;
}

interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const publicRequestContext = (): HttpContext => new HttpContext().set(SKIP_AUTH, true).set(SKIP_REFRESH, true);

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);

  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  register(payload: RegisterPayload): Observable<void> {
    return this.api.post<unknown>('/auth/register/', payload, { context: publicRequestContext() }).pipe(map(() => undefined));
  }

  confirmEmail(token: string): Observable<void> {
    return this.api.post<unknown>('/auth/confirm-email/', { token }, { context: publicRequestContext() }).pipe(map(() => undefined));
  }

  login(payload: LoginPayload): Observable<void> {
    return this.api.post<BackendAuthTokens>('/auth/login/', payload, { context: publicRequestContext() }).pipe(
      tap((tokens) => this.storeTokens(tokens)),
      map(() => undefined),
    );
  }

  logout(): Observable<void> {
    const refresh = this.getRefreshToken();

    if (!refresh) {
      this.clearSession();
      return of(undefined);
    }

    return this.api.post<unknown>('/auth/logout/', { refresh }, { context: new HttpContext().set(SKIP_REFRESH, true) }).pipe(
      map(() => undefined),
      catchError((error: unknown) => {
        this.clearSession();
        return throwError(() => error);
      }),
      tap(() => this.clearSession()),
    );
  }

  refreshToken(): Observable<string> {
    const refresh = this.getRefreshToken();

    if (!refresh) {
      return throwError(() => new Error('No refresh token available.'));
    }

    return this.api
      .post<RefreshTokenResponse>('/auth/token/refresh/', { refresh }, { context: publicRequestContext() })
      .pipe(
        tap((tokens) => {
          localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);

          if (tokens.refresh) {
            localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
          }
        }),
        map((tokens) => tokens.access),
      );
  }

  loadCurrentUser(): Observable<void> {
    if (!this.getAccessToken()) {
      this.currentUser.set(null);
      return of(undefined);
    }

    return this.api.get<BackendUser>('/users/me/').pipe(
      tap((user) => this.currentUser.set(normalizeUser(user))),
      map(() => undefined),
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.currentUser.set(null);
  }

  private storeTokens(tokens: BackendAuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    this.currentUser.set(normalizeUser(tokens.user));
  }
}

function normalizeUser(user: BackendUser): User {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    full_name: user.full_name,
    // SRS-MISMATCH: user.role — live backend returns lowercase role values while the frontend task model requires uppercase values.
    role: user.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
    // SRS-MISMATCH: user.status — live backend uses pending_approval/active/restricted/soft_deleted while the frontend task model requires PENDING/ACTIVE/RESTRICTED/DELETED.
    status: normalizeStatus(user.status),
  };
}

function normalizeStatus(status: BackendUser['status']): User['status'] {
  switch (status) {
    case 'active':
    case 'ACTIVE':
      return 'ACTIVE';
    case 'restricted':
    case 'RESTRICTED':
      return 'RESTRICTED';
    case 'soft_deleted':
    case 'DELETED':
      return 'DELETED';
    case 'pending_approval':
    case 'PENDING':
      return 'PENDING';
  }
}
