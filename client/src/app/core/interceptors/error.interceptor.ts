import { HttpInterceptorFn } from '@angular/common/http';

export interface AppError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => next(request);
