import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 transition-colors">Admin Profile</h2>
      
      <div class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <!-- Header background -->
        <div class="h-32 bg-indigo-600 dark:bg-indigo-900/50"></div>
        
        <div class="px-8 pb-8">
          <!-- Avatar -->
          <div class="relative -mt-16 mb-6">
            <div class="h-32 w-32 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-4xl font-bold text-indigo-700 dark:text-indigo-300 shadow-md">
              {{ userInitials() }}
            </div>
            
            <span class="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 bg-green-500"></span>
          </div>
          
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ currentUser()?.full_name || 'Admin User' }}</h3>
              <p class="text-slate-500 dark:text-slate-400 mt-1">{{ currentUser()?.email }}</p>
            </div>
            <span class="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-sm font-medium text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              System Administrator
            </span>
          </div>
          
          <div class="border-t border-slate-100 dark:border-slate-800 pt-8">
            <dl class="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div class="sm:col-span-1">
                <dt class="text-sm font-medium text-slate-500 dark:text-slate-400">Account Status</dt>
                <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Active
                  </span>
                </dd>
              </div>
              
              <div class="sm:col-span-1">
                <dt class="text-sm font-medium text-slate-500 dark:text-slate-400">Joined Date</dt>
                <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100">{{ (currentUser()?.created_at | date:'mediumDate') || 'N/A' }}</dd>
              </div>
              
              <div class="sm:col-span-1">
                <dt class="text-sm font-medium text-slate-500 dark:text-slate-400">Role Level</dt>
                <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100">Super Admin</dd>
              </div>
              
              <div class="sm:col-span-1">
                <dt class="text-sm font-medium text-slate-500 dark:text-slate-400">Department</dt>
                <dd class="mt-1 text-sm text-slate-900 dark:text-slate-100">Management</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminProfilePage {
  private readonly authService = inject(AuthService);
  protected readonly currentUser = this.authService.currentUser;

  protected userInitials(): string {
    const name = this.currentUser()?.full_name;
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
