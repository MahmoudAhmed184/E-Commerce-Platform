import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule, type ValidatorFn, Validators } from '@angular/forms';
import { LucideEye, LucideEyeOff, LucidePackage, LucidePencil, LucideTags, LucideTriangleAlert } from '@lucide/angular';
import { finalize, forkJoin } from 'rxjs';

import { AlertDialogComponent } from '../../../../shared/components/alert-dialog/alert-dialog.component';
import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { FileUploadComponent, type UploadFileItem } from '../../../../shared/components/file-upload/file-upload.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TooltipComponent } from '../../../../shared/components/tooltip/tooltip.component';
import type { UiAction, UiMenuItem, UiOption, UiSortState, UiTableColumn } from '../../../../shared/components/ui.types';
import { AdminService, type AdminCategory, type AdminProduct } from '../../../../core/services/admin/admin.service';
import {
  AdminWorkflowService,
  type AdminProductDraft,
  type AdminProductSubmitResult,
  type AdminWorkflowResult,
} from '../../services/admin-workflow/admin-workflow.service';

interface ProductTableColumn extends UiTableColumn {
  ariaSort: 'ascending' | 'descending' | 'none' | null;
  sortIcon: '↑' | '↓' | '';
}

interface ProductTableRow {
  product: AdminProduct;
  selected: boolean;
  priceLabel: string;
  availabilityLabel: string;
  availabilityTone: 'success' | 'warning' | 'error';
  visibilityLabel: string;
  visibilityTone: 'success' | 'warning';
}

interface ProductFormMode {
  eyebrow: string;
  title: string;
  submitLabel: string;
}

type ProductForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  categoryId: FormControl<string>;
  price: FormControl<string>;
  stock: FormControl<number>;
  isActive: FormControl<boolean>;
}>;

const requiredValidator: ValidatorFn = (control) => Validators.required(control);
const minZeroValidator: ValidatorFn = (control) => Validators.min(0)(control);

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    AlertDialogComponent,
    AlertBannerComponent,
    BadgeComponent,
    ButtonComponent,
    CheckboxComponent,
    EmptyStateComponent,
    FileUploadComponent,
    LucideEye,
    LucideEyeOff,
    LucidePackage,
    LucidePencil,
    LucideTags,
    LucideTriangleAlert,
    PaginationComponent,
    ReactiveFormsModule,
    SearchBarComponent,
    SkeletonLoaderComponent,
    TooltipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="admin-page">
      <header class="admin-page-header">
        <div class="admin-page-heading">
          <p class="admin-kicker">Catalog</p>
          <h2 class="admin-title">Products</h2>
          <p class="admin-description">Maintain product content, pricing, stock levels, visibility, and images for the live catalog.</p>
        </div>
        <app-search-bar
          scope="Product"
          placeholder="Search products"
          [query]="query()"
          [resultCount]="filteredProducts().length"
          [suggestions]="[]"
          [loading]="isLoading()"
          (queryChange)="query.set($event)"
          (submitted)="page.set(1)"
          (cleared)="clearSearch()"
        />
      </header>

      <dl class="admin-stat-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Products</dt>
            <span class="admin-stat-icon" data-tone="info" aria-hidden="true">
              <svg lucidePackage class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ products().length }}</dd>
          <dd class="type-body-sm text-text-secondary">Loaded catalog items</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Visible</dt>
            <span class="admin-stat-icon" data-tone="success" aria-hidden="true">
              <svg lucideEye class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ activeProductCount() }}</dd>
          <dd class="type-body-sm text-text-secondary">Shown to customers</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Low stock</dt>
            <span class="admin-stat-icon" data-tone="warning" aria-hidden="true">
              <svg lucideTriangleAlert class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ lowStockCount() }}</dd>
          <dd class="type-body-sm text-text-secondary">Five units or fewer</dd>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card-row">
            <dt class="type-label-sm text-text-muted">Categories</dt>
            <span class="admin-stat-icon" data-tone="info" aria-hidden="true">
              <svg lucideTags class="size-icon-sm"></svg>
            </span>
          </div>
          <dd class="admin-stat-value">{{ categories().length }}</dd>
          <dd class="type-body-sm text-text-secondary">Available departments</dd>
        </div>
      </dl>

      @if (statusMessage()) {
        <app-alert-banner tone="success" [title]="'Product updated'" [message]="statusMessage()" [dismissible]="true" (dismissed)="statusMessage.set('')" />
      }
      @if (errorMessage()) {
        <app-alert-banner tone="error" [title]="'Product issue'" [message]="errorMessage()" [dismissible]="true" (dismissed)="errorMessage.set('')" />
      }

      @defer (on idle) {
        <section class="admin-editor-grid">
          <div class="grid gap-md">
            @if (!isLoading() && filteredProducts().length === 0) {
              <app-empty-state
                type="admin"
                [title]="'No products found'"
                message="Clear the search or create a product for the live catalog."
                [action]="{ label: 'Clear search', variant: 'secondary' }"
                (actionPressed)="clearSearch()"
              />
            } @else {
              <section class="admin-panel" aria-labelledby="products-table-title">
                <div class="admin-panel-header">
                  <div>
                    <h3 id="products-table-title" class="admin-panel-title">Product records</h3>
                    <p class="admin-panel-copy">Edit visibility, pricing, stock, and images from the same workspace.</p>
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
                      <app-skeleton-loader shape="block" [count]="5" label="Loading products" />
                    </div>
                  } @else {
                    <table class="admin-table admin-table-products">
                      <caption class="sr-only">Product management</caption>
                      <thead>
                        <tr>
                          <th class="admin-table-select">
                            <app-checkbox label="Select all products" [labelHidden]="true" [checked]="allVisibleProductsSelected()" (checkedChange)="toggleAllVisibleProducts($event)" />
                          </th>
                          @for (column of displayColumns(); track column.id) {
                            <th
                              [attr.aria-sort]="column.ariaSort"
                              [class.admin-table-number]="column.id === 'price' || column.id === 'stock'"
                              [class.admin-table-status]="column.id === 'availability' || column.id === 'visibility'"
                              [class.admin-table-category-cell]="column.id === 'category'"
                            >
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
                        @for (row of productRows(); track row.product.slug) {
                          <tr [class.opacity-disabled]="!row.product.is_active">
                            <td class="admin-table-select">
                              <app-checkbox [label]="'Select ' + row.product.name" [labelHidden]="true" [checked]="row.selected" (checkedChange)="toggleProduct(row.product.slug, $event)" />
                            </td>
                            <td class="admin-table-primary-cell">
                              <div class="grid gap-2xs">
                                <span class="admin-table-title">{{ row.product.name }}</span>
                                <span class="admin-table-subtext">{{ row.product.slug }}</span>
                              </div>
                            </td>
                            <td class="admin-table-category-cell">{{ row.product.category_name }}</td>
                            <td class="admin-table-number">{{ row.priceLabel }}</td>
                            <td class="admin-table-number">{{ row.product.stock_quantity }}</td>
                            <td class="admin-table-status"><app-badge [tone]="row.availabilityTone" [label]="row.availabilityLabel" /></td>
                            <td class="admin-table-status"><app-badge [tone]="row.visibilityTone" [label]="row.visibilityLabel" /></td>
                            <td class="admin-table-action">
                              <div class="admin-row-actions" role="group" [attr.aria-label]="'Actions for ' + row.product.name">
                                <app-tooltip content="Edit product">
                                  <button class="admin-icon-action" data-tone="info" type="button" [attr.aria-label]="'Edit ' + row.product.name" (click)="handleRowAction(row.product.slug, 'edit-product')">
                                    <svg lucidePencil class="size-icon-sm" aria-hidden="true"></svg>
                                  </button>
                                </app-tooltip>
                                <app-tooltip [content]="row.product.is_active ? 'Hide product' : 'Show product'">
                                  <button class="admin-icon-action" [attr.data-tone]="row.product.is_active ? 'warning' : 'success'" type="button" [attr.aria-label]="(row.product.is_active ? 'Hide ' : 'Show ') + row.product.name" (click)="handleRowAction(row.product.slug, 'toggle-product-visibility')">
                                    @if (row.product.is_active) {
                                      <svg lucideEyeOff class="size-icon-sm" aria-hidden="true"></svg>
                                    } @else {
                                      <svg lucideEye class="size-icon-sm" aria-hidden="true"></svg>
                                    }
                                  </button>
                                </app-tooltip>
                                <app-tooltip content="Deactivate product">
                                  <button class="admin-icon-action" data-tone="danger" type="button" [attr.aria-label]="'Deactivate ' + row.product.name" (click)="handleRowAction(row.product.slug, 'delete-product')">
                                    <svg lucideEyeOff class="size-icon-sm" aria-hidden="true"></svg>
                                  </button>
                                </app-tooltip>
                              </div>
                            </td>
                          </tr>
                        } @empty {
                          <tr>
                            <td class="p-xl text-center type-body-md text-text-muted" colspan="8">No product rows to display.</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  }
                </div>
              </section>

              <app-pagination [page]="page()" [pageSize]="pageSize" [totalItems]="filteredProducts().length" (pageChange)="page.set($event)" />
            }
          </div>

          <aside class="admin-form-panel" aria-labelledby="product-editor-title">
          <div class="flex flex-wrap items-start justify-between gap-sm">
            <div>
              <p class="type-label-sm text-text-muted">{{ productFormMode().eyebrow }}</p>
              <h3 id="product-editor-title" class="type-heading-lg text-text-primary">{{ productFormMode().title }}</h3>
            </div>
            @if (editingSlug()) {
              <app-button variant="secondary" size="sm" (pressed)="startCreate()">New product</app-button>
            }
          </div>

          <form class="admin-form" [formGroup]="productForm" (ngSubmit)="saveProduct()" novalidate>
            <label class="admin-field">
              Name
              <input class="admin-input" type="text" formControlName="name" [attr.aria-invalid]="fieldErrors()['name'] ? 'true' : null" />
              @if (fieldErrors()['name']) {
                <span class="type-body-sm text-text-error">{{ fieldErrors()['name'] }}</span>
              }
            </label>

            <label class="admin-field">
              Description
              <textarea class="admin-textarea" formControlName="description" [attr.aria-invalid]="fieldErrors()['description'] ? 'true' : null"></textarea>
              @if (fieldErrors()['description']) {
                <span class="type-body-sm text-text-error">{{ fieldErrors()['description'] }}</span>
              }
            </label>

            <label class="admin-field">
              Category
              <select class="admin-select" formControlName="categoryId" [attr.aria-busy]="isLoading()" [attr.aria-invalid]="fieldErrors()['category_id'] ? 'true' : null">
                <option value="" disabled>Select category</option>
                @for (option of categoryOptions(); track option.value) {
                  <option [value]="option.value" [disabled]="option.disabled">{{ option.label }}</option>
                } @empty {
                  <option value="" disabled>No categories available</option>
                }
              </select>
              @if (fieldErrors()['category_id']) {
                <span class="type-body-sm text-text-error">{{ fieldErrors()['category_id'] }}</span>
              }
            </label>

            <div class="grid gap-md md:grid-cols-2">
              <label class="admin-field">
                Price
                <input class="admin-input" type="number" min="0" formControlName="price" [attr.aria-invalid]="fieldErrors()['price'] ? 'true' : null" />
                @if (fieldErrors()['price']) {
                  <span class="type-body-sm text-text-error">{{ fieldErrors()['price'] }}</span>
                }
              </label>
              <label class="admin-field">
                Stock
                <input class="admin-input" type="number" min="0" formControlName="stock" [attr.aria-invalid]="fieldErrors()['stock'] ? 'true' : null" />
                @if (fieldErrors()['stock']) {
                  <span class="type-body-sm text-text-error">{{ fieldErrors()['stock'] }}</span>
                }
              </label>
            </div>

            <label class="admin-checkrow">
              <input class="size-icon-md accent-surface-primary focus-visible:focus-ring" type="checkbox" formControlName="isActive" />
              Active product
            </label>

            <div class="flex flex-wrap gap-sm">
              <app-button type="submit" [loading]="isSaving()">{{ productFormMode().submitLabel }}</app-button>
              @if (editingSlug()) {
                <app-button variant="secondary" (pressed)="resetForm()">Cancel</app-button>
              }
            </div>
          </form>

          <div class="grid gap-sm border-t-hairline border-border-default pt-md">
            <div>
              <p class="type-label-sm text-text-muted">Product images</p>
              <h4 class="type-heading-sm text-text-primary">Upload images</h4>
            </div>

            <app-file-upload [files]="uploadFiles()" [primaryId]="primaryUploadId()" (filesChange)="uploadFiles.set($event)" (primaryChanged)="primaryUploadId.set($event)" />

            <div class="flex flex-wrap gap-sm">
              <app-button
                size="sm"
                [disabled]="uploadDisabled()"
                [loading]="isUploadingImages()"
                (pressed)="uploadImages()"
              >
                Upload selected images
              </app-button>
              @if (!selectedProduct()) {
                <p class="type-body-sm text-text-muted">Save or select a product before uploading images.</p>
              }
            </div>
          </div>
          </aside>
        </section>
      } @placeholder {
        <section class="admin-editor-grid" aria-label="Loading product workspace">
          <app-skeleton-loader shape="block" [count]="6" label="Loading product workspace" />
        </section>
      }

      <app-alert-dialog
        [open]="!!deleteProductSlug()"
        [title]="'Deactivate product'"
        description="Remove the product from the live catalog while preserving historical order records."
        [destructive]="true"
        [confirmAction]="deleteConfirmAction()"
        [cancelAction]="{ label: 'Cancel', variant: 'secondary' }"
        (confirmPressed)="confirmDelete()"
        (cancelPressed)="deleteProductSlug.set(null)"
        (closed)="deleteProductSlug.set(null)"
      />
    </section>
  `,
})
export class AdminProductsPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly adminWorkflow = inject(AdminWorkflowService);

  protected readonly pageSize = 10;
  protected readonly columns: readonly UiTableColumn[] = [
    { id: 'name', header: 'Name', sortable: true },
    { id: 'category', header: 'Category', sortable: true },
    { id: 'price', header: 'Price', sortable: true },
    { id: 'stock', header: 'Stock', sortable: true },
    { id: 'availability', header: 'Availability', sortable: true },
    { id: 'visibility', header: 'Visibility', sortable: true },
  ];
  protected readonly bulkActions: readonly UiMenuItem[] = [
    { id: 'hide-selected-products', label: 'Hide selected' },
    { id: 'show-selected-products', label: 'Show selected' },
  ];

  protected readonly products = signal<readonly AdminProduct[]>([]);
  protected readonly categories = signal<readonly AdminCategory[]>([]);
  protected readonly query = signal('');
  protected readonly sort = signal<UiSortState | null>({ columnId: 'name', direction: 'asc' });
  protected readonly page = signal(1);
  protected readonly selectedIds = signal<readonly string[]>([]);
  protected readonly editingSlug = signal<string | null>(null);
  protected readonly deleteProductSlug = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string | undefined>>({});
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly uploadFiles = signal<readonly UploadFileItem[]>([]);
  protected readonly primaryUploadId = signal<string | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isUploadingImages = signal(false);
  protected readonly productForm: ProductForm = this.fb.group({
    name: this.fb.control('', { validators: [requiredValidator] }),
    description: this.fb.control(''),
    categoryId: this.fb.control('', { validators: [requiredValidator] }),
    price: this.fb.control('0.00', { validators: [requiredValidator] }),
    stock: this.fb.control(0, { validators: [minZeroValidator] }),
    isActive: this.fb.control(true),
  });

  protected readonly categoryOptions = computed<readonly UiOption[]>(() =>
    this.categories().map((category) => ({
      label: category.name,
      value: String(category.id),
      helper: category.description,
    })),
  );
  protected readonly filteredProducts = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filtered = this.products().filter((product) => !query || `${product.name} ${product.category_name}`.toLowerCase().includes(query));
    return sortProducts(filtered, this.sort());
  });
  protected readonly visibleProducts = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });
  protected readonly activeProductCount = computed(() => this.products().filter((product) => product.is_active).length);
  protected readonly lowStockCount = computed(() => this.products().filter((product) => product.stock_quantity <= 5).length);
  protected readonly allVisibleProductsSelected = computed(() => this.visibleProducts().length > 0 && this.visibleProducts().every((product) => this.selectedIds().includes(product.slug)));
  protected readonly selectedProduct = computed(() => this.products().find((product) => product.slug === this.editingSlug()) ?? null);
  protected readonly productFormMode = computed<ProductFormMode>(() => ({
    eyebrow: this.editingSlug() ? 'Edit product' : 'New product',
    title: this.selectedProduct()?.name ?? 'Create product',
    submitLabel: this.editingSlug() ? 'Save product' : 'Create product',
  }));
  protected readonly uploadDisabled = computed(() => !this.selectedProduct() || this.uploadFiles().length === 0);
  protected readonly deleteConfirmAction = computed<UiAction>(() => ({ label: 'Deactivate product', variant: 'danger', loading: this.isSaving() }));
  protected readonly displayColumns = computed<readonly ProductTableColumn[]>(() =>
    this.columns.map((column) => ({
      ...column,
      ariaSort: columnAriaSort(column, this.sort()),
      sortIcon: columnSortIcon(column, this.sort()),
    })),
  );
  protected readonly productRows = computed<readonly ProductTableRow[]>(() =>
    this.visibleProducts().map((product) => ({
      product,
      selected: this.selectedIds().includes(product.slug),
      priceLabel: currencyValue(product.price),
      availabilityLabel: availabilityLabel(product.stock_quantity),
      availabilityTone: availabilityTone(product.stock_quantity),
      visibilityLabel: product.is_active ? 'active' : 'hidden',
      visibilityTone: product.is_active ? 'success' : 'warning',
    })),
  );

  ngOnInit(): void {
    this.loadData();
  }

  protected clearSearch(): void {
    this.query.set('');
    this.page.set(1);
  }

  protected startCreate(): void {
    this.resetForm();
  }

  protected handleRowAction(productSlug: string, actionId: string): void {
    const product = this.products().find((item) => item.slug === productSlug);
    if (!product) {
      return;
    }

    if (actionId === 'edit-product') {
      this.hydrateForm(product);
    } else if (actionId === 'toggle-product-visibility') {
      this.toggleVisibility([productSlug]);
    } else if (actionId === 'delete-product') {
      this.deleteProductSlug.set(productSlug);
    }
  }

  protected handleBulkAction(action: UiMenuItem): void {
    const ids = this.selectedIds();
    if (!ids.length) {
      return;
    }

    if (action.id === 'hide-selected-products') {
      this.toggleVisibility(ids, false);
    } else if (action.id === 'show-selected-products') {
      this.toggleVisibility(ids, true);
    }
  }

  protected sortBy(column: UiTableColumn): void {
    if (!column.sortable) {
      return;
    }
    const direction = this.sort()?.columnId === column.id && this.sort()?.direction === 'asc' ? 'desc' : 'asc';
    this.sort.set({ columnId: column.id, direction });
  }

  protected toggleAllVisibleProducts(checked: boolean): void {
    this.selectedIds.set(checked ? this.visibleProducts().map((product) => product.slug) : []);
  }

  protected toggleProduct(productSlug: string, checked: boolean): void {
    const selected = new Set(this.selectedIds());
    if (checked) {
      selected.add(productSlug);
    } else {
      selected.delete(productSlug);
    }
    this.selectedIds.set(Array.from(selected));
  }

  protected saveProduct(): void {
    this.errorMessage.set('');
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.errorMessage.set('Complete the required product fields before saving.');
      return;
    }

    this.isSaving.set(true);
    this.adminWorkflow
      .submitProduct(this.editingSlug(), this.currentProductDraft(), this.uploadFiles(), this.primaryUploadId())
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((result) => this.applyProductSubmit(result));
  }

  protected uploadImages(): void {
    const product = this.selectedProduct();
    if (!product || this.uploadFiles().length === 0) {
      return;
    }

    this.errorMessage.set('');
    this.isUploadingImages.set(true);
    this.adminWorkflow
      .uploadProductImages(product.id, this.uploadFiles(), this.primaryUploadId())
      .pipe(finalize(() => this.isUploadingImages.set(false)))
      .subscribe((result) =>
        this.applyProductWorkflowResult(result, () => {
          this.uploadFiles.set([]);
          this.primaryUploadId.set(null);
          this.loadData();
        }),
      );
  }

  protected confirmDelete(): void {
    const slug = this.deleteProductSlug();
    if (!slug) {
      return;
    }

    this.isSaving.set(true);
    this.adminWorkflow
      .deleteProduct(slug)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((result) =>
        this.applyProductWorkflowResult(result, () => {
          if (this.editingSlug() === slug) {
            this.resetForm();
          }
          this.deleteProductSlug.set(null);
          this.loadData();
        }),
      );
  }

  protected resetForm(): void {
    this.editingSlug.set(null);
    this.productForm.setValue({
      name: '',
      description: '',
      price: '0.00',
      stock: 0,
      categoryId: '',
      isActive: true,
    });
    this.fieldErrors.set({});
    this.uploadFiles.set([]);
    this.primaryUploadId.set(null);
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    forkJoin({
      products: this.adminService.getAdminProducts({ page: 1, page_size: 100 }),
      categories: this.adminService.getAdminCategories({ page: 1, page_size: 100 }),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ products, categories }) => {
          this.products.set(products.results);
          this.categories.set(categories.results);
        },
        error: () => this.errorMessage.set('Products could not be loaded.'),
      });
  }

  private hydrateForm(product: AdminProduct): void {
    this.editingSlug.set(product.slug);
    this.productForm.setValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock_quantity,
      categoryId: String(product.category_id),
      isActive: product.is_active,
    });
    this.fieldErrors.set({});
  }

  private toggleVisibility(ids: readonly string[], forceVisible?: boolean): void {
    this.isSaving.set(true);
    this.adminWorkflow
      .toggleProductVisibility(this.products(), ids, forceVisible)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((result) =>
        this.applyProductWorkflowResult(result, () => {
          this.selectedIds.set([]);
          this.loadData();
        }),
      );
  }

  private currentProductDraft(): AdminProductDraft {
    const formValue = this.productForm.getRawValue();
    return {
      name: formValue.name,
      description: formValue.description,
      price: formValue.price,
      stock: Math.max(0, Number(formValue.stock)),
      isActive: formValue.isActive,
      categoryId: formValue.categoryId,
    };
  }

  private applyProductSubmit(result: AdminProductSubmitResult): void {
    if (result.status === 'invalid') {
      this.fieldErrors.set(result.fieldErrors);
      return;
    }
    if (result.status === 'failed') {
      this.errorMessage.set(result.message);
      return;
    }

    this.hydrateForm(result.product);
    this.fieldErrors.set({});
    if (result.status === 'image-upload-failed') {
      this.errorMessage.set(result.message);
    } else {
      this.statusMessage.set(result.message);
      this.uploadFiles.set([]);
      this.primaryUploadId.set(null);
    }
    this.loadData();
  }

  private applyProductWorkflowResult(result: AdminWorkflowResult, onSuccess: () => void): void {
    if (result.status === 'failed') {
      this.errorMessage.set(result.message);
      return;
    }
    if (result.status === 'noop') {
      this.selectedIds.set([]);
      return;
    }

    this.statusMessage.set(result.message);
    onSuccess();
  }
}

function currencyValue(amount: string): string {
  return `$${Number(amount).toFixed(2)}`;
}

function availabilityLabel(stock: number): string {
  if (stock <= 0) {
    return 'out of stock';
  }

  return stock <= 5 ? 'low stock' : 'in stock';
}

function availabilityTone(stock: number): 'success' | 'warning' | 'error' {
  if (stock <= 0) {
    return 'error';
  }

  return stock <= 5 ? 'warning' : 'success';
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

function sortProducts(products: readonly AdminProduct[], sort: UiSortState | null): readonly AdminProduct[] {
  if (!sort) {
    return products;
  }

  return [...products].sort((left, right) => {
    const leftValue = productSortValue(left, sort.columnId);
    const rightValue = productSortValue(right, sort.columnId);
    return sort.direction === 'asc' ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
  });
}

function productSortValue(product: AdminProduct, columnId: string): string {
  switch (columnId) {
    case 'name':
      return product.name;
    case 'category':
      return product.category_name;
    case 'price':
      return product.price;
    case 'stock':
      return String(product.stock_quantity).padStart(8, '0');
    case 'availability':
      return availabilityLabel(product.stock_quantity);
    case 'visibility':
      return product.is_active ? 'active' : 'hidden';
    default:
      return '';
  }
}
