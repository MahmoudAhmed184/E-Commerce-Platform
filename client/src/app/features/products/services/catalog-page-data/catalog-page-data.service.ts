import { Injectable, inject } from '@angular/core';
import { forkJoin, map, of, switchMap, type Observable } from 'rxjs';

import type { UiReview } from '../../../../core/models/commerce-ui/commerce-ui.model';
import type { UiGalleryImage } from '../../../../shared/components/ui.types';
import {
  PRODUCT_IMAGE_FALLBACK_URL,
  type Category,
  type Product,
  ProductService,
} from '../../../../core/services/product/product.service';
import { type Review, ReviewService } from '../../../../core/services/review/review.service';

export type CatalogSort = 'newest' | 'price-asc' | 'price-desc';

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
}

export interface CatalogCategoryShelf {
  id: string;
  category: CatalogCategory;
  products: readonly CatalogProduct[];
}

export interface CatalogHomeCollections {
  featured: readonly CatalogProduct[];
  newArrivals: readonly CatalogProduct[];
  categories: readonly CatalogCategory[];
  categoryShelves: readonly CatalogCategoryShelf[];
}

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  imageUrl: string;
  price: number;
  currency: string;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  rating?: number;
  reviewCount?: number;
  saleLabel?: string;
  description: string;
  inventory: number;
  images: readonly UiGalleryImage[];
  features: readonly CatalogFeature[];
  specs: readonly CatalogSpec[];
  reviews: readonly UiReview[];
}

export interface CatalogFeature {
  id: string;
  label: string;
}

export interface CatalogSpec {
  id: string;
  label: string;
  value: string;
}

export interface CatalogProductFilters {
  search?: string;
  category?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
}

export interface CatalogProductCollection {
  products: readonly CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
}

const HOME_COLLECTION_PRODUCT_LIMIT = 8;
const HOME_CATEGORY_SHELF_LIMIT = 4;
const HOME_CATEGORY_SHELF_PRODUCT_LIMIT = 4;

@Injectable({ providedIn: 'root' })
export class CatalogPageDataService {
  private readonly productService = inject(ProductService);
  private readonly reviewService = inject(ReviewService);

  getHomeCollections(): Observable<CatalogHomeCollections> {
    return forkJoin({
      categories: this.getCategories(),
      products: this.productService.getProducts({ ordering: '-created_at', page_size: HOME_COLLECTION_PRODUCT_LIMIT }),
    }).pipe(
      switchMap(({ categories, products }) =>
        this.getCategoryShelves(categories).pipe(
          map((categoryShelves) => {
            const mappedProducts = products.results.map((product) => mapCatalogProduct(product));

            return {
              featured: mappedProducts.slice(0, 4),
              newArrivals: mappedProducts.slice(4, 8),
              categories,
              categoryShelves,
            };
          }),
        ),
      ),
    );
  }

  getCategories(): Observable<readonly CatalogCategory[]> {
    return this.productService.getCategories().pipe(map((categories) => categories.map(mapCatalogCategory)));
  }

  getProducts(filters: CatalogProductFilters = {}): Observable<CatalogProductCollection> {
    const page = Math.max(filters.page ?? 1, 1);
    const pageSize = filters.pageSize ?? 9;

    const search = filters.search?.trim();
    const productFilters = {
      ...(search ? { search } : {}),
      ...(filters.category ? { category__slug: filters.category } : {}),
      ...(filters.minPrice !== null && filters.minPrice !== undefined ? { min_price: filters.minPrice } : {}),
      ...(filters.maxPrice !== null && filters.maxPrice !== undefined ? { max_price: filters.maxPrice } : {}),
      ordering: mapOrdering(filters.sort),
      page,
      page_size: pageSize,
    };

    return this.productService
      .getProducts(productFilters)
      .pipe(
        map((response) => ({
          products: response.results.map((product) => mapCatalogProduct(product)),
          total: response.count,
          page,
          pageSize,
        })),
      );
  }

  getProduct(slug: string): Observable<CatalogProduct> {
    return forkJoin({
      product: this.productService.getProduct(slug),
      reviews: this.reviewService.getProductReviews(slug, { page: 1, page_size: 6 }),
    }).pipe(
      map(({ product, reviews }) => mapCatalogProduct(product, reviews.results.map(mapUiReview))),
    );
  }

  private getCategoryShelves(categories: readonly CatalogCategory[]): Observable<readonly CatalogCategoryShelf[]> {
    const requests = topHomeCategories(categories).map((category) =>
      this.productService.getProducts({ category__slug: category.slug, ordering: '-created_at', page_size: HOME_CATEGORY_SHELF_PRODUCT_LIMIT }).pipe(
        map((response) => ({
          id: category.slug,
          category,
          products: response.results.map((product) => mapCatalogProduct(product)),
        })),
      ),
    );

    return requests.length > 0 ? forkJoin(requests) : of([]);
  }
}

function mapCatalogCategory(category: Category): CatalogCategory {
  return {
    id: String(category.id),
    name: category.name,
    slug: category.slug,
    description: category.description,
    productCount: category.product_count,
  };
}

function mapCatalogProduct(product: Product, reviews: readonly UiReview[] = []): CatalogProduct {
  const stockStatus = mapStockStatus(product.stock);
  const imageUrl = product.primary_image ?? product.images?.[0]?.image ?? PRODUCT_IMAGE_FALLBACK_URL;
  const mappedProduct: CatalogProduct = {
    id: String(product.id),
    slug: product.slug,
    name: product.name,
    category: product.category.name,
    imageUrl,
    price: Number(product.price),
    currency: 'USD',
    stockStatus,
    rating: product.average_rating,
    reviewCount: product.review_count,
    description: product.description ?? 'Product details are available at checkout and in your order confirmation.',
    inventory: product.stock,
    images: mapProductImages(product, imageUrl),
    features: buildFeatures(product),
    specs: buildSpecs(product),
    reviews,
  };

  if (stockStatus === 'low-stock') {
    mappedProduct.saleLabel = 'Low stock';
  }

  return mappedProduct;
}

function topHomeCategories(categories: readonly CatalogCategory[]): readonly CatalogCategory[] {
  return [...categories]
    .filter((category) => category.productCount > 0)
    .sort((first, second) => second.productCount - first.productCount || first.name.localeCompare(second.name))
    .slice(0, HOME_CATEGORY_SHELF_LIMIT);
}

function mapProductImages(product: Product, fallbackUrl: string): readonly UiGalleryImage[] {
  if (!product.images?.length) {
    return [
      {
        id: `${product.id}-fallback`,
        src: fallbackUrl,
        alt: product.name,
      },
    ];
  }

  return product.images.map((image) => ({
    id: String(image.id),
    src: image.image,
    alt: nonEmptyText(image.alt_text, product.name),
  }));
}

function mapUiReview(review: Review): UiReview {
  return {
    id: String(review.id),
    authorName: review.user_name,
    createdAt: review.created_at,
    rating: review.rating,
    body: nonEmptyText(review.comment, 'No written comment.'),
    moderationState: review.is_visible ? 'visible' : 'hidden',
  };
}

function nonEmptyText(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }

  return trimmed;
}

function buildFeatures(product: Product): readonly CatalogFeature[] {
  return [
    {
      id: 'stock',
      label: product.stock > 0 ? `${product.stock} units are available for checkout.` : 'This product is currently unavailable.',
    },
    {
      id: 'reviews',
      label: product.review_count > 0 ? `${product.review_count} customer reviews contribute to the current rating.` : 'No customer reviews have been published yet.',
    },
    {
      id: 'category',
      label: `Listed in the ${product.category.name} category.`,
    },
  ];
}

function buildSpecs(product: Product): readonly CatalogSpec[] {
  return [
    { id: 'category', label: 'Category', value: product.category.name },
    { id: 'availability', label: 'Availability', value: formatAvailability(product.stock) },
    { id: 'reviews', label: 'Reviews', value: String(product.review_count) },
  ];
}

function mapOrdering(sort: CatalogSort | undefined): string {
  switch (sort) {
    case 'price-asc':
      return 'price';
    case 'price-desc':
      return '-price';
    case 'newest':
    default:
      return '-created_at';
  }
}

function mapStockStatus(stock: number): CatalogProduct['stockStatus'] {
  if (stock <= 0) {
    return 'out-of-stock';
  }

  return stock <= 5 ? 'low-stock' : 'in-stock';
}

function formatAvailability(stock: number): string {
  if (stock <= 0) {
    return 'Unavailable';
  }

  return stock <= 5 ? `Low stock (${stock} left)` : 'In stock';
}
