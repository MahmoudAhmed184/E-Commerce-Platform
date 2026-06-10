import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule, type ValidatorFn, Validators } from '@angular/forms';
import { LucideEyeOff, LucideFolderTree, LucidePackage, LucidePencil, LucideTags, LucideTriangleAlert } from '@lucide/angular';
import { finalize } from 'rxjs';

import { AlertDialogComponent } from '../../../../shared/components/alert-dialog/alert-dialog.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TooltipComponent } from '../../../../shared/components/tooltip/tooltip.component';
import type { UiAction, UiTableColumn } from '../../../../shared/components/ui.types';
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
  isActive: FormControl<boolean>;
}>;

const requiredValidator: ValidatorFn = (control) => Validators.required(control);

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    AlertBannerComponent,
    AlertDialogComponent,
    BadgeComponent,
    ButtonComponent,
    LucideEyeOff,
    LucideFolderTree,
    LucidePackage,
    LucidePencil,
    LucideTags,
    LucideTriangleAlert,
    ReactiveFormsModule,
    SkeletonLoaderComponent,
    TooltipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="admin-page">
      <header class="admin-page-header">
        <div class="admin-page-heading">
          <p class="admin-kicker">Taxonomy</p>
          <h2 class="admin-title">Categories</h2>
          <p class="admin-description">Maintain product departments used by customers to browse and filter the catalog.</p>
        </div>
      </header>

      <dl class="admin-stat-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Categories</dt>
            <span class="admin-stat-icon" data-tone="info" aria-hidden="true">
              <svg lucideTags class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ categories().length }}</dd>
          <dd class="type-body-sm text-text-secondary">Browse departments</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Assigned products</dt>
            <span class="admin-stat-icon" data-tone="success" aria-hidden="true">
              <svg lucidePackage class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ assignedProductCount() }}</dd>
          <dd class="type-body-sm text-text-secondary">Across all categories</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Empty</dt>
            <span class="admin-stat-icon" data-tone="warning" aria-hidden="true">
              <svg lucideTriangleAlert class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ emptyCategoryCount() }}</dd>
          <dd class="type-body-sm text-text-secondary">Can be cleaned up</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Editing</dt>
            <span class="admin-stat-icon" data-tone="info" aria-hidden="true">
              <svg lucideFolderTree class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ editingSlug() ? '1' : '0' }}</dd>
          <dd class="type-body-sm text-text-secondary">Active form target</dd>
        </div>
      </dl>

      @if (statusMessage()) {
        <app-alert-banner tone="success" [title]="'Category updated'" [message]="statusMessage()" [dismissible]="true" (dismissed)="statusMessage.set('')" />
      }
      @if (formError()) {
        <app-alert-banner tone="error" [title]="'Category issue'" [message]="formError()" [dismissible]="true" (dismissed)="formError.set('')" />
      }

      <section class="admin-editor-grid">
        <section class="admin-panel" aria-labelledby="categories-table-title">
          <div class="admin-panel-header">
            <div>
              <h3 id="categories-table-title" class="admin-panel-title">Category management</h3>
              <p class="admin-panel-copy">Keep browse departments clear, named, and tied to active product inventory.</p>
            </div>
            <app-badge tone="info" [label]="categories().length + ' categories'" />
          </div>
          <div class="admin-table-wrap">
            @if (isLoading()) {
              <div class="p-md">
                <app-skeleton-loader shape="block" [count]="5" label="Loading categories" />
              </div>
            } @else {
              <table class="admin-table admin-table-categories">
                <caption class="sr-only">Category management</caption>
                <thead>
                  <tr>
                    @for (column of columns; track column.id) {
                      <th>{{ column.header }}</th>
                    }
                    <th class="admin-table-action">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (category of sortedCategories(); track category.slug) {
                    <tr>
                      <td class="admin-table-primary-cell">
                        <div class="grid gap-2xs">
                          <span class="admin-table-title">{{ category.name }}</span>
                          <span class="admin-table-subtext">{{ category.slug }}</span>
                        </div>
                      </td>
                      <td class="admin-table-token">{{ category.slug }}</td>
                      <td class="admin-table-description">{{ category.description || 'No description' }}</td>
                      <td class="admin-table-status"><app-badge [tone]="category.product_count ? 'success' : 'warning'" [label]="category.product_count + ' products'" /></td>
                      <td class="admin-table-status"><app-badge [tone]="category.is_active ? 'success' : 'warning'" [label]="category.is_active ? 'active' : 'hidden'" /></td>
                      <td class="admin-table-action">
                        <div class="admin-row-actions" role="group" [attr.aria-label]="'Actions for ' + category.name">
                          <app-tooltip content="Edit category">
                            <button class="admin-icon-action" data-tone="info" type="button" [attr.aria-label]="'Edit ' + category.name" (click)="handleRowAction(category.slug, 'edit-category')">
                              <svg lucidePencil class="size-icon-sm" aria-hidden="true"></svg>
                            </button>
                          </app-tooltip>
                          <app-tooltip content="Deactivate category">
                            <button class="admin-icon-action" data-tone="danger" type="button" [attr.aria-label]="'Deactivate ' + category.name" (click)="handleRowAction(category.slug, 'delete-category')">
                              <svg lucideEyeOff class="size-icon-sm" aria-hidden="true"></svg>
                            </button>
                          </app-tooltip>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td class="p-xl text-center type-body-md text-text-muted" colspan="6">No rows to display.</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </section>

        <aside class="admin-form-panel" aria-labelledby="category-form-title">
          <div>
            <p class="type-label-sm text-text-muted">{{ formMode().eyebrow }}</p>
            <h3 id="category-form-title" class="type-heading-lg text-text-primary">{{ formMode().title }}</h3>
          </div>

          <form class="admin-form" [formGroup]="categoryForm" (ngSubmit)="saveCategory()" novalidate>
            <label class="admin-field">
              Name
              <input
                class="admin-input"
                type="text"
                [attr.aria-invalid]="nameAriaInvalid()"
                formControlName="name"
              />
            </label>

            <label class="admin-field">
              Description
              <textarea
                class="admin-textarea"
                formControlName="description"
              ></textarea>
            </label>

            <label class="admin-checkrow">
              <input class="size-icon-md accent-surface-primary focus-visible:focus-ring" type="checkbox" formControlName="isActive" />
              Active category
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
        [title]="'Deactivate category'"
        description="Hide this category from customer browsing without deleting catalog history."
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
    { id: 'status', header: 'Status', sortable: true },
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
    isActive: this.fb.control(true),
  });

  protected readonly sortedCategories = computed(() => [...this.categories()].sort((left, right) => left.name.localeCompare(right.name)));
  protected readonly assignedProductCount = computed(() => this.categories().reduce((total, category) => total + category.product_count, 0));
  protected readonly emptyCategoryCount = computed(() => this.categories().filter((category) => category.product_count === 0).length);
  protected readonly deleteTarget = computed(() => this.categories().find((category) => category.slug === this.deleteSlug()) ?? null);
  protected readonly editingName = computed(() => this.categories().find((category) => category.slug === this.editingSlug())?.name ?? '');
  protected readonly formMode = computed<CategoryFormMode>(() => ({
    eyebrow: this.editingSlug() ? 'Edit category' : 'New category',
    title: this.editingName() || 'Create category',
    submitLabel: this.editingSlug() ? 'Update category' : 'Create category',
  }));
  protected readonly nameAriaInvalid = computed(() => (this.formError() ? 'true' : null));
  protected readonly deleteConfirmAction = computed<UiAction>(() => ({
    label: 'Deactivate category',
    variant: 'danger',
    loading: this.isSaving(),
  }));
  protected readonly deleteDialogMessage = computed(() =>
    this.deleteTarget()?.product_count
      ? 'Assigned products will be hidden from public product listings until moved to an active category or this category is reactivated.'
      : 'This category will be hidden from public category filters.',
  );

  ngOnInit(): void {
    this.loadCategories();
  }

  protected handleRowAction(categorySlug: string, actionId: string): void {
    const category = this.categories().find((item) => item.slug === categorySlug);
    if (!category) {
      return;
    }

    if (actionId === 'edit-category') {
      this.editingSlug.set(category.slug);
      this.categoryForm.setValue({ name: category.name, description: category.description, isActive: category.is_active });
    } else if (actionId === 'delete-category') {
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
      .saveCategory(this.editingSlug(), formValue.name, formValue.description, formValue.isActive)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((result) => this.applyCategorySave(result));
  }

  protected resetForm(): void {
    this.editingSlug.set(null);
    this.categoryForm.setValue({ name: '', description: '', isActive: true });
    this.formError.set('');
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) {
      return;
    }

    this.isSaving.set(true);
    this.adminService
      .deleteCategory(target.slug)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.deleteSlug.set(null);
          this.statusMessage.set('Category deactivated.');
          this.loadCategories();
        },
        error: () => this.formError.set('The category could not be deactivated.'),
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
