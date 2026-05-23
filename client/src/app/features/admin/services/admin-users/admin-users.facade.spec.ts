import { TestBed } from '@angular/core/testing';
import { type Observable, of, throwError } from 'rxjs';

import type { PaginatedResponse } from '../../../../core/models/pagination/pagination.model';
import { AdminService, type AdminUser } from '../../../../core/services/admin/admin.service';
import { AdminUsersFacade } from './admin-users.facade';

class AdminServiceStub {
  readonly getUsersCalls: unknown[] = [];
  readonly approved: string[] = [];
  readonly restricted: string[] = [];
  readonly deleted: string[] = [];
  getUsersResponse: Observable<PaginatedResponse<AdminUser>> = of(paginated([userFixture]));
  updateResponse: Observable<AdminUser> = of(userFixture);

  getUsers(params?: unknown): Observable<PaginatedResponse<AdminUser>> {
    this.getUsersCalls.push(params);
    return this.getUsersResponse;
  }

  approveUser(id: string): Observable<AdminUser> {
    this.approved.push(id);
    return this.updateResponse;
  }

  restrictUser(id: string): Observable<AdminUser> {
    this.restricted.push(id);
    return this.updateResponse;
  }

  softDeleteUser(id: string): Observable<AdminUser> {
    this.deleted.push(id);
    return this.updateResponse;
  }
}

const userFixture: AdminUser = {
  id: 'usr-1',
  email: 'buyer@example.com',
  phone: null,
  full_name: 'Buyer',
  role: 'customer',
  status: 'pending_approval',
  created_at: '2026-05-19T00:00:00Z',
};

describe('AdminUsersFacade', () => {
  let adminService: AdminServiceStub;
  let facade: AdminUsersFacade;

  beforeEach(() => {
    adminService = new AdminServiceStub();
    TestBed.configureTestingModule({
      providers: [AdminUsersFacade, { provide: AdminService, useValue: adminService }],
    });

    facade = TestBed.inject(AdminUsersFacade);
  });

  it('loads users with paging and search state', () => {
    facade.setQuery(' buyer ');
    facade.submitSearch();

    expect(facade.users()).toEqual([userFixture]);
    expect(facade.totalItems()).toBe(1);
    expect(adminService.getUsersCalls).toEqual([{ search: 'buyer', page: 1, page_size: 10 }]);
  });

  it('tracks selected users without exposing writable signals', () => {
    facade.toggleUser('usr-1', true);
    facade.toggleUser('usr-2', true);
    facade.toggleUser('usr-1', false);

    expect(facade.selectedIds()).toEqual(['usr-2']);
  });

  it('runs row updates and reloads users', () => {
    facade.runUserAction('usr-1', 'approve-user');

    expect(adminService.approved).toEqual(['usr-1']);
    expect(facade.statusMessage()).toBe('User approved.');
    expect(adminService.getUsersCalls.length).toBe(1);
  });

  it('normalizes bulk update failures', () => {
    adminService.updateResponse = throwError(() => new Error('denied'));
    facade.toggleAllUsers(['usr-1', 'usr-2'], true);

    facade.runBulkUserAction('restrict-selected-users');

    expect(facade.errorMessage()).toBe('One or more user updates failed.');
  });
});

function paginated<T>(results: readonly T[]): PaginatedResponse<T> {
  return {
    count: results.length,
    next: null,
    previous: null,
    results: [...results],
  };
}
