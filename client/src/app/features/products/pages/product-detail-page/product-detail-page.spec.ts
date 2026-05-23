import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import type { CatalogProduct } from '../../services/catalog-page-data/catalog-page-data.service';
import { CatalogPageDataService } from '../../services/catalog-page-data/catalog-page-data.service';
import { ProductCartWorkflowService } from '../../services/product-cart-workflow/product-cart-workflow.service';
import { ProductDetailPage } from './product-detail-page';

describe('ProductDetailPage', () => {
  let component: ProductDetailPage;
  let fixture: ComponentFixture<ProductDetailPage>;
  let catalogData: Pick<CatalogPageDataService, 'getProduct'>;
  let cartWorkflow: Pick<ProductCartWorkflowService, 'addProduct'>;

  beforeEach(async () => {
    catalogData = {
      getProduct: vi.fn(() => of(productFixture({ stockStatus: 'in-stock', inventory: 8 }))),
    };
    cartWorkflow = {
      addProduct: vi.fn(() => of({ status: 'added' as const, message: 'Added to cart.' })),
    };

    await TestBed.configureTestingModule({
      imports: [ProductDetailPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'womens-watch' })),
            queryParamMap: of(convertToParamMap({})),
            snapshot: {
              paramMap: convertToParamMap({ slug: 'womens-watch' }),
            },
          },
        },
        { provide: CatalogPageDataService, useValue: catalogData },
        { provide: ProductCartWorkflowService, useValue: cartWorkflow },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the product title outside of the image gallery', () => {
    const host = fixture.nativeElement as HTMLElement;
    const title = host.querySelector<HTMLHeadingElement>('#product-title');
    const gallery = fixture.debugElement.query(By.css('app-image-gallery'));

    expect(title?.textContent?.trim()).toBe("Women's Wrist Watch");
    expect((gallery.nativeElement as HTMLElement).contains(title)).toBe(false);
  });

  it('replaces purchase controls with an out-of-stock recovery action', async () => {
    vi.mocked(catalogData.getProduct).mockReturnValue(of(productFixture({ stockStatus: 'out-of-stock', inventory: 0 })));

    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const browseButton = Array.from(host.querySelectorAll<HTMLButtonElement>('aside button')).find((button) =>
      button.textContent?.includes('Browse products'),
    );
    const quantityInput = host.querySelector<HTMLInputElement>('aside input[type="number"]');

    expect(host.textContent).toContain('Currently out of stock');
    expect(quantityInput).toBeNull();
    expect(browseButton?.disabled).toBe(false);
  });
});

function productFixture(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: '194',
    slug: 'womens-watch',
    name: "Women's Wrist Watch",
    category: 'Womens Watches',
    imageUrl: '/watch.png',
    price: 129.99,
    currency: 'USD',
    stockStatus: 'in-stock',
    rating: 0,
    reviewCount: 0,
    description: "The Women's Wrist Watch is a versatile and fashionable timepiece for everyday wear.",
    inventory: 8,
    images: [{ id: 'primary', src: '/watch.png', alt: "Women's Wrist Watch" }],
    features: [{ id: 'stock', label: '8 units are available for checkout.' }],
    specs: [{ id: 'availability', label: 'Availability', value: 'In stock' }],
    reviews: [],
    ...overrides,
  };
}
