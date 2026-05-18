import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../../environments/environment';
import { AdminReviewsPage } from './admin-reviews';
import { PaginatedResponse, AdminReview } from '../../services/admin.service';

function makeReview(overrides: Partial<AdminReview> = {}): AdminReview {
  return {
    id: 1,
    user_name: 'Test User',
    product_name: 'Test Product',
    rating: 4,
    comment: 'Great product!',
    is_visible: true,
    deleted_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makePaginatedResponse(reviews: AdminReview[]): PaginatedResponse<AdminReview> {
  return { count: reviews.length, next: null, previous: null, results: reviews };
}

describe('AdminReviewsPage', () => {
  let fixture: ComponentFixture<AdminReviewsPage>;
  let component: AdminReviewsPage;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(AdminReviewsPage);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushInitialLoad(reviews: AdminReview[] = [makeReview()]): void {
    fixture.detectChanges(); // triggers ngOnInit → load()
    const req = http.expectOne(`${environment.apiBaseUrl}/admin/reviews/?page=1`);
    req.flush(makePaginatedResponse(reviews));
    fixture.detectChanges();
  }

  it('renders the review list from the service', () => {
    const review = makeReview({ user_name: 'Alice', product_name: 'Widget' });
    flushInitialLoad([review]);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Alice');
    expect(el.textContent).toContain('Widget');
  });

  it('shows Visible badge for visible reviews', () => {
    flushInitialLoad([makeReview({ is_visible: true, deleted_at: null })]);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Visible');
  });

  it('shows Hidden badge for hidden reviews', () => {
    flushInitialLoad([makeReview({ is_visible: false, deleted_at: null })]);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Hidden');
  });

  it('shows Deleted badge and greyed-out row for soft-deleted reviews', () => {
    flushInitialLoad([makeReview({ deleted_at: '2026-01-02T00:00:00Z' })]);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Deleted');
    expect(el.textContent).toContain('No actions');
  });

  it('shows Hide button for visible reviews', () => {
    flushInitialLoad([makeReview({ is_visible: true })]);

    const el = fixture.nativeElement as HTMLElement;
    const hideBtn = Array.from(el.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Hide');
    expect(hideBtn).toBeTruthy();
    expect(hideBtn?.textContent?.trim()).toBe('Hide');
  });

  it('shows Unhide button for hidden reviews', () => {
    flushInitialLoad([makeReview({ is_visible: false, deleted_at: null })]);

    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('button'));
    const unhideBtn = buttons.find((b) => b.textContent?.trim() === 'Unhide');
    expect(unhideBtn).toBeTruthy();
  });

  it('calls hideReview when Hide is clicked', () => {
    const review = makeReview({ id: 7, is_visible: true });
    flushInitialLoad([review]);

    const el = fixture.nativeElement as HTMLElement;
    const hideBtn = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Hide',
    )!;
    hideBtn.click();

    const req = http.expectOne(`${environment.apiBaseUrl}/admin/reviews/7/hide/`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...review, is_visible: false });
  });

  it('calls unhideReview when Unhide is clicked', () => {
    const review = makeReview({ id: 9, is_visible: false, deleted_at: null });
    flushInitialLoad([review]);

    const el = fixture.nativeElement as HTMLElement;
    const unhideBtn = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Unhide',
    )!;
    unhideBtn.click();

    const req = http.expectOne(`${environment.apiBaseUrl}/admin/reviews/9/unhide/`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...review, is_visible: true });
  });

  it('calls deleteReview and shows Deleted badge after delete', () => {
    const review = makeReview({ id: 3 });
    flushInitialLoad([review]);

    const el = fixture.nativeElement as HTMLElement;
    const deleteBtn = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Delete',
    )!;
    deleteBtn.click();

    const req = http.expectOne(`${environment.apiBaseUrl}/admin/reviews/3/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(el.textContent).toContain('Deleted');
  });

  it('shows error message when load fails', () => {
    fixture.detectChanges();
    const req = http.expectOne(`${environment.apiBaseUrl}/admin/reviews/?page=1`);
    req.error(new ProgressEvent('error'));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Could not load reviews.');
  });
});
