import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../../environments/environment';
import { AdminUsersPage } from './admin-users';
import { PaginatedResponse, AdminUser } from '../../services/admin.service';

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'u1',
    email: 'user@example.com',
    phone: '+201000000001',
    full_name: 'Test User',
    role: 'customer',
    status: 'active',
    is_email_confirmed: true,
    deleted_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makePaginatedResponse(users: AdminUser[]): PaginatedResponse<AdminUser> {
  return { count: users.length, next: null, previous: null, results: users };
}

describe('AdminUsersPage', () => {
  let fixture: ComponentFixture<AdminUsersPage>;
  let component: AdminUsersPage;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(AdminUsersPage);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushInitialLoad(users: AdminUser[] = [makeUser()]): void {
    fixture.detectChanges();
    const req = http.expectOne(`${environment.apiBaseUrl}/admin/users/?page=1`);
    req.flush(makePaginatedResponse(users));
    fixture.detectChanges();
  }

  it('renders the user list from the service', () => {
    flushInitialLoad([makeUser({ email: 'alice@example.com', full_name: 'Alice' })]);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('alice@example.com');
  });

  it('shows Approve button for pending users', () => {
    flushInitialLoad([makeUser({ status: 'pending_approval' })]);

    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('button'));
    const approveBtn = buttons.find((b) => b.textContent?.trim() === 'Approve');
    expect(approveBtn).toBeTruthy();
  });

  it('shows Restrict button for active users', () => {
    flushInitialLoad([makeUser({ status: 'active' })]);

    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('button'));
    const restrictBtn = buttons.find((b) => b.textContent?.trim() === 'Restrict');
    expect(restrictBtn).toBeTruthy();
  });

  it('shows Activate button for restricted users', () => {
    flushInitialLoad([makeUser({ status: 'restricted' })]);

    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('button'));
    const activateBtn = buttons.find((b) => b.textContent?.trim() === 'Activate');
    expect(activateBtn).toBeTruthy();
  });

  it('shows Activate button for soft-deleted users', () => {
    flushInitialLoad([makeUser({ status: 'soft_deleted' })]);

    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('button'));
    const activateBtn = buttons.find((b) => b.textContent?.trim() === 'Activate');
    expect(activateBtn).toBeTruthy();
  });

  it('hides Delete button for soft-deleted users', () => {
    flushInitialLoad([makeUser({ status: 'soft_deleted' })]);

    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('button'));
    const deleteBtn = buttons.find((b) => b.textContent?.trim() === 'Delete');
    expect(deleteBtn).toBeFalsy();
  });

  it('calls approveUser when Approve is clicked', () => {
    const user = makeUser({ id: 'u7', status: 'pending_approval' });
    flushInitialLoad([user]);

    const el = fixture.nativeElement as HTMLElement;
    const approveBtn = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Approve',
    )!;
    approveBtn.click();

    const req = http.expectOne(`${environment.apiBaseUrl}/admin/users/u7/approve/`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...user, status: 'active' });
  });

  it('calls restrictUser when Restrict is clicked', () => {
    const user = makeUser({ id: 'u8', status: 'active' });
    flushInitialLoad([user]);

    const el = fixture.nativeElement as HTMLElement;
    const restrictBtn = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Restrict',
    )!;
    restrictBtn.click();

    const req = http.expectOne(`${environment.apiBaseUrl}/admin/users/u8/restrict/`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...user, status: 'restricted' });
  });

  it('calls activateUser when Activate is clicked', () => {
    const user = makeUser({ id: 'u10', status: 'restricted', is_email_confirmed: true });
    flushInitialLoad([user]);

    const el = fixture.nativeElement as HTMLElement;
    const activateBtn = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Activate',
    )!;
    activateBtn.click();

    const req = http.expectOne(`${environment.apiBaseUrl}/admin/users/u10/activate/`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...user, status: 'active' });
  });

  it('calls softDeleteUser when Delete is clicked', () => {
    const user = makeUser({ id: 'u9', status: 'active' });
    flushInitialLoad([user]);

    const el = fixture.nativeElement as HTMLElement;
    const deleteBtn = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Delete',
    )!;
    deleteBtn.click();

    const req = http.expectOne(`${environment.apiBaseUrl}/admin/users/u9/`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ ...user, status: 'soft_deleted', deleted_at: '2026-01-01' });
  });

  it('shows error message when load fails', () => {
    fixture.detectChanges();
    const req = http.expectOne(`${environment.apiBaseUrl}/admin/users/?page=1`);
    req.error(new ProgressEvent('error'));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Could not load users.');
  });
});
