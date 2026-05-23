import { ChangeDetectionStrategy, Component, type OnInit, computed, inject } from '@angular/core';

import type { AdminUser } from '../../../../core/services/admin/admin.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { CheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { DropdownMenuComponent } from '../../../../shared/components/dropdown-menu/dropdown-menu.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import type { UiMenuItem, UiSortState, UiTableColumn } from '../../../../shared/components/ui.types';
import { AdminUsersFacade } from '../../services/admin-users/admin-users.facade';

interface UserTableColumn extends UiTableColumn {
  ariaSort: 'ascending' | 'descending' | 'none' | null;
  sortIcon: '↑' | '↓' | '';
}

interface UserTableRow {
  user: AdminUser;
  selected: boolean;
  statusLabel: string;
  joinedDate: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [AlertBannerComponent, CheckboxComponent, DropdownMenuComponent, EmptyStateComponent, PaginationComponent, SearchBarComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="grid gap-lg">
      <header class="grid gap-md lg:grid-cols-[var(--ui-layout-search-header-grid)] lg:items-end">
        <div class="grid gap-xs">
          <p class="type-label-sm text-text-muted">Admin</p>
          <h2 class="type-heading-xl text-text-primary">Users</h2>
          <p class="type-body-md text-text-secondary">Approve customers, restrict risky accounts, and keep admin access visible.</p>
        </div>
        <app-search-bar
          scope="User"
          placeholder="Search by name, email, or phone"
          [query]="query()"
          [resultCount]="totalItems()"
          [suggestions]="[]"
          [loading]="isLoading()"
          (queryChange)="setQuery($event)"
          (submitted)="submitSearch()"
          (cleared)="clearSearch()"
        />
      </header>

      @if (statusMessage()) {
        <app-alert-banner tone="success" title="User updated" [message]="statusMessage()" [dismissible]="true" (dismissed)="clearStatusMessage()" />
      }
      @if (errorMessage()) {
        <app-alert-banner tone="error" title="User issue" [message]="errorMessage()" [dismissible]="true" (dismissed)="clearErrorMessage()" />
      }

      @if (!isLoading() && users().length === 0) {
        <app-empty-state
          type="admin"
          title="No users found"
          message="Clear search or wait for new customer registrations."
          [action]="{ label: 'Clear search', variant: 'secondary' }"
          (actionPressed)="clearSearch()"
        />
      } @else {
        <section class="grid gap-md" aria-labelledby="users-table-title">
          <div class="flex flex-wrap items-center justify-between gap-sm">
            <h3 id="users-table-title" class="type-heading-md text-text-primary">User records</h3>
            @if (selectedIds().length) {
              <div class="flex flex-wrap items-center gap-xs rounded-md border-hairline border-border-default bg-surface-subtle p-xs">
                <p class="px-xs type-body-sm text-text-secondary">{{ selectedIds().length }} selected</p>
                @for (action of bulkActions; track action.id) {
                  <button class="min-h-control-sm rounded-md border-hairline border-border-default bg-surface-raised px-sm type-label-sm interactive-transition hover:bg-surface-subtle focus-visible:focus-ring" type="button" [disabled]="action.disabled" (click)="handleBulkAction(action)">
                    {{ action.label }}
                  </button>
                }
              </div>
            }
          </div>

          <div class="overflow-x-auto rounded-md border-hairline border-border-default bg-surface-raised shadow-xs">
            @if (isLoading()) {
              <div class="p-md">
                <app-skeleton-loader shape="block" [count]="5" label="Loading users" />
              </div>
            } @else {
              <table class="w-full min-w-container-md border-collapse text-start">
                <caption class="sr-only">User management</caption>
                <thead class="bg-surface-subtle text-text-secondary">
                  <tr>
                    <th class="p-sm text-start">
                      <app-checkbox label="Select all users" [checked]="allUsersSelected()" (checkedChange)="toggleAllUsers($event)" />
                    </th>
                    @for (column of displayColumns(); track column.id) {
                      <th class="p-sm text-start type-label-sm" [attr.aria-sort]="column.ariaSort">
                        @if (column.sortable) {
                          <button class="inline-flex items-center gap-2xs rounded-sm type-label-sm text-text-secondary interactive-transition hover:text-text-primary focus-visible:focus-ring" type="button" (click)="sortBy(column)">
                            {{ column.header }}
                            @if (column.sortIcon) {
                              <span aria-hidden="true">{{ column.sortIcon }}</span>
                            }
                          </button>
                        } @else {
                          {{ column.header }}
                        }
                      </th>
                    }
                    <th class="p-sm text-end type-label-sm">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y-hairline divide-border-default">
                  @for (row of userRows(); track row.user.id) {
                    <tr class="interactive-transition hover:bg-surface-subtle">
                      <td class="p-sm">
                        <app-checkbox [label]="'Select ' + row.user.email" [checked]="row.selected" (checkedChange)="toggleUser(row.user.id, $event)" />
                      </td>
                      <td class="p-sm type-body-sm text-text-primary">{{ row.user.full_name }}</td>
                      <td class="p-sm type-body-sm text-text-primary">{{ row.user.email }}</td>
                      <td class="p-sm type-body-sm text-text-primary">{{ row.user.phone ?? '—' }}</td>
                      <td class="p-sm type-body-sm text-text-primary">{{ row.user.role }}</td>
                      <td class="p-sm type-body-sm text-text-primary">{{ row.statusLabel }}</td>
                      <td class="p-sm type-body-sm text-text-primary">{{ row.joinedDate }}</td>
                      <td class="p-sm text-end">
                        <app-dropdown-menu label="Row actions" [items]="rowActions" (selected)="handleRowAction(row.user.id, $event)" />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </section>

        <app-pagination [page]="page()" [pageSize]="pageSize" [totalItems]="totalItems()" [loading]="isLoading()" (pageChange)="setPage($event)" />
      }
    </section>
  `,
})
export class AdminUsersPage implements OnInit {
  private readonly adminUsers = inject(AdminUsersFacade);

  protected readonly pageSize = this.adminUsers.pageSize;
  protected readonly columns: readonly UiTableColumn[] = [
    { id: 'name', header: 'Name', sortable: true },
    { id: 'email', header: 'Email', sortable: true },
    { id: 'phone', header: 'Phone' },
    { id: 'role', header: 'Role', sortable: true },
    { id: 'status', header: 'Status', sortable: true },
    { id: 'joined', header: 'Joined', sortable: true },
  ];
  protected readonly rowActions: readonly UiMenuItem[] = [
    { id: 'approve-user', label: 'Approve user' },
    { id: 'restrict-user', label: 'Restrict user' },
    { id: 'delete-user', label: 'Delete user', destructive: true },
  ];
  protected readonly bulkActions: readonly UiMenuItem[] = [
    { id: 'approve-selected-users', label: 'Approve selected' },
    { id: 'restrict-selected-users', label: 'Restrict selected' },
  ];

  protected readonly users = this.adminUsers.users;
  protected readonly query = this.adminUsers.query;
  protected readonly sort = this.adminUsers.sort;
  protected readonly page = this.adminUsers.page;
  protected readonly totalItems = this.adminUsers.totalItems;
  protected readonly selectedIds = this.adminUsers.selectedIds;
  protected readonly isLoading = this.adminUsers.isLoading;
  protected readonly statusMessage = this.adminUsers.statusMessage;
  protected readonly errorMessage = this.adminUsers.errorMessage;

  protected readonly sortedUsers = computed(() => sortUsers(this.users(), this.sort()));
  protected readonly allUsersSelected = computed(() => this.sortedUsers().length > 0 && this.sortedUsers().every((user) => this.selectedIds().includes(user.id)));
  protected readonly displayColumns = computed<readonly UserTableColumn[]>(() =>
    this.columns.map((column) => ({
      ...column,
      ariaSort: columnAriaSort(column, this.sort()),
      sortIcon: columnSortIcon(column, this.sort()),
    })),
  );
  protected readonly userRows = computed<readonly UserTableRow[]>(() =>
    this.sortedUsers().map((user) => ({
      user,
      selected: this.selectedIds().includes(user.id),
      statusLabel: statusLabel(user.status),
      joinedDate: formatDate(user.created_at),
    })),
  );

  ngOnInit(): void {
    this.adminUsers.loadUsers();
  }

  protected setQuery(query: string): void {
    this.adminUsers.setQuery(query);
  }

  protected submitSearch(): void {
    this.adminUsers.submitSearch();
  }

  protected clearSearch(): void {
    this.adminUsers.clearSearch();
  }

  protected setPage(page: number): void {
    this.adminUsers.setPage(page);
  }

  protected handleRowAction(userId: string, action: UiMenuItem): void {
    this.adminUsers.runUserAction(userId, action.id);
  }

  protected handleBulkAction(action: UiMenuItem): void {
    this.adminUsers.runBulkUserAction(action.id);
  }

  protected sortBy(column: UiTableColumn): void {
    if (!column.sortable) {
      return;
    }
    const direction = this.sort()?.columnId === column.id && this.sort()?.direction === 'asc' ? 'desc' : 'asc';
    this.adminUsers.setSort({ columnId: column.id, direction });
  }

  protected toggleAllUsers(checked: boolean): void {
    this.adminUsers.toggleAllUsers(
      this.sortedUsers().map((user) => user.id),
      checked,
    );
  }

  protected toggleUser(userId: string, checked: boolean): void {
    this.adminUsers.toggleUser(userId, checked);
  }

  protected clearStatusMessage(): void {
    this.adminUsers.clearStatusMessage();
  }

  protected clearErrorMessage(): void {
    this.adminUsers.clearErrorMessage();
  }
}

function sortUsers(users: readonly AdminUser[], sort: UiSortState | null): readonly AdminUser[] {
  if (!sort) {
    return users;
  }

  return [...users].sort((left, right) => {
    const leftValue = userSortValue(left, sort.columnId);
    const rightValue = userSortValue(right, sort.columnId);
    return sort.direction === 'asc' ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
  });
}

function userSortValue(user: AdminUser, columnId: string): string {
  switch (columnId) {
    case 'name':
      return user.full_name;
    case 'email':
      return user.email;
    case 'role':
      return user.role;
    case 'status':
      return statusLabel(user.status);
    case 'joined':
      return user.created_at;
    default:
      return '';
  }
}

function statusLabel(status: AdminUser['status']): string {
  switch (status) {
    case 'pending_approval':
      return 'pending approval';
    case 'soft_deleted':
      return 'soft deleted';
    default:
      return status;
  }
}

function columnAriaSort(column: UiTableColumn, sort: UiSortState | null): 'ascending' | 'descending' | 'none' | null {
  if (!column.sortable) {
    return null;
  }
  if (sort?.columnId !== column.id) {
    return 'none';
  }

  return sort.direction === 'asc' ? 'ascending' : 'descending';
}

function columnSortIcon(column: UiTableColumn, sort: UiSortState | null): '↑' | '↓' | '' {
  if (sort?.columnId !== column.id) {
    return '';
  }

  return sort.direction === 'asc' ? '↑' : '↓';
}

function formatDate(value: string): string {
  return value.slice(0, 10);
}
