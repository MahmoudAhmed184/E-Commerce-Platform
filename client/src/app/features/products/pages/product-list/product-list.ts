import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, Category, PaginatedResponse } from '../../services/product';
import { ProductCardComponent } from '../../components/product-card/product-card';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css']
})
export class ProductListPage implements OnInit {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  categories: Category[] = [];

  // Pagination state
  totalCount = 0;
  currentPage = 1;
  pageSize = 12;
  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  // Filter state
  searchQuery = '';
  selectedCategory = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  ordering = '-created_at';

  loading = true;
  error = '';

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadProducts(page = 1): void {
    this.loading = true;
    this.error = '';
    this.currentPage = page;

    const filters = {
      search: this.searchQuery || undefined,
      category__slug: this.selectedCategory || undefined,
      min_price: this.minPrice ?? undefined,
      max_price: this.maxPrice ?? undefined,
      ordering: this.ordering,
      page,
      page_size: this.pageSize,
    };

    this.productService.getProducts(filters).subscribe({
      next: (data: PaginatedResponse<Product>) => {
        this.products = data.results;
        this.totalCount = data.count;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to load products', err);
        this.error = 'Could not load products. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.loadProducts(1);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.ordering = '-created_at';
    this.loadProducts(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadProducts(page);
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
