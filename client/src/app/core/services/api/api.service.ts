import { HttpClient, type HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

type QueryValue = string | number | boolean;
type QueryParams = Record<string, QueryValue | readonly QueryValue[] | null | undefined>;

export interface ApiRequestOptions {
  context?: HttpContext;
  headers?: HttpHeaders | Record<string, string>;
  params?: QueryParams;
}

interface JsonRequestOptions {
  context?: HttpContext;
  headers?: HttpHeaders | Record<string, string>;
  params?: HttpParams;
  withCredentials: true;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(path: string, params?: QueryParams, options?: Pick<ApiRequestOptions, 'context'>): Observable<T> {
    return this.http.get<T>(this.toUrl(path), this.toRequestOptions(params, options));
  }

  post<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<T>(this.toUrl(path), body, this.toRequestOptions(options?.params, options));
  }

  patch<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.patch<T>(this.toUrl(path), body, this.toRequestOptions(options?.params, options));
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete<T>(this.toUrl(path), this.toRequestOptions(options?.params, options));
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

  private toHttpHeaders(headers: HttpHeaders | Record<string, string> | null | undefined): HttpHeaders | undefined {
    if (!headers) {
      return undefined;
    }

    return headers instanceof HttpHeaders ? headers : new HttpHeaders(headers);
  }

  private toRequestOptions(params?: QueryParams, options?: Pick<ApiRequestOptions, 'context' | 'headers'>): JsonRequestOptions {
    const requestOptions: JsonRequestOptions = { withCredentials: true };
    const httpParams = this.toHttpParams(params);
    const httpHeaders = this.toHttpHeaders(options?.headers);

    if (options?.context) {
      requestOptions.context = options.context;
    }
    if (httpHeaders) {
      requestOptions.headers = httpHeaders;
    }
    if (httpParams) {
      requestOptions.params = httpParams;
    }

    return requestOptions;
  }
}
