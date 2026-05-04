import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminService, AdminCategory } from '../../services/admin.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

type CategoryForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
}>;

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [ReactiveFormsModule, LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-6">
      <!-- Category list -->
      <div class="flex-1">
        <h2 class="text-xl font-semibold text-slate-900">Categories</h2>
        <app-error-message [message]="error()" />

        @if (isLoading()) {
          <div class="mt-6 flex justify-center"><app-loading-spinner size="md" /></div>
        } @else {
          <div class="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-3">Name</th>
                  <th class="px-4 py-3">Slug</th>
                  <th class="px-4 py-3">Products</th>
                  <th class="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (cat of categories(); track cat.id) {
                  <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 font-medium text-slate-900">{{ cat.name }}</td>
                    <td class="px-4 py-3 font-mono text-slate-500">{{ cat.slug }}</td>
                    <td class="px-4 py-3 text-slate-600">{{ cat.product_count }}</td>
                    <td class="px-4 py-3">
                      <div class="flex gap-2">
                        <button type="button" (click)="startEdit(cat)"
                          class="text-xs font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                        <button type="button" (click)="deleteCategory(cat)"
                          class="text-xs font-medium text-red-500 hover:text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">No categories yet.</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Create / Edit form -->
      <div class="w-72 shrink-0">
        <h3 class="text-base font-semibold text-slate-800">
          {{ editingId() ? 'Edit Category' : 'New Category' }}
        </h3>
        <form class="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <app-error-message [message]="formError()" />
          <div>
            <label for="cat-name" class="block text-sm font-medium text-slate-700">Name</label>
            <input id="cat-name" type="text" formControlName="name"
              class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label for="cat-desc" class="block text-sm font-medium text-slate-700">Description</label>
            <textarea id="cat-desc" rows="3" formControlName="description"
              class="mt-1 block w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
          </div>
          <div class="flex gap-2">
            <button type="submit"
              class="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-70"
              [disabled]="submitting()">
              @if (submitting()) { Saving… } @else { {{ editingId() ? 'Update' : 'Create' }} }
            </button>
            @if (editingId()) {
              <button type="button" (click)="cancelEdit()"
                class="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            }
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AdminCategoriesPage implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly formError = signal('');
  protected readonly editingId = signal<number | null>(null);

  protected readonly form: CategoryForm = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.isLoading.set(true);
    this.adminService
      .getAdminCategories()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (cats) => this.categories.set(cats),
        error: () => this.error.set('Could not load categories.'),
      });
  }

  protected submit(): void {
    this.formError.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const { name, description } = this.form.getRawValue();
    this.submitting.set(true);
    const id = this.editingId();
    const req = id
      ? this.adminService.updateCategory(id, { name, description: description || undefined })
      : this.adminService.createCategory({ name, description: description || undefined });

    req.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => { this.cancelEdit(); this.load(); },
      error: () => this.formError.set('Could not save category.'),
    });
  }

  protected startEdit(cat: AdminCategory): void {
    this.editingId.set(cat.id);
    this.form.setValue({ name: cat.name, description: cat.description });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  protected deleteCategory(cat: AdminCategory): void {
    this.adminService.deleteCategory(cat.id).subscribe({
      next: () => this.categories.update((list) => list.filter((c) => c.id !== cat.id)),
      error: () => this.error.set('Could not delete category.'),
    });
  }
}
