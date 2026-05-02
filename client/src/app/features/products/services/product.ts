import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  product_count: number;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  availability: 'in_stock' | 'out_of_stock';
  average_rating: number;
  review_count: number;
  category: Category;
  images: ProductImage[];
  primary_image?: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProductFilters {
  category__slug?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/products`;

  getProducts(filters?: ProductFilters): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.category__slug) params = params.set('category__slug', filters.category__slug);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.min_price != null) params = params.set('min_price', filters.min_price);
      if (filters.max_price != null) params = params.set('max_price', filters.max_price);
      if (filters.ordering) params = params.set('ordering', filters.ordering);
      if (filters.page) params = params.set('page', filters.page);
      if (filters.page_size) params = params.set('page_size', filters.page_size);
    }
    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/products/`, { params });
  }

  getProduct(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${slug}/`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories/`);
  }
}
