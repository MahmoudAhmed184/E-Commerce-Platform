import { Injectable, inject, signal } from '@angular/core';
import { finalize, forkJoin, type Observable } from 'rxjs';

import { AdminService, type AdminUser } from '../../../../core/services/admin/admin.service';
import type { UiSortState } from '../../../../shared/components/ui.types';

type UserActionId = 'approve-user' | 'restrict-user' | 'delete-user';
type BulkUserActionId = 'approve-selected-users' | 'restrict-selected-users';

@Injectable({ providedIn: 'root' })
export class AdminUsersFacade {
  private readonly adminService = inject(AdminService);

  private readonly usersState = signal<readonly AdminUser[]>([]);
  private readonly queryState = signal('');
  private readonly sortState = signal<UiSortState | null>({ columnId: 'joined', direction: 'desc' });
  private readonly pageState = signal(1);
  private readonly totalItemsState = signal(0);
  private readonly selectedIdsState = signal<readonly string[]>([]);
  private readonly isLoadingState = signal(false);
  private readonly statusMessageState = signal('');
  private readonly errorMessageState = signal('');

  readonly pageSize = 10;
  readonly users = this.usersState.asReadonly();
  readonly query = this.queryState.asReadonly();
  readonly sort = this.sortState.asReadonly();
  readonly page = this.pageState.asReadonly();
  readonly totalItems = this.totalItemsState.asReadonly();
  readonly selectedIds = this.selectedIdsState.asReadonly();
  readonly isLoading = this.isLoadingState.asReadonly();
  readonly statusMessage = this.statusMessageState.asReadonly();
  readonly errorMessage = this.errorMessageState.asReadonly();

  loadUsers(): void {
    this.errorMessageState.set('');
    this.isLoadingState.set(true);
    this.adminService
      .getUsers(this.currentQueryParams())
      .pipe(finalize(() => this.isLoadingState.set(false)))
      .subscribe({
        next: (response) => {
          this.usersState.set(response.results);
          this.totalItemsState.set(response.count);
        },
        error: () => this.errorMessageState.set('Users could not be loaded.'),
      });
  }

  setQuery(query: string): void {
    this.queryState.set(query);
  }

  submitSearch(): void {
    this.pageState.set(1);
    this.loadUsers();
  }

  clearSearch(): void {
    this.queryState.set('');
    this.pageState.set(1);
    this.loadUsers();
  }

  setPage(page: number): void {
    this.pageState.set(page);
    this.loadUsers();
  }

  setSort(sort: UiSortState): void {
    this.sortState.set(sort);
  }

  toggleAllUsers(userIds: readonly string[], checked: boolean): void {
    this.selectedIdsState.set(checked ? userIds : []);
  }

  toggleUser(userId: string, checked: boolean): void {
    const selected = new Set(this.selectedIdsState());
    if (checked) {
      selected.add(userId);
    } else {
      selected.delete(userId);
    }
    this.selectedIdsState.set(Array.from(selected));
  }

  runUserAction(userId: string, actionId: string): void {
    if (!isUserActionId(actionId)) {
      return;
    }

    const action = this.userAction(userId, actionId);
    this.runUserRequest(action.requestFactory, action.successMessage);
  }

  runBulkUserAction(actionId: string): void {
    if (!isBulkUserActionId(actionId)) {
      return;
    }

    const ids = this.selectedIdsState();
    if (!ids.length) {
      return;
    }

    const action = this.bulkUserAction(ids, actionId);
    this.runBulkUserRequest(action.requests, action.successMessage);
  }

  clearStatusMessage(): void {
    this.statusMessageState.set('');
  }

  clearErrorMessage(): void {
    this.errorMessageState.set('');
  }

  private currentQueryParams(): { search?: string; page: number; page_size: number } {
    const search = this.queryState().trim();
    return {
      ...(search ? { search } : {}),
      page: this.pageState(),
      page_size: this.pageSize,
    };
  }

  private userAction(userId: string, actionId: UserActionId): { requestFactory: () => Observable<AdminUser>; successMessage: string } {
    switch (actionId) {
      case 'approve-user':
        return { requestFactory: () => this.adminService.approveUser(userId), successMessage: 'User approved.' };
      case 'restrict-user':
        return { requestFactory: () => this.adminService.restrictUser(userId), successMessage: 'User restricted.' };
      case 'delete-user':
        return { requestFactory: () => this.adminService.softDeleteUser(userId), successMessage: 'User marked as deleted.' };
    }
  }

  private bulkUserAction(ids: readonly string[], actionId: BulkUserActionId): { requests: readonly Observable<AdminUser>[]; successMessage: string } {
    switch (actionId) {
      case 'approve-selected-users':
        return { requests: ids.map((id) => this.adminService.approveUser(id)), successMessage: `${ids.length} users approved.` };
      case 'restrict-selected-users':
        return { requests: ids.map((id) => this.adminService.restrictUser(id)), successMessage: `${ids.length} users restricted.` };
    }
  }

  private runUserRequest(requestFactory: () => Observable<AdminUser>, successMessage: string): void {
    this.errorMessageState.set('');
    this.isLoadingState.set(true);
    requestFactory()
      .pipe(finalize(() => this.isLoadingState.set(false)))
      .subscribe({
        next: () => {
          this.statusMessageState.set(successMessage);
          this.loadUsers();
        },
        error: () => this.errorMessageState.set('The user update could not be completed.'),
      });
  }

  private runBulkUserRequest(requests: readonly Observable<AdminUser>[], successMessage: string): void {
    this.errorMessageState.set('');
    this.isLoadingState.set(true);
    forkJoin(requests)
      .pipe(finalize(() => this.isLoadingState.set(false)))
      .subscribe({
        next: () => {
          this.selectedIdsState.set([]);
          this.statusMessageState.set(successMessage);
          this.loadUsers();
        },
        error: () => this.errorMessageState.set('One or more user updates failed.'),
      });
  }
}

function isUserActionId(value: string): value is UserActionId {
  return value === 'approve-user' || value === 'restrict-user' || value === 'delete-user';
}

function isBulkUserActionId(value: string): value is BulkUserActionId {
  return value === 'approve-selected-users' || value === 'restrict-selected-users';
}
