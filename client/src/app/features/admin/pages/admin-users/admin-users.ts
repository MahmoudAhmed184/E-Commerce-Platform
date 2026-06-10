import { ChangeDetectionStrategy, Component, type OnInit, computed, inject } from '@angular/core';
import { LucideCheckCheck, LucideLockKeyhole, LucideShieldCheck, LucideTrash2, LucideUsersRound } from '@lucide/angular';

import type { AdminUser } from '../../../../core/services/admin/admin.service';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { CheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TooltipComponent } from '../../../../shared/components/tooltip/tooltip.component';
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
  statusTone: 'success' | 'warning' | 'error' | 'neutral';
  joinedDate: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    AlertBannerComponent,
    BadgeComponent,
    CheckboxComponent,
    EmptyStateComponent,
    LucideCheckCheck,
    LucideLockKeyhole,
    LucideShieldCheck,
    LucideTrash2,
    LucideUsersRound,
    PaginationComponent,
    SearchBarComponent,
    SkeletonLoaderComponent,
    TooltipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="admin-page">
      <header class="admin-page-header">
        <div class="admin-page-heading">
          <p class="admin-kicker">Accounts</p>
          <h2 class="admin-title">Users</h2>
          <p class="admin-description">Approve customers, restrict risky accounts, and keep admin access visible.</p>
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

      <dl class="admin-stat-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Total users</dt>
            <span class="admin-stat-icon" data-tone="info" aria-hidden="true">
              <svg lucideUsersRound class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ totalItems() }}</dd>
          <dd class="type-body-sm text-text-secondary">Registered accounts</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Active</dt>
            <span class="admin-stat-icon" data-tone="success" aria-hidden="true">
              <svg lucideShieldCheck class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ activeUserCount() }}</dd>
          <dd class="type-body-sm text-text-secondary">Loaded on this page</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Pending</dt>
            <span class="admin-stat-icon" data-tone="warning" aria-hidden="true">
              <svg lucideCheckCheck class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ pendingUserCount() }}</dd>
          <dd class="type-body-sm text-text-secondary">Awaiting approval</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Restricted</dt>
            <span class="admin-stat-icon" data-tone="error" aria-hidden="true">
              <svg lucideLockKeyhole class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ restrictedUserCount() }}</dd>
          <dd class="type-body-sm text-text-secondary">Access limited</dd>
        </div>
      </dl>

      @if (statusMessage()) {
        <app-alert-banner tone="success" [title]="'User updated'" [message]="statusMessage()" [dismissible]="true" (dismissed)="clearStatusMessage()" />
      }
      @if (errorMessage()) {
        <app-alert-banner tone="error" [title]="'User issue'" [message]="errorMessage()" [dismissible]="true" (dismissed)="clearErrorMessage()" />
      }

      @if (!isLoading() && users().length === 0) {
        <app-empty-state
          type="admin"
          [title]="'No users found'"
          message="Clear search or wait for new customer registrations."
          [action]="{ label: 'Clear search', variant: 'secondary' }"
          (actionPressed)="clearSearch()"
        />
      } @else {
        <section class="admin-panel" aria-labelledby="users-table-title">
          <div class="admin-panel-header">
            <div>
              <h3 id="users-table-title" class="admin-panel-title">User records</h3>
              <p class="admin-panel-copy">Sort, select, and apply account actions without leaving the list.</p>
            </div>
            @if (selectedIds().length) {
              <div class="admin-selected-bar">
                <p class="px-xs type-body-sm text-text-secondary">{{ selectedIds().length }} selected</p>
                @for (action of bulkActions; track action.id) {
                  <button class="min-h-touch-min rounded-md border-hairline border-border-default bg-surface-raised px-sm type-label-sm interactive-transition hover:bg-surface-subtle focus-visible:focus-ring" type="button" [disabled]="action.disabled" (click)="handleBulkAction(action)">
                    {{ action.label }}
                  </button>
                }
              </div>
            }
          </div>

          <div class="admin-table-wrap">
            @if (isLoading()) {
              <div class="p-md">
                <app-skeleton-loader shape="block" [count]="5" label="Loading users" />
              </div>
            } @else {
              <table class="admin-table admin-table-users">
                <caption class="sr-only">User management</caption>
                <thead>
                  <tr>
                    <th class="admin-table-select">
                      <app-checkbox label="Select all users" [labelHidden]="true" [checked]="allUsersSelected()" (checkedChange)="toggleAllUsers($event)" />
                    </th>
                    @for (column of displayColumns(); track column.id) {
                      <th [attr.aria-sort]="column.ariaSort">
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
                    <th class="admin-table-action">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of userRows(); track row.user.id) {
                    <tr>
                      <td class="admin-table-select">
                        <app-checkbox [label]="'Select ' + row.user.email" [labelHidden]="true" [checked]="row.selected" (checkedChange)="toggleUser(row.user.id, $event)" />
                      </td>
                      <td class="admin-table-primary-cell">
                        <div class="grid gap-2xs">
                          <span class="admin-table-title">{{ row.user.full_name }}</span>
                          <span class="admin-table-subtext">{{ row.user.id }}</span>
                        </div>
                      </td>
                      <td class="admin-table-token">{{ row.user.email }}</td>
                      <td>{{ row.user.phone ?? 'Not set' }}</td>
                      <td>
                        <app-badge variant="outline" [label]="row.user.role" />
                      </td>
                      <td>
                        <app-badge [tone]="row.statusTone" [label]="row.statusLabel" />
                      </td>
                      <td class="admin-table-date">{{ row.joinedDate }}</td>
                      <td class="admin-table-action">
                        <div class="admin-row-actions" role="group" [attr.aria-label]="'Actions for ' + row.user.email">
                          <app-tooltip content="Approve user">
                            <button class="admin-icon-action" data-tone="success" type="button" [attr.aria-label]="'Approve ' + row.user.email" (click)="handleRowAction(row.user.id, 'approve-user')">
                              <svg lucideCheckCheck class="size-icon-sm" aria-hidden="true"></svg>
                            </button>
                          </app-tooltip>
                          <app-tooltip content="Restrict user">
                            <button class="admin-icon-action" data-tone="warning" type="button" [attr.aria-label]="'Restrict ' + row.user.email" (click)="handleRowAction(row.user.id, 'restrict-user')">
                              <svg lucideLockKeyhole class="size-icon-sm" aria-hidden="true"></svg>
                            </button>
                          </app-tooltip>
                          <app-tooltip content="Delete user">
                            <button class="admin-icon-action" data-tone="danger" type="button" [attr.aria-label]="'Delete ' + row.user.email" (click)="handleRowAction(row.user.id, 'delete-user')">
                              <svg lucideTrash2 class="size-icon-sm" aria-hidden="true"></svg>
                            </button>
                          </app-tooltip>
                        </div>
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
  protected readonly activeUserCount = computed(() => this.users().filter((user) => user.status === 'active').length);
  protected readonly pendingUserCount = computed(() => this.users().filter((user) => user.status === 'pending_approval').length);
  protected readonly restrictedUserCount = computed(() => this.users().filter((user) => user.status === 'restricted').length);
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
      statusTone: statusTone(user.status),
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

  protected handleRowAction(userId: string, actionId: string): void {
    this.adminUsers.runUserAction(userId, actionId);
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

function statusTone(status: AdminUser['status']): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'active':
      return 'success';
    case 'pending_approval':
      return 'warning';
    case 'restricted':
    case 'soft_deleted':
      return 'error';
    default:
      return 'neutral';
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
