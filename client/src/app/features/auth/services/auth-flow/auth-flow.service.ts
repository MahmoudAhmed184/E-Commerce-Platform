import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import type { AppError } from '../../../../core/interceptors/error/error.interceptor';
import type { LoginPayload, RegisterPayload } from '../../../../core/models/user/user.model';
import { AuthService } from '../../../../core/services/auth/auth.service';

export interface AuthFlowError {
  message: string;
  fieldErrors: Record<string, string[]> | null;
}

@Injectable({ providedIn: 'root' })
export class AuthFlowService {
  private readonly authService = inject(AuthService);

  login(payload: LoginPayload): Observable<void> {
    return this.authService.login(payload);
  }

  register(payload: RegisterPayload): Observable<void> {
    return this.authService.register(payload);
  }

  confirmEmail(token: string): Observable<void> {
    return this.authService.confirmEmail(token);
  }

  loginError(error: unknown): AuthFlowError {
    if (isAppError(error)) {
      return { message: loginErrorMessage(error), fieldErrors: error.fieldErrors ?? null };
    }

    return { message: 'Sign in could not be completed.', fieldErrors: null };
  }

  registrationError(error: unknown): AuthFlowError {
    if (isAppError(error)) {
      return { message: error.message, fieldErrors: error.fieldErrors ?? null };
    }

    return { message: 'Account creation could not be completed.', fieldErrors: null };
  }

  confirmationError(error: unknown): string {
    return isAppError(error) ? error.message : 'This confirmation link is invalid, expired, or has already been used.';
  }
}

export function loginErrorMessage(error: AppError): string {
  if (error.status === 401) {
    return 'Invalid credentials.';
  }

  if (error.status === 403) {
    if (error.code === 'account_restricted' || error.accountStatus === 'restricted') {
      return 'Your account has been restricted. Contact support.';
    }

    if (error.code === 'account_deleted' || error.accountStatus === 'soft_deleted') {
      return 'This account no longer exists.';
    }

    if (error.code === 'email_confirmation_required' || error.accountStatus === 'pending_approval') {
      return 'Please confirm your email before signing in.';
    }

    const message = error.message.toLowerCase();

    if (message.includes('restricted')) {
      return 'Your account has been restricted. Contact support.';
    }

    if (message.includes('deleted') || message.includes('soft_deleted')) {
      return 'This account no longer exists.';
    }

    return 'Please confirm your email before signing in.';
  }

  return error.message;
}

function isAppError(error: unknown): error is AppError {
  return !!error && typeof error === 'object' && 'status' in error && 'message' in error;
}
