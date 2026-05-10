import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../../../environments/environment';
import { AdminPaymentsPage } from './admin-payments';
import { PaginatedResponse, AdminPayment } from '../../services/admin.service';

function makePayment(overrides: Partial<AdminPayment> = {}): AdminPayment {
  return {
    id: 1,
    order_number: 'ORD-123',
    customer_email: 'test@example.com',
    amount: '100.00',
    method: 'card',
    status: 'paid',
    provider_reference: 'ref_123',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makePaginatedResponse(payments: AdminPayment[]): PaginatedResponse<AdminPayment> {
  return { count: payments.length, next: null, previous: null, results: payments };
}

describe('AdminPaymentsPage', () => {
  let fixture: ComponentFixture<AdminPaymentsPage>;
  let component: AdminPaymentsPage;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(AdminPaymentsPage);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushInitialLoad(payments: AdminPayment[] = [makePayment()]): void {
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url.endsWith('/admin/payments/') && r.params.get('page') === '1');
    req.flush(makePaginatedResponse(payments));
    fixture.detectChanges();
  }

  it('renders the payment list correctly', () => {
    flushInitialLoad([makePayment({ order_number: 'ORD-777', amount: '50.00' })]);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('ORD-777');
    expect(el.textContent).toContain('50.00');
  });

  it('filters by status when dropdown changes', () => {
    flushInitialLoad();

    const select = fixture.nativeElement.querySelector('select[aria-label="Filter by payment status"]');
    select.value = 'failed';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const req = http.expectOne((r) => 
      r.url.endsWith('/admin/payments/') && 
      r.params.get('status') === 'failed'
    );
    req.flush(makePaginatedResponse([]));
  });
});
