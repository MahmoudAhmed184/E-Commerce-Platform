import { HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, type Observable, tap, throwError } from 'rxjs';

import {
  parseLiteral,
  parseNullableStringField,
  parseRecord,
  parseStringField,
} from '../../models/runtime-validation/runtime-validation';
import type { LoginPayload, RegisterPayload, User, UserRole, UserStatus } from '../../models/user/user.model';
import { SKIP_AUTH, SKIP_REFRESH } from '../../interceptors/auth-http-context/auth-http-context';
import { ApiService } from '../api/api.service';

interface BackendUser {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: UserRole | 'CUSTOMER' | 'ADMIN';
  status: UserStatus | 'PENDING' | 'ACTIVE' | 'RESTRICTED' | 'DELETED';
}

interface LoadCurrentUserOptions {
  refreshOnUnauthorized?: boolean;
}

const publicRequestContext = (): HttpContext => new HttpContext().set(SKIP_AUTH, true).set(SKIP_REFRESH, true);

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly currentUserState = signal<User | null>(null);
  private readonly sessionModalOpenState = signal(false);
  private readonly sessionExtendingState = signal(false);
  private readonly sessionErrorState = signal<string | null>(null);
  private readonly secondsUntilExpiryState = signal(300);
  private readonly sessionHasDraftState = signal(false);

  readonly currentUser = this.currentUserState.asReadonly();
  readonly sessionModalOpen = this.sessionModalOpenState.asReadonly();
  readonly sessionExtending = this.sessionExtendingState.asReadonly();
  readonly sessionError = this.sessionErrorState.asReadonly();
  readonly secondsUntilExpiry = this.secondsUntilExpiryState.asReadonly();
  readonly sessionHasDraft = this.sessionHasDraftState.asReadonly();

  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  register(payload: RegisterPayload): Observable<void> {
    return this.api.post<unknown>('/auth/register/', payload, { context: publicRequestContext() }).pipe(map(() => undefined));
  }

  confirmEmail(token: string): Observable<void> {
    return this.api.post<unknown>('/auth/confirm-email/', { token }, { context: publicRequestContext() }).pipe(map(() => undefined));
  }

  login(payload: LoginPayload): Observable<void> {
    return this.api.post<unknown>('/auth/login/', payload, { context: publicRequestContext() }).pipe(
      map((response) => parseAuthUser(response, 'auth login')),
      tap((user) => {
        this.currentUserState.set(normalizeUser(user));
        this.sessionModalOpenState.set(false);
        this.sessionErrorState.set(null);
      }),
      map(() => undefined),
    );
  }

  logout(): Observable<void> {
    return this.api.post<unknown>('/auth/logout/', {}, { context: new HttpContext().set(SKIP_REFRESH, true) }).pipe(
      tap(() => {
        this.resetSessionPrompt();
        this.clearSession();
      }),
      map(() => undefined),
      catchError((error: unknown) => {
        this.resetSessionPrompt();
        this.clearSession();
        return throwError(() => error);
      }),
    );
  }

  refreshSession(): Observable<void> {
    return this.api
      .post<unknown>('/auth/token/refresh/', {}, { context: publicRequestContext() })
      .pipe(
        tap(() => {
          this.sessionModalOpenState.set(false);
          this.sessionErrorState.set(null);
          this.secondsUntilExpiryState.set(300);
        }),
        map(() => undefined),
      );
  }

  extendSession(): Observable<void> {
    this.sessionExtendingState.set(true);
    this.sessionErrorState.set(null);

    return this.refreshSession().pipe(
      map(() => undefined),
      catchError((error: unknown) => {
        this.sessionErrorState.set('Could not extend the session. Sign in again to continue.');
        return throwError(() => error);
      }),
      finalize(() => this.sessionExtendingState.set(false)),
    );
  }

  loadCurrentUser(options: LoadCurrentUserOptions = {}): Observable<void> {
    const context = options.refreshOnUnauthorized ? undefined : new HttpContext().set(SKIP_REFRESH, true);
    return this.api.get<unknown>('/users/me/', undefined, context ? { context } : undefined).pipe(
      map((response) => parseBackendUser(response, 'current user')),
      tap((user) => {
        const normalized = normalizeUser(user);
        this.currentUserState.set(normalized);
      }),
      map(() => undefined),
    );
  }

  updateProfile(payload: Partial<User>): Observable<void> {
    return this.api.patch<unknown>('/users/me/', payload).pipe(
      map((response) => parseBackendUser(response, 'updated user')),
      tap((user) => {
        const normalized = normalizeUser(user);
        this.currentUserState.set(normalized);
      }),
      map(() => undefined),
    );
  }

  clearSession(): void {
    this.currentUserState.set(null);
  }

  markSessionExpiring(secondsRemaining = 300, hasDraft = false): void {
    this.secondsUntilExpiryState.set(secondsRemaining);
    this.sessionHasDraftState.set(hasDraft);
    this.sessionErrorState.set(null);
    this.sessionModalOpenState.set(true);
  }

  markSessionExpired(message = 'Your session has expired. Sign in again to continue.'): void {
    this.secondsUntilExpiryState.set(0);
    this.sessionHasDraftState.set(false);
    this.sessionErrorState.set(message);
    this.sessionModalOpenState.set(true);
    this.clearSession();
  }

  dismissSessionModal(): void {
    this.resetSessionPrompt();
  }

  private resetSessionPrompt(): void {
    this.sessionHasDraftState.set(false);
    this.sessionErrorState.set(null);
    this.sessionModalOpenState.set(false);
  }
}

function normalizeUser(user: Partial<BackendUser | User>): User {
  return {
    id: user.id ?? 'usr-customer',
    email: user.email ?? 'customer@example.com',
    phone: user.phone ?? null,
    full_name: user.full_name ?? 'Customer User',
    role: normalizeRole(user.role),
    status: normalizeStatus(user.status),
  };
}

function parseAuthUser(value: unknown, context: string): BackendUser {
  const record = parseRecord(value, context);
  return parseBackendUser(record['user'] ?? record, `${context}.user`);
}

function parseBackendUser(value: unknown, context: string): BackendUser {
  const record = parseRecord(value, context);

  return {
    id: parseStringField(record, 'id', context),
    email: parseStringField(record, 'email', context),
    phone: parseNullableStringField(record, 'phone', context),
    full_name: parseStringField(record, 'full_name', context),
    role: parseLiteral(record['role'], ['customer', 'admin', 'CUSTOMER', 'ADMIN'], `${context}.role`),
    status: parseLiteral(
      record['status'],
      ['pending_approval', 'active', 'restricted', 'soft_deleted', 'PENDING', 'ACTIVE', 'RESTRICTED', 'DELETED'],
      `${context}.status`,
    ),
  };
}

function normalizeRole(role: string | undefined): UserRole {
  return String(role ?? 'customer').toLowerCase() === 'admin' ? 'admin' : 'customer';
}

function normalizeStatus(status: string | undefined): UserStatus {
  switch (String(status ?? 'active').toLowerCase()) {
    case 'pending':
    case 'pending_approval':
      return 'pending_approval';
    case 'restricted':
      return 'restricted';
    case 'deleted':
    case 'soft_deleted':
      return 'soft_deleted';
    case 'active':
    default:
      return 'active';
  }
}
