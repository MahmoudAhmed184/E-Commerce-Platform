import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface AppError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export const errorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return throwError(() => error);
      }

      return throwError(() => mapHttpError(error));
    }),
  );

function mapHttpError(error: unknown): AppError {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      status: 0,
      message: 'An unexpected error occurred.',
    };
  }

  const body = toErrorBody(error.error);
  const fieldErrors = collectFieldErrors(body);
  const message = findErrorMessage(body) ?? defaultMessage(error.status);

  return {
    status: error.status,
    message,
    ...(Object.keys(fieldErrors).length ? { fieldErrors } : {}),
  };
}

function toErrorBody(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    return { detail: value };
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function collectFieldErrors(body: Record<string, unknown>): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(body)) {
    if (key === 'detail' || key === 'message' || key === 'non_field_errors') {
      continue;
    }

    const messages = toMessages(value);

    if (messages.length) {
      fieldErrors[key] = messages;
    }
  }

  return fieldErrors;
}

function findErrorMessage(body: Record<string, unknown>): string | null {
  const candidates = [body['detail'], body['message'], body['non_field_errors']];

  for (const candidate of candidates) {
    const messages = toMessages(candidate);

    if (messages.length) {
      return messages.join(' ');
    }
  }

  return null;
}

function toMessages(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return [];
}

function defaultMessage(status: number): string {
  if (status === 0) {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  if (status >= 500) {
    return 'The server could not complete the request.';
  }

  return 'The request could not be completed.';
}
