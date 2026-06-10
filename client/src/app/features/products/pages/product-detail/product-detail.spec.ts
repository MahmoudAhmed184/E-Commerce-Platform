import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { ProductDetailPage } from './product-detail';

describe('ProductDetailPage', () => {
  let component: ProductDetailPage;
  let fixture: ComponentFixture<ProductDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders product reviews on the product detail page', () => {
    const productFixture = TestBed.createComponent(ProductDetailPage);
    const productComponent = productFixture.componentInstance;

    productComponent.loading = false;
    productComponent.product = {
      id: 1,
      name: 'Reviewed Product',
      slug: 'reviewed-product',
      description: 'A product with reviews.',
      price: '15.00',
      stock: 4,
      availability: 'in_stock',
      average_rating: 4.5,
      review_count: 2,
      category: {
        id: 1,
        name: 'Reviews',
        slug: 'reviews',
        description: '',
        product_count: 1,
      },
      images: [],
    };

    productFixture.detectChanges();

    expect(productFixture.nativeElement.querySelector('app-reviews-page')).not.toBeNull();
    expect(productFixture.nativeElement.textContent).toContain('2 reviews');
  });
});
