import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs';

import { Category, Product, ProductService } from '../../../products/services/product';

interface ProductBadge {
  label: string;
  tone: 'gold' | 'green' | 'red';
}

interface ProductCard {
  product: Product;
  imageUrl: string | null;
  badge: ProductBadge;
}

@Component({
  selector: 'app-home-page',
  imports: [CurrencyPipe, DecimalPipe, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly categorySelection = new Subject<string>();

  protected readonly categories = signal<Category[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly selectedCategory = signal('');
  protected readonly catalogCount = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly activeCategoryName = computed(() => {
    const selected = this.selectedCategory();
    return this.categories().find((category) => category.slug === selected)?.name ?? 'All products';
  });

  protected readonly productCards = computed<ProductCard[]>(() =>
    this.products().map((product) => ({
      product,
      imageUrl: this.productImage(product),
      badge: this.productBadge(product),
    })),
  );

  protected readonly heroCards = computed(() => this.productCards().slice(0, 3));

  ngOnInit(): void {
    this.loadCategories();
    this.watchCategorySelection();
  }

  protected selectCategory(slug: string): void {
    if (slug === this.selectedCategory()) {
      return;
    }

    this.selectedCategory.set(slug);
    this.categorySelection.next(slug);
  }

  protected retryProducts(): void {
    this.categorySelection.next(this.selectedCategory());
  }

  protected trackCategory(_index: number, category: Category): number {
    return category.id;
  }

  private loadCategories(): void {
    this.productService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => this.categories.set([]),
      });
  }

  private watchCategorySelection(): void {
    this.categorySelection
      .pipe(
        startWith(''),
        distinctUntilChanged(),
        tap(() => {
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap((categorySlug) =>
          this.productService
            .getProducts({
              category__slug: categorySlug || undefined,
              ordering: '-created_at',
              page_size: 8,
            })
            .pipe(
              tap((response) => {
                this.products.set(response.results);
                if (!categorySlug) {
                  this.catalogCount.set(response.count);
                }
                this.loading.set(false);
              }),
              catchError(() => {
                this.products.set([]);
                this.error.set('The collection could not be loaded. Please try again.');
                this.loading.set(false);
                return EMPTY;
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private productImage(product: Product): string | null {
    if (product.primary_image) {
      return product.primary_image;
    }

    const primary = product.images?.find((image) => image.is_primary);
    return primary?.image ?? product.images?.[0]?.image ?? null;
  }

  private productBadge(product: Product): ProductBadge {
    if (product.stock === 0) {
      return { label: 'Sold out', tone: 'red' };
    }

    if (product.stock <= 5) {
      return { label: `Only ${product.stock} left`, tone: 'gold' };
    }

    if (product.average_rating >= 4.5 && product.review_count > 0) {
      return { label: 'Customer favorite', tone: 'gold' };
    }

    return { label: 'Ready to ship', tone: 'green' };
  }
}
