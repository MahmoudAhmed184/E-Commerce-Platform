import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule, type ValidatorFn, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AlertDialogComponent } from '../../../../shared/components/alert-dialog/alert-dialog.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DropdownMenuComponent } from '../../../../shared/components/dropdown-menu/dropdown-menu.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import type { UiAction, UiMenuItem, UiTableColumn } from '../../../../shared/components/ui.types';
import { AdminService, type AdminCategory } from '../../../../core/services/admin/admin.service';
import { AdminWorkflowService, type AdminCategorySaveResult } from '../../services/admin-workflow/admin-workflow.service';

interface CategoryFormMode {
  eyebrow: string;
  title: string;
  submitLabel: string;
}

type CategoryForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
}>;

const requiredValidator: ValidatorFn = (control) => Validators.required(control);

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [AlertBannerComponent, AlertDialogComponent, ButtonComponent, DropdownMenuComponent, ReactiveFormsModule, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="grid gap-lg">
      <header class="grid gap-xs">
        <p class="type-label-sm text-text-muted">Admin</p>
        <h2 class="type-heading-xl text-text-primary">Categories</h2>
        <p class="type-body-md text-text-secondary">Maintain product departments used by customers to browse and filter the catalog.</p>
      </header>

      @if (statusMessage()) {
        <app-alert-banner tone="success" title="Category updated" [message]="statusMessage()" [dismissible]="true" (dismissed)="statusMessage.set('')" />
      }
      @if (formError()) {
        <app-alert-banner tone="error" title="Category issue" [message]="formError()" [dismissible]="true" (dismissed)="formError.set('')" />
      }

      <section class="grid gap-lg xl:grid-cols-[var(--ui-layout-admin-editor-grid)] xl:items-start">
        <section class="overflow-x-auto rounded-md border-hairline border-border-default bg-surface-raised shadow-xs" aria-labelledby="categories-table-title">
          <h3 id="categories-table-title" class="sr-only">Category management</h3>
          @if (isLoading()) {
            <div class="p-md">
              <app-skeleton-loader shape="block" [count]="5" label="Loading categories" />
            </div>
          } @else {
            <table class="w-full min-w-container-md border-collapse text-start">
              <caption class="sr-only">Category management</caption>
              <thead class="bg-surface-subtle text-text-secondary">
                <tr>
                  @for (column of columns; track column.id) {
                    <th class="p-sm text-start type-label-sm">{{ column.header }}</th>
                  }
                  <th class="p-sm text-end type-label-sm">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y-hairline divide-border-default">
                @for (category of sortedCategories(); track category.slug) {
                  <tr class="interactive-transition hover:bg-surface-subtle">
                    <td class="p-sm type-body-sm text-text-primary">{{ category.name }}</td>
                    <td class="p-sm type-body-sm text-text-primary">{{ category.slug }}</td>
                    <td class="p-sm type-body-sm text-text-primary">{{ category.description }}</td>
                    <td class="p-sm type-body-sm text-text-primary">{{ category.product_count }}</td>
                    <td class="p-sm text-end">
                      <app-dropdown-menu label="Row actions" [items]="rowActions" (selected)="handleRowAction(category.slug, $event)" />
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td class="p-xl text-center type-body-md text-text-muted" colspan="5">No rows to display.</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </section>

        <aside class="grid gap-md rounded-md border-hairline border-border-default bg-surface-raised p-md shadow-xs" aria-labelledby="category-form-title">
          <div>
            <p class="type-label-sm text-text-muted">{{ formMode().eyebrow }}</p>
            <h3 id="category-form-title" class="type-heading-lg text-text-primary">{{ formMode().title }}</h3>
          </div>

          <form class="grid gap-md" [formGroup]="categoryForm" (ngSubmit)="saveCategory()" novalidate>
            <label class="grid gap-xs type-label-md text-text-primary">
              Name
              <input
                class="min-h-control-md rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-text-primary focus-visible:focus-ring aria-invalid:border-border-error"
                type="text"
                [attr.aria-invalid]="nameAriaInvalid()"
                formControlName="name"
              />
            </label>

            <label class="grid gap-xs type-label-md text-text-primary">
              Description
              <textarea
                class="min-h-thumbnail-sm rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-text-primary focus-visible:focus-ring"
                formControlName="description"
              ></textarea>
            </label>

            <div class="flex flex-wrap gap-sm">
              <app-button type="submit" size="sm" [loading]="isSaving()">{{ formMode().submitLabel }}</app-button>
              @if (editingSlug()) {
                <app-button variant="secondary" size="sm" (pressed)="resetForm()">Cancel</app-button>
              }
            </div>
          </form>
        </aside>
      </section>

      <app-alert-dialog
        [open]="!!deleteSlug()"
        title="Delete category"
        description="Delete only categories that no longer contain products."
        [destructive]="true"
        [confirmAction]="deleteConfirmAction()"
        [cancelAction]="{ label: 'Cancel', variant: 'secondary' }"
        (confirmPressed)="confirmDelete()"
        (cancelPressed)="deleteSlug.set(null)"
        (closed)="deleteSlug.set(null)"
      >
        @if (deleteTarget(); as category) {
          <p>{{ deleteDialogMessage() }}</p>
        }
      </app-alert-dialog>
    </section>
  `,
})
export class AdminCategoriesPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly adminWorkflow = inject(AdminWorkflowService);

  protected readonly columns: readonly UiTableColumn[] = [
    { id: 'name', header: 'Name', sortable: true },
    { id: 'slug', header: 'Slug' },
    { id: 'description', header: 'Description' },
    { id: 'products', header: 'Products', sortable: true },
  ];
  protected readonly rowActions: readonly UiMenuItem[] = [
    { id: 'edit-category', label: 'Edit category' },
    { id: 'delete-category', label: 'Delete category', destructive: true },
  ];

  protected readonly categories = signal<readonly AdminCategory[]>([]);
  protected readonly editingSlug = signal<string | null>(null);
  protected readonly deleteSlug = signal<string | null>(null);
  protected readonly formError = signal('');
  protected readonly statusMessage = signal('');
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly categoryForm: CategoryForm = this.fb.group({
    name: this.fb.control('', { validators: [requiredValidator] }),
    description: this.fb.control(''),
  });

  protected readonly sortedCategories = computed(() => [...this.categories()].sort((left, right) => left.name.localeCompare(right.name)));
  protected readonly deleteTarget = computed(() => this.categories().find((category) => category.slug === this.deleteSlug()) ?? null);
  protected readonly editingName = computed(() => this.categories().find((category) => category.slug === this.editingSlug())?.name ?? '');
  protected readonly formMode = computed<CategoryFormMode>(() => ({
    eyebrow: this.editingSlug() ? 'Edit category' : 'New category',
    title: this.editingName() || 'Create category',
    submitLabel: this.editingSlug() ? 'Update category' : 'Create category',
  }));
  protected readonly nameAriaInvalid = computed(() => (this.formError() ? 'true' : null));
  protected readonly deleteConfirmAction = computed<UiAction>(() => ({
    label: 'Delete category',
    variant: 'danger',
    disabled: (this.deleteTarget()?.product_count ?? 0) !== 0,
    loading: this.isSaving(),
  }));
  protected readonly deleteDialogMessage = computed(() =>
    this.deleteTarget()?.product_count === 0
      ? 'This category has no products and can be deleted.'
      : 'Move products out of this category before deleting it.',
  );

  ngOnInit(): void {
    this.loadCategories();
  }

  protected handleRowAction(categorySlug: string, action: UiMenuItem): void {
    const category = this.categories().find((item) => item.slug === categorySlug);
    if (!category) {
      return;
    }

    if (action.id === 'edit-category') {
      this.editingSlug.set(category.slug);
      this.categoryForm.setValue({ name: category.name, description: category.description });
    } else if (action.id === 'delete-category') {
      this.deleteSlug.set(category.slug);
    }
  }

  protected saveCategory(): void {
    this.formError.set('');
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.formError.set('Category name is required.');
      return;
    }

    const formValue = this.categoryForm.getRawValue();
    this.isSaving.set(true);
    this.adminWorkflow
      .saveCategory(this.editingSlug(), formValue.name, formValue.description)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((result) => this.applyCategorySave(result));
  }

  protected resetForm(): void {
    this.editingSlug.set(null);
    this.categoryForm.setValue({ name: '', description: '' });
    this.formError.set('');
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (target?.product_count !== 0) {
      return;
    }

    this.isSaving.set(true);
    this.adminService
      .deleteCategory(target.slug)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteSlug.set(null);
          this.statusMessage.set('Category deleted.');
          this.loadCategories();
        },
        error: () => this.formError.set('The category could not be deleted.'),
      });
  }

  private loadCategories(): void {
    this.isLoading.set(true);
    this.adminService
      .getAdminCategories({ page: 1, page_size: 100 })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => this.categories.set(response.results),
        error: () => this.formError.set('Categories could not be loaded.'),
      });
  }

  private applyCategorySave(result: AdminCategorySaveResult): void {
    if (result.status === 'invalid' || result.status === 'failed') {
      this.formError.set(result.message);
      return;
    }

    this.statusMessage.set(result.message);
    this.resetForm();
    this.loadCategories();
  }
}
