import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../../../environments/environment';
import { AdminOrdersPage } from './admin-orders';
import { PaginatedResponse, AdminOrder } from '../../services/admin.service';

function makeOrder(overrides: Partial<AdminOrder> = {}): AdminOrder {
  return {
    id: 1,
    order_number: 'ORD-123',
    customer_email: 'test@example.com',
    status: 'pending',
    payment_status: 'pending',
    total_amount: '100.00',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makePaginatedResponse(orders: AdminOrder[]): PaginatedResponse<AdminOrder> {
  return { count: orders.length, next: null, previous: null, results: orders };
}

describe('AdminOrdersPage', () => {
  let fixture: ComponentFixture<AdminOrdersPage>;
  let component: AdminOrdersPage;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(AdminOrdersPage);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushInitialLoad(orders: AdminOrder[] = [makeOrder()]): void {
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url.endsWith('/admin/orders/') && r.params.get('page') === '1');
    req.flush(makePaginatedResponse(orders));
    fixture.detectChanges();
  }

  it('renders the order list correctly', () => {
    flushInitialLoad([makeOrder({ order_number: 'ORD-999', customer_email: 'alice@example.com' })]);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('ORD-999');
    expect(el.textContent).toContain('alice@example.com');
  });

  it('filters by status when dropdown changes', () => {
    flushInitialLoad();

    const select = fixture.nativeElement.querySelector('select[aria-label="Filter by order status"]');
    select.value = 'confirmed';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // ngModelChange calls load()
    const req = http.expectOne((r) => 
      r.url.endsWith('/admin/orders/') && 
      r.params.get('status') === 'confirmed'
    );
    req.flush(makePaginatedResponse([]));
  });

  it('filters by payment status when dropdown changes', () => {
    flushInitialLoad();

    const select = fixture.nativeElement.querySelector('select[aria-label="Filter by payment status"]');
    select.value = 'paid';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const req = http.expectOne((r) => 
      r.url.endsWith('/admin/orders/') && 
      r.params.get('payment_status') === 'paid'
    );
    req.flush(makePaginatedResponse([]));
  });

  it('calls updateOrderStatus when Confirm is clicked', () => {
    const order = makeOrder({ id: 42, status: 'pending' });
    flushInitialLoad([order]);

    const confirmBtn = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.trim() === 'Confirm');
    
    confirmBtn?.click();

    const req = http.expectOne(`${environment.apiBaseUrl}/admin/orders/42/`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'confirmed' });
    
    req.flush({ ...order, status: 'confirmed' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('confirmed');
  });

  it('calls updateOrderStatus when Cancel is clicked', () => {
    const order = makeOrder({ id: 43, status: 'pending' });
    flushInitialLoad([order]);

    const cancelBtn = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.trim() === 'Cancel');
    
    cancelBtn?.click();

    const req = http.expectOne(`${environment.apiBaseUrl}/admin/orders/43/`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'cancelled' });
    
    req.flush({ ...order, status: 'cancelled' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('cancelled');
  });
});
