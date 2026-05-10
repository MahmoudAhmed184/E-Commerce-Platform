import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { environment } from '../../../../../environments/environment';
import { AdminCategoriesPage } from './admin-categories';
import { PaginatedResponse, AdminCategory } from '../../services/admin.service';

function makeCategory(overrides: Partial<AdminCategory> = {}): AdminCategory {
  return {
    id: 1,
    name: 'Electronics',
    slug: 'electronics',
    description: 'Gadgets and gear',
    product_count: 5,
    ...overrides,
  };
}

function makePaginatedResponse(categories: AdminCategory[]): PaginatedResponse<AdminCategory> {
  return { count: categories.length, next: null, previous: null, results: categories };
}

describe('AdminCategoriesPage', () => {
  let fixture: ComponentFixture<AdminCategoriesPage>;
  let component: AdminCategoriesPage;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(AdminCategoriesPage);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushInitialLoad(categories: AdminCategory[] = [makeCategory()]): void {
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url.endsWith('/products/admin/categories/') && r.params.get('page') === '1');
    req.flush(makePaginatedResponse(categories));
    fixture.detectChanges();
  }

  it('renders the category list correctly', () => {
    flushInitialLoad([makeCategory({ name: 'Books', slug: 'books' })]);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Books');
    expect(el.textContent).toContain('books');
  });

  it('creates a new category', () => {
    flushInitialLoad([]);

    const nameInput = fixture.nativeElement.querySelector('#cat-name');
    nameInput.value = 'Fashion';
    nameInput.dispatchEvent(new Event('input'));
    
    const descInput = fixture.nativeElement.querySelector('#cat-desc');
    descInput.value = 'Clothing and style';
    descInput.dispatchEvent(new Event('input'));

    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = http.expectOne(`${environment.apiBaseUrl}/products/admin/categories/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Fashion', description: 'Clothing and style' });
    req.flush(makeCategory({ name: 'Fashion', slug: 'fashion' }));

    // Should reload after creation
    const reloadReq = http.expectOne((r) => r.url.endsWith('/products/admin/categories/') && r.params.get('page') === '1');
    reloadReq.flush(makePaginatedResponse([makeCategory({ name: 'Fashion', slug: 'fashion' })]));
  });

  it('updates an existing category', () => {
    const category = makeCategory({ id: 2, slug: 'old-slug', name: 'Old Name' });
    flushInitialLoad([category]);

    const editBtn = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.trim() === 'Edit');
    editBtn?.click();
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('#cat-name');
    nameInput.value = 'New Name';
    nameInput.dispatchEvent(new Event('input'));

    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = http.expectOne(`${environment.apiBaseUrl}/products/admin/categories/old-slug/`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'New Name', description: 'Gadgets and gear' });
    req.flush({ ...category, name: 'New Name' });

    // Should reload after update
    const reloadReq = http.expectOne((r) => r.url.endsWith('/products/admin/categories/') && r.params.get('page') === '1');
    reloadReq.flush(makePaginatedResponse([{ ...category, name: 'New Name' }]));
  });

  it('deletes a category', () => {
    const category = makeCategory({ id: 3, slug: 'to-delete' });
    flushInitialLoad([category]);

    const deleteBtn = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.trim() === 'Delete');
    deleteBtn?.click();

    const req = http.expectOne(`${environment.apiBaseUrl}/products/admin/categories/to-delete/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No categories yet.');
  });
});
