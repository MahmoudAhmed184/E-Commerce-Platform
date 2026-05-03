import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Product } from '../../services/product';
import { ProductCardComponent } from './product-card';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', {
      id: 1,
      name: 'Test Product',
      slug: 'test-product',
      description: 'A product for tests',
      price: '10.00',
      stock: 3,
      availability: 'in_stock',
      average_rating: 0,
      review_count: 0,
      category: {
        id: 1,
        name: 'Category',
        slug: 'category',
        description: '',
        product_count: 1,
      },
      images: [],
      primary_image: null,
    } satisfies Product);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
