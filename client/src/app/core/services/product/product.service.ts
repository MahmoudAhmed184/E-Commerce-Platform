import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';

import type { PaginatedResponse } from '../../models/pagination/pagination.model';
import {
  parseArray,
  parseBooleanField,
  parseLiteralField,
  parseNumberField,
  parseOptionalArrayField,
  parseOptionalNullableStringField,
  parseOptionalStringField,
  parsePaginatedResponse,
  parseRecord,
  parseRecordField,
  parseStringField,
} from '../../models/runtime-validation/runtime-validation';
import { ApiService } from '../api/api.service';

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
  description?: string;
  price: string;
  stock: number;
  availability: 'in_stock' | 'out_of_stock';
  average_rating: number;
  review_count: number;
  category: Category;
  images?: ProductImage[];
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

export const PRODUCT_IMAGE_FALLBACK_URL =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22640%22 height=%22640%22 viewBox=%220 0 640 640%22%3E%3C/svg%3E';

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
    return this.api
      .get<unknown>('/products/products/', params)
      .pipe(map((response) => parsePaginatedResponse(response, (item) => parseProduct(item, 'product list item'), 'product list')));
  }

  getProduct(slug: string): Observable<Product> {
    return this.api.get<unknown>(`/products/products/${slug}/`).pipe(map((response) => parseProduct(response, 'product')));
  }

  getCategories(): Observable<Category[]> {
    return this.api
      .get<unknown>('/products/categories/')
      .pipe(map((response) => parseArray(response, (item) => parseCategory(item, 'category list item'), 'category list')));
  }
}

function parseCategory(value: unknown, context: string): Category {
  const record = parseRecord(value, context);

  return {
    id: parseNumberField(record, 'id', context),
    name: parseStringField(record, 'name', context),
    slug: parseStringField(record, 'slug', context),
    description: parseStringField(record, 'description', context),
    product_count: parseNumberField(record, 'product_count', context),
  };
}

function parseProductImage(value: unknown, context: string): ProductImage {
  const record = parseRecord(value, context);

  return {
    id: parseNumberField(record, 'id', context),
    image: parseStringField(record, 'image', context),
    alt_text: parseOptionalStringField(record, 'alt_text', context) ?? '',
    is_primary: parseBooleanField(record, 'is_primary', context),
  };
}

function parseProduct(value: unknown, context: string): Product {
  const record = parseRecord(value, context);
  const description = parseOptionalStringField(record, 'description', context);
  const images = parseOptionalArrayField(record, 'images', (item, index) => parseProductImage(item, `${context}.images[${index}]`), context);
  const primaryImage = parseOptionalNullableStringField(record, 'primary_image', context);

  return {
    id: parseNumberField(record, 'id', context),
    name: parseStringField(record, 'name', context),
    slug: parseStringField(record, 'slug', context),
    ...(description !== undefined ? { description } : {}),
    price: parseStringField(record, 'price', context),
    stock: parseNumberField(record, 'stock', context),
    availability: parseLiteralField(record, 'availability', ['in_stock', 'out_of_stock'], context),
    average_rating: parseNumberField(record, 'average_rating', context),
    review_count: parseNumberField(record, 'review_count', context),
    category: parseCategory(parseRecordField(record, 'category', context), `${context}.category`),
    ...(images !== undefined ? { images } : {}),
    ...(primaryImage !== undefined ? { primary_image: primaryImage } : {}),
  };
}
