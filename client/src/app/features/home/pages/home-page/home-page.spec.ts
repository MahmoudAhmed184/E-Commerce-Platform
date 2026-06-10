import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Category, PaginatedResponse, Product, ProductService } from '../../../products/services/product';
import { HomePage } from './home-page';

const category: Category = {
  id: 1,
  name: 'Furniture',
  slug: 'furniture',
  description: 'Furniture for every room.',
  product_count: 1,
};

const product: Product = {
  id: 7,
  name: 'Lounge Chair',
  slug: 'lounge-chair',
  description: '',
  price: '249.00',
  stock: 3,
  availability: 'in_stock',
  average_rating: 4.8,
  review_count: 12,
  category,
  images: [],
  primary_image: null,
};

const productResponse: PaginatedResponse<Product> = {
  count: 1,
  next: null,
  previous: null,
  results: [product],
};

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let component: HomePage;
  let productService: {
    getCategories: ReturnType<typeof vi.fn>;
    getProducts: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    productService = {
      getCategories: vi.fn().mockReturnValue(of([category])),
      getProducts: vi.fn().mockReturnValue(of(productResponse)),
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads categories and featured products', () => {
    expect(component).toBeTruthy();
    expect(productService.getCategories).toHaveBeenCalledOnce();
    expect(productService.getProducts).toHaveBeenCalledWith({
      category__slug: undefined,
      ordering: '-created_at',
      page_size: 8,
    });
    expect(fixture.nativeElement.textContent).toContain('Lounge Chair');
    expect(fixture.nativeElement.textContent).toContain('Only 3 left');
  });

  it('requests products for the selected category', () => {
    const categoryButton = Array.from(
      fixture.nativeElement.querySelectorAll('.category-filters button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Furniture'));

    categoryButton?.click();
    fixture.detectChanges();

    expect(productService.getProducts).toHaveBeenLastCalledWith({
      category__slug: 'furniture',
      ordering: '-created_at',
      page_size: 8,
    });
    expect(categoryButton?.getAttribute('aria-pressed')).toBe('true');
  });
});
