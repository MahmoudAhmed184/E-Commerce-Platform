import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, type TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../../environments/environment';
import { CatalogPageDataService, type CatalogHomeCollections } from './catalog-page-data.service';

interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  product_count: number;
}

interface ProductResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  availability: 'in_stock' | 'out_of_stock';
  average_rating: number;
  review_count: number;
  category: CategoryResponse;
  images: readonly unknown[];
  primary_image: string | null;
}

describe('CatalogPageDataService', () => {
  let service: CatalogPageDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CatalogPageDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads four category shelves from the largest populated categories', () => {
    const categories: readonly CategoryResponse[] = [
      categoryFixture(1, 'Accessories', 'accessories', 3),
      categoryFixture(2, 'Apparel', 'apparel', 8),
      categoryFixture(3, 'Audio', 'audio', 5),
      categoryFixture(4, 'Home', 'home', 7),
      categoryFixture(5, 'Archive', 'archive', 0),
    ];
    const expectedShelfSlugs = ['apparel', 'home', 'audio', 'accessories'];
    let result: CatalogHomeCollections | undefined;

    service.getHomeCollections().subscribe((collections) => {
      result = collections;
    });

    const categoryRequest = http.expectOne(`${environment.apiBaseUrl}/products/categories/`);
    const productRequests = http.match((request) => request.url === `${environment.apiBaseUrl}/products/products/`);
    expect(productRequests).toHaveLength(1);

    const homeProductsRequest = findProductRequest(productRequests, null);
    expect(homeProductsRequest.request.params.get('ordering')).toBe('-created_at');
    expect(homeProductsRequest.request.params.get('page_size')).toBe('8');
    homeProductsRequest.flush(paginatedResponse(Array.from({ length: 8 }, (_, index) => productFixture(index + 1, findCategory(categories, 'apparel')))));

    categoryRequest.flush(categories);

    const shelfRequests = http.match((request) => request.url === `${environment.apiBaseUrl}/products/products/` && request.params.has('category__slug'));
    expect(shelfRequests).toHaveLength(4);
    for (const [index, slug] of expectedShelfSlugs.entries()) {
      const category = findCategory(categories, slug);
      const shelfRequest = findProductRequest(shelfRequests, slug);

      expect(shelfRequest.request.params.get('ordering')).toBe('-created_at');
      expect(shelfRequest.request.params.get('page_size')).toBe('4');
      shelfRequest.flush(paginatedResponse([productFixture(100 + index, category)]));
    }

    expect(result?.featured).toHaveLength(4);
    expect(result?.newArrivals).toHaveLength(4);
    expect(result?.categoryShelves.map((shelf) => shelf.category.slug)).toEqual(expectedShelfSlugs);
    expect(result?.categoryShelves.every((shelf) => shelf.products.length === 1)).toBe(true);
  });
});

function categoryFixture(id: number, name: string, slug: string, productCount: number): CategoryResponse {
  return {
    id,
    name,
    slug,
    description: `${name} department`,
    product_count: productCount,
  };
}

function productFixture(id: number, category: CategoryResponse): ProductResponse {
  return {
    id,
    name: `${category.name} Product ${id}`,
    slug: `${category.slug}-product-${id}`,
    description: `${category.name} product details`,
    price: '10.00',
    stock: 12,
    availability: 'in_stock',
    average_rating: 4.5,
    review_count: 2,
    category,
    images: [],
    primary_image: null,
  };
}

function paginatedResponse(results: readonly ProductResponse[]): object {
  return {
    count: results.length,
    next: null,
    previous: null,
    results,
  };
}

function findCategory(categories: readonly CategoryResponse[], slug: string): CategoryResponse {
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    throw new Error(`Expected category ${slug} to exist.`);
  }

  return category;
}

function findProductRequest(requests: readonly TestRequest[], categorySlug: string | null): TestRequest {
  const request = requests.find((item) => {
    if (categorySlug === null) {
      return !item.request.params.has('category__slug');
    }

    return item.request.params.get('category__slug') === categorySlug;
  });

  if (!request) {
    throw new Error(categorySlug === null ? 'Expected storefront product request.' : `Expected product request for ${categorySlug}.`);
  }

  return request;
}
