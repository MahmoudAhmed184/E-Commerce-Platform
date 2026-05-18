import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { PaginatedResponse } from '../../../core/models/pagination.model';
export type { PaginatedResponse };

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
  private readonly api = inject(ApiService);

  getProducts(filters?: ProductFilters): Observable<PaginatedResponse<Product>> {
    const params: Record<string, string | number> = {};
    if (filters) {
      if (filters.category__slug) params['category__slug'] = filters.category__slug;
      if (filters.search) params['search'] = filters.search;
      if (filters.min_price != null) params['min_price'] = filters.min_price;
      if (filters.max_price != null) params['max_price'] = filters.max_price;
      if (filters.ordering) params['ordering'] = filters.ordering;
      if (filters.page) params['page'] = filters.page;
      if (filters.page_size) params['page_size'] = filters.page_size;
    }
    return this.api.get<PaginatedResponse<Product>>('/products/products/', params);
  }

  getProduct(slug: string): Observable<Product> {
    return this.api.get<Product>(`/products/products/${slug}/`);
  }

  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('/products/categories/');
  }
}
