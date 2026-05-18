import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminService, AdminProduct } from '../../services/admin.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent, ErrorMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-xl font-semibold text-slate-900">Products & Stock</h2>
        <button type="button" (click)="showCreateForm.set(!showCreateForm())"
          class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          {{ showCreateForm() ? 'Cancel' : 'Add Product' }}
        </button>
      </div>

      <app-error-message [message]="error()" />

      @if (showCreateForm()) {
        <div class="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-lg font-medium text-slate-900">Create New Product</h3>
          <form class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5" (ngSubmit)="createProduct()">
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Name</label>
              <input type="text" [(ngModel)]="newProduct.name" name="name" required
                class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Category</label>
              <select [(ngModel)]="newProduct.category_id" name="category_id" required
                class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option [value]="0" disabled>Select a category</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Price</label>
              <input type="text" [(ngModel)]="newProduct.price" name="price" required
                class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Initial Stock</label>
              <input type="number" [(ngModel)]="newProduct.stock" name="stock" min="0" required
                class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div class="md:col-span-2 space-y-1">
              <label class="text-sm font-medium text-slate-700">Description</label>
              <textarea [(ngModel)]="newProduct.description" name="description" rows="3"
                class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
            <div class="md:col-span-2">
              <button type="submit" [disabled]="submitting()"
                class="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all disabled:opacity-70">
                @if (submitting()) { <app-loading-spinner size="sm" /> }
                Create Product
              </button>
            </div>
          </form>
        </div>
      }

      @if (isLoading()) {
        <div class="mt-10 flex justify-center"><app-loading-spinner size="md" /></div>
      } @else {
        <div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Name</th>
                <th class="px-4 py-3">Category</th>
                <th class="px-4 py-3">Price</th>
                <th class="px-4 py-3">Stock</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Active</th>
                <th class="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (product of products(); track product.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-3 font-medium text-slate-900">{{ product.name }}</td>
                  <td class="px-4 py-3 text-slate-500">{{ product.category_name }}</td>
                  <td class="px-4 py-3 text-slate-700">$ {{ product.price }}</td>
                  <td class="px-4 py-3">
                    @if (editingStockId() === product.id) {
                      <div class="flex items-center gap-2">
                        <input type="number" [(ngModel)]="stockInput" min="0"
                          class="w-20 rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                        <button type="button" (click)="saveStock(product)"
                          class="text-xs font-medium text-green-600 hover:text-green-800">Save</button>
                        <button type="button" (click)="editingStockId.set(null)"
                          class="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                      </div>
                    } @else {
                      <span class="font-mono">{{ product.stock_quantity }}</span>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class.bg-green-100]="product.availability === 'in_stock'"
                      [class.text-green-700]="product.availability === 'in_stock'"
                      [class.bg-red-100]="product.availability === 'out_of_stock'"
                      [class.text-red-600]="product.availability === 'out_of_stock'">
                      {{ product.availability === 'in_stock' ? 'In Stock' : 'Out of Stock' }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <button type="button" (click)="toggleActive(product)"
                      class="rounded-full px-2 py-0.5 text-xs font-medium transition-colors"
                      [class.bg-indigo-100]="product.is_active"
                      [class.text-indigo-700]="product.is_active"
                      [class.bg-slate-100]="!product.is_active"
                      [class.text-slate-500]="!product.is_active">
                      {{ product.is_active ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      <button type="button" (click)="startEditStock(product)"
                        class="text-xs font-medium text-indigo-600 hover:text-indigo-800">Edit Stock</button>
                      <button type="button" (click)="startUploadImage(product)"
                        class="text-xs font-medium text-sky-600 hover:text-sky-800">Upload Image</button>
                      <button type="button" (click)="deleteProduct(product)"
                        class="text-xs font-medium text-red-500 hover:text-red-700">Delete</button>
                    </div>
                    @if (uploadingImageId() === product.id) {
                      <div class="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                        <input type="file" accept="image/*" (change)="onImageSelected($event)"
                          class="block w-full text-xs text-slate-600" />
                        <input type="text" [(ngModel)]="imageAltText" placeholder="Alt text"
                          class="block w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                        <label class="flex items-center gap-2 text-xs text-slate-600">
                          <input type="checkbox" [(ngModel)]="imageIsPrimary" />
                          Set as primary image
                        </label>
                        <div class="flex items-center gap-2">
                          <button type="button" (click)="uploadImage(product)"
                            class="text-xs font-medium text-green-600 hover:text-green-800">Save Image</button>
                          <button type="button" (click)="cancelUploadImage()"
                            class="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                        </div>
                      </div>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">No products found.</td></tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="mt-4 flex items-center gap-2 text-sm">
            <button type="button" [disabled]="currentPage() === 1"
              class="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-50"
              (click)="load(currentPage() - 1)">← Prev</button>
            <span class="text-slate-600">Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button type="button" [disabled]="currentPage() === totalPages()"
              class="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-50"
              (click)="load(currentPage() + 1)">Next →</button>
          </div>
        }
      }
    </div>
  `,
})
export class AdminProductsPage implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly products = signal<AdminProduct[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal('');
  protected readonly currentPage = signal(1);
  protected readonly totalCount = signal(0);
  protected readonly editingStockId = signal<number | null>(null);
  protected readonly uploadingImageId = signal<number | null>(null);
  protected readonly showCreateForm = signal(false);
  protected readonly submitting = signal(false);
  protected readonly categories = signal<{ id: number; name: string }[]>([]);

  protected newProduct = {
    name: '',
    description: '',
    price: '',
    stock: 0,
    category_id: 0,
  };

  protected stockInput = 0;
  protected imageAltText = '';
  protected imageIsPrimary = false;
  protected selectedImageFile: File | null = null;
  protected readonly pageSize = 20;
  protected readonly totalPages = () => Math.ceil(this.totalCount() / this.pageSize) || 1;

  ngOnInit(): void { 
    this.load();
    this.loadCategories();
  }

  private loadCategories(): void {
    this.adminService.getAdminCategories({ page_size: 100 } as any).subscribe({
      next: (res) => this.categories.set(res.results),
    });
  }

  protected load(page = 1): void {
    this.error.set('');
    this.isLoading.set(true);
    this.currentPage.set(page);
    this.adminService
      .getAdminProducts({ page })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => { this.products.set(res.results); this.totalCount.set(res.count); },
        error: () => this.error.set('Could not load products.'),
      });
  }

  protected createProduct(): void {
    if (!this.newProduct.name || !this.newProduct.price || !this.newProduct.category_id) {
      this.error.set('Please fill in all required fields.');
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    this.adminService.createProduct(this.newProduct)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (p) => {
          this.products.update(list => [p, ...list]);
          this.showCreateForm.set(false);
          this.newProduct = { name: '', description: '', price: '', stock: 0, category_id: 0 };
        },
        error: () => this.error.set('Could not create product. Ensure slug is unique and price is valid.'),
      });
  }

  protected startEditStock(product: AdminProduct): void {
    this.editingStockId.set(product.id);
    this.stockInput = product.stock_quantity;
  }

  protected startUploadImage(product: AdminProduct): void {
    this.uploadingImageId.set(product.id);
    this.selectedImageFile = null;
    this.imageAltText = '';
    this.imageIsPrimary = false;
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedImageFile = input.files?.[0] ?? null;
  }

  protected saveStock(product: AdminProduct): void {
    this.adminService.updateStock(product.slug, this.stockInput).subscribe({
      next: (updated) => {
        this.products.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        this.editingStockId.set(null);
      },
      error: () => this.error.set('Could not update stock.'),
    });
  }

  protected toggleActive(product: AdminProduct): void {
    this.adminService.toggleProductActive(product).subscribe({
      next: (updated) =>
        this.products.update((list) => list.map((p) => (p.id === updated.id ? updated : p))),
      error: () => this.error.set('Could not update product.'),
    });
  }

  protected deleteProduct(product: AdminProduct): void {
    this.adminService.deleteProduct(product.slug).subscribe({
      next: () => this.products.update((list) => list.filter((p) => p.id !== product.id)),
      error: () => this.error.set('Could not delete product.'),
    });
  }

  protected uploadImage(product: AdminProduct): void {
    if (!this.selectedImageFile) {
      this.error.set('Select an image before uploading.');
      return;
    }

    this.adminService
      .uploadProductImage(product.id, this.selectedImageFile, {
        altText: this.imageAltText || undefined,
        isPrimary: this.imageIsPrimary,
      })
      .subscribe({
        next: () => {
          this.error.set('');
          this.cancelUploadImage();
        },
        error: () => this.error.set('Could not upload image.'),
      });
  }

  protected cancelUploadImage(): void {
    this.uploadingImageId.set(null);
    this.selectedImageFile = null;
    this.imageAltText = '';
    this.imageIsPrimary = false;
  }
}
