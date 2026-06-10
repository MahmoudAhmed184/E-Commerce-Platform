import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminService, AdminUser } from '../../services/admin.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-xl font-semibold text-slate-900">Users</h2>

      <!-- Search -->
      <div class="mt-4 flex gap-3">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          placeholder="Search by email or phone…"
          class="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="button"
          class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          (click)="load()">Search</button>
      </div>

      <app-error-message [message]="error()" />

      @if (isLoading()) {
        <div class="mt-10 flex justify-center"><app-loading-spinner size="md" /></div>
      } @else {
        <div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Email</th>
                <th class="px-4 py-3">Phone</th>
                <th class="px-4 py-3">Role</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (user of users(); track user.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-3 text-slate-900">{{ user.email }}</td>
                  <td class="px-4 py-3 text-slate-500">{{ user.phone ?? '—' }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class.bg-purple-100]="user.role === 'admin'"
                      [class.text-purple-700]="user.role === 'admin'"
                      [class.bg-slate-100]="user.role !== 'admin'"
                      [class.text-slate-600]="user.role !== 'admin'">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class.bg-green-100]="user.status === 'active'"
                      [class.text-green-700]="user.status === 'active'"
                      [class.bg-amber-100]="user.status === 'pending_approval'"
                      [class.text-amber-700]="user.status === 'pending_approval'"
                      [class.bg-red-100]="user.status === 'restricted' || user.status === 'soft_deleted'"
                      [class.text-red-700]="user.status === 'restricted' || user.status === 'soft_deleted'">
                      {{ user.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      @if (user.status === 'pending_approval') {
                        <button type="button" (click)="approve(user)"
                          class="text-xs font-medium text-green-600 hover:text-green-800">Approve</button>
                      }
                      @if (user.status === 'active') {
                        <button type="button" (click)="restrict(user)"
                          class="text-xs font-medium text-amber-600 hover:text-amber-800">Restrict</button>
                      }
                      @if (user.status === 'restricted' || user.status === 'soft_deleted') {
                        <button type="button" (click)="activate(user)"
                          class="text-xs font-medium text-green-600 hover:text-green-800">Activate</button>
                      }
                      @if (user.status !== 'soft_deleted') {
                        <button type="button" (click)="softDelete(user)"
                          class="text-xs font-medium text-red-500 hover:text-red-700">Delete</button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">No users found.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="mt-4 flex items-center gap-2 text-sm">
            <button type="button" [disabled]="currentPage() === 1"
              class="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-50"
              (click)="goToPage(currentPage() - 1)">← Prev</button>
            <span class="text-slate-600">Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button type="button" [disabled]="currentPage() === totalPages()"
              class="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-50"
              (click)="goToPage(currentPage() + 1)">Next →</button>
          </div>
        }
      }
    </div>
  `,
})
export class AdminUsersPage implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal('');
  protected readonly currentPage = signal(1);
  protected readonly totalCount = signal(0);
  protected readonly pageSize = 20;
  protected readonly totalPages = () => Math.ceil(this.totalCount() / this.pageSize) || 1;

  protected searchQuery = '';

  ngOnInit(): void { this.load(); }

  protected load(page = 1): void {
    this.error.set('');
    this.isLoading.set(true);
    this.currentPage.set(page);
    this.adminService
      .getUsers({ search: this.searchQuery || undefined, page })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => { this.users.set(res.results); this.totalCount.set(res.count); },
        error: () => this.error.set('Could not load users.'),
      });
  }

  protected goToPage(page: number): void { this.load(page); }

  protected approve(user: AdminUser): void {
    this.adminService.approveUser(user.id).subscribe({
      next: (updated) => this.updateUser(updated),
      error: () => this.error.set('Could not approve user.'),
    });
  }

  protected restrict(user: AdminUser): void {
    this.adminService.restrictUser(user.id).subscribe({
      next: (updated) => this.updateUser(updated),
      error: () => this.error.set('Could not restrict user.'),
    });
  }

  protected activate(user: AdminUser): void {
    this.adminService.activateUser(user.id).subscribe({
      next: (updated) => this.updateUser(updated),
      error: () => this.error.set('Could not activate user.'),
    });
  }

  protected softDelete(user: AdminUser): void {
    this.adminService.softDeleteUser(user.id).subscribe({
      next: (updated) => this.updateUser(updated),
      error: () => this.error.set('Could not delete user.'),
    });
  }

  private updateUser(updated: AdminUser): void {
    this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
  }
}
