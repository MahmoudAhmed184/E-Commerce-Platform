import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../../../environments/environment';
import { AdminProductsPage } from './admin-products';
import { PaginatedResponse, AdminProduct } from '../../services/admin.service';

function makeBackendProduct(overrides: any = {}): any {
  return {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    price: '99.99',
    stock: 10,
    availability: 'in_stock',
    is_active: true,
    category: { id: 1, name: 'Test Category', slug: 'test-cat' },
    ...overrides,
  };
}

function makePaginatedResponse(results: any[]): PaginatedResponse<any> {
  return { count: results.length, next: null, previous: null, results };
}

describe('AdminProductsPage', () => {
  let fixture: ComponentFixture<AdminProductsPage>;
  let component: AdminProductsPage;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(AdminProductsPage);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushInitialLoad(products: any[] = [makeBackendProduct()]): void {
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url.endsWith('/products/admin/products/') && r.params.get('page') === '1');
    req.flush(makePaginatedResponse(products));
    fixture.detectChanges();
  }

  it('renders the product list correctly', () => {
    flushInitialLoad([makeBackendProduct({ name: 'Gadget', price: '49.99' })]);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Gadget');
    expect(el.textContent).toContain('49.99');
  });

  it('toggles product active status', async () => {
    const product = makeBackendProduct({ id: 1, slug: 'p1', is_active: true });
    flushInitialLoad([product]);

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>);
    const activeBtn = buttons.find(b => b.textContent?.trim() === 'Active');
    
    expect(activeBtn).toBeTruthy();
    activeBtn?.click();
    fixture.detectChanges();

    const req = http.expectOne(`${environment.apiBaseUrl}/products/admin/products/p1/deactivate/`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...product, is_active: false });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Inactive');
  });

  it('updates stock quantity', async () => {
    const product = makeBackendProduct({ id: 5, slug: 'p5', stock: 10 });
    flushInitialLoad([product]);

    const editBtn = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.trim() === 'Edit Stock');
    
    expect(editBtn).toBeTruthy();
    editBtn?.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    
    input.value = '25';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    
    const saveBtn = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.trim() === 'Save');
    
    expect(saveBtn).toBeTruthy();
    saveBtn?.click();
    fixture.detectChanges();

    const req = http.expectOne(`${environment.apiBaseUrl}/products/admin/products/p5/update_stock/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ quantity: 25 });
    req.flush({ ...product, stock: 25 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('25');
  });
});
