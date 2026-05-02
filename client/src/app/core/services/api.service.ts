import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

type QueryValue = string | number | boolean;
type QueryParams = Record<string, QueryValue | readonly QueryValue[] | null | undefined>;

export interface ApiRequestOptions {
  context?: HttpContext;
  params?: QueryParams;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(path: string, params?: QueryParams, options?: Pick<ApiRequestOptions, 'context'>): Observable<T> {
    return this.http.get<T>(this.toUrl(path), {
      context: options?.context,
      params: this.toHttpParams(params),
    });
  }

  post<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<T>(this.toUrl(path), body, {
      context: options?.context,
      params: this.toHttpParams(options?.params),
    });
  }

  patch<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.patch<T>(this.toUrl(path), body, {
      context: options?.context,
      params: this.toHttpParams(options?.params),
    });
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete<T>(this.toUrl(path), {
      context: options?.context,
      params: this.toHttpParams(options?.params),
    });
  }

  private toUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private toHttpParams(params: QueryParams | null | undefined): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          httpParams = httpParams.append(key, String(item));
        }
        continue;
      }

      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }
}
