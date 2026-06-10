import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, type OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, type Params, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ChipComponent } from '../../../../shared/components/chip/chip.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { PriceRangeControlComponent, type PriceRangeValue } from '../../../../shared/components/price-range-control/price-range-control.component';
import { SearchBarComponent, type SearchSuggestion } from '../../../../shared/components/search-bar/search-bar.component';
import { SheetComponent } from '../../../../shared/components/sheet/sheet.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import type { UiProductCardProduct } from '../../../../core/models/commerce-ui/commerce-ui.model';
import type { UiOption } from '../../../../shared/components/ui.types';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import {
  type CatalogCategory,
  CatalogPageDataService,
  type CatalogProductCollection,
  type CatalogSort,
} from '../../services/catalog-page-data/catalog-page-data.service';
import { ProductCartWorkflowService } from '../../services/product-cart-workflow/product-cart-workflow.service';

type ListingState =
  | { kind: 'loading' }
  | { kind: 'loaded'; collection: CatalogProductCollection }
  | { kind: 'error'; message: string };

@Component({
  selector: 'app-product-listing-page',
  standalone: true,
  imports: [
    ButtonComponent,
    ChipComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    NgTemplateOutlet,
    PaginationComponent,
    PriceRangeControlComponent,
    ProductCardComponent,
    SearchBarComponent,
    SheetComponent,
    SelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-surface-page">
      <div class="mx-auto grid max-w-[var(--ui-container-xl)] gap-xl px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        <header class="surface-panel surface-depth-floating grid gap-md rounded-md p-md md:grid-cols-[var(--ui-layout-search-header-grid)] md:items-end lg:p-lg">
          <div class="grid gap-sm">
            <div class="flex flex-wrap items-center gap-xs">
              <p class="type-label-sm text-text-muted">Products</p>
              <span class="rounded-full bg-surface-subtle px-xs py-2xs type-label-sm text-text-secondary">{{ totalItems() }} results</span>
            </div>
            <div class="grid gap-xs">
              <h1 class="type-heading-xl text-text-primary">Shop products</h1>
              <p class="max-w-[var(--ui-container-md)] type-body-md text-text-secondary">
                Search, filter, and compare products with transparent pricing and current availability.
              </p>
            </div>
          </div>

          <app-search-bar
            scope="Product"
            placeholder="Search by name or category"
            [query]="query()"
            [suggestions]="suggestions()"
            [resultCount]="totalItems()"
            (queryChange)="updateQuery($event)"
            (submitted)="applySearch($event)"
            (suggestionSelected)="useSuggestion($event)"
            (cleared)="clearSearch()"
          />
        </header>

        @if (statusMessage()) {
          <p class="surface-panel surface-depth-raised rounded-md p-sm type-body-sm text-text-success" role="status">
            {{ statusMessage() }}
          </p>
        }

        <div class="flex flex-wrap items-center justify-between gap-sm lg:hidden">
          <app-button variant="secondary" size="sm" (pressed)="filtersOpen.set(true)">
            Filters
          </app-button>
          <p class="type-body-sm text-text-muted">{{ totalItems() }} results</p>
        </div>

        @if (activeFilters().length) {
          <div class="flex flex-wrap items-center gap-xs" aria-label="Applied filters">
            @for (filter of activeFilters(); track filter.id) {
              <app-chip [label]="filter.label" [removable]="true" (removed)="removeFilter(filter.id)" />
            }
            <app-button variant="ghost" size="sm" (pressed)="clearFilters()">Clear all</app-button>
          </div>
        }

        <div class="grid gap-lg lg:grid-cols-[var(--ui-layout-product-list-grid)] lg:items-start">
          <aside class="surface-panel surface-depth-floating hidden rounded-md p-md lg:sticky lg:top-xl lg:grid lg:gap-md" aria-label="Product filters">
            <ng-container *ngTemplateOutlet="filtersTemplate" />
          </aside>

          <section class="grid gap-md" aria-live="polite" [attr.aria-busy]="isLoading() ? 'true' : 'false'">
            <div class="surface-panel surface-depth-raised flex flex-wrap items-center justify-between gap-md rounded-md p-sm">
              <div class="grid gap-2xs">
                <h2 class="type-heading-sm text-text-primary">Results</h2>
                <p class="type-body-sm text-text-muted">Use sorting and filters to find the right product faster.</p>
              </div>
              <div class="w-full min-w-0 sm:w-64">
                <app-select label="Sort by" [options]="sortOptions" [value]="sort()" (valueChange)="setSort($event)" />
              </div>
            </div>

            @if (state().kind === 'loading') {
              <div class="grid auto-rows-fr gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading products">
                @for (item of skeletonCards; track item.id) {
                  <app-product-card [loading]="true" />
                }
              </div>
            } @else if (state().kind === 'error') {
              <app-error-state
                statusCode="Products"
                title="Products could not load"
                [message]="errorMessage()"
                [retry]="{ label: 'Retry', variant: 'primary' }"
                homeLink="/"
                (retryPressed)="loadProducts()"
              />
            } @else if (products().length === 0) {
              <app-empty-state
                type="search"
                title="No products match"
                message="Change the search, clear price limits, or browse another department."
                [action]="{ label: 'Clear filters', variant: 'primary' }"
                (actionPressed)="clearFilters()"
              />
            } @else {
              <div class="grid auto-rows-fr gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                @for (product of products(); track product.id) {
                  <app-product-card
                    [product]="product"
                    [outOfStock]="product.stockStatus === 'out-of-stock'"
                    [adding]="addingProductId() === product.id"
                    (addToCart)="addToCart($event)"
                  />
                }
              </div>

              <app-pagination
                [page]="page()"
                [pageSize]="pageSize"
                [totalItems]="totalItems()"
                [loading]="isLoading()"
                (pageChange)="setPage($event)"
              />
            }
          </section>
        </div>
      </div>

      <app-sheet
        title="Product filters"
        description="Adjust category, price, and search options without leaving the catalog."
        side="end"
        [open]="filtersOpen()"
        (closed)="filtersOpen.set(false)"
      >
        <div class="grid gap-md">
          <ng-container *ngTemplateOutlet="filtersTemplate" />
          <app-button variant="primary" [fullWidth]="true" (pressed)="filtersOpen.set(false)">Show products</app-button>
        </div>
      </app-sheet>

      <ng-template #filtersTemplate>
        <div class="grid gap-md">
          <div class="grid gap-2xs">
            <h2 class="type-heading-sm text-text-primary">Filters</h2>
            <p class="type-body-sm text-text-muted">Use category and price to narrow the product list.</p>
          </div>

          <app-select
            label="Category"
            placeholder="All categories"
            [options]="categoryOptions()"
            [value]="category()"
            (valueChange)="setCategory($event)"
          />

          <app-price-range-control
            label="Price"
            currency="USD"
            [min]="minPrice()"
            [max]="maxPrice()"
            (rangeChange)="setPriceDraft($event)"
            (applied)="applyPrice($event)"
          />

          <app-button variant="secondary" [fullWidth]="true" (pressed)="clearFilters()">Reset filters</app-button>
        </div>
      </ng-template>
    </main>
  `,
})
export class ProductListingPage implements OnInit {
  private readonly catalogData = inject(CatalogPageDataService);
  private readonly cartWorkflow = inject(ProductCartWorkflowService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSize = 12;
  protected readonly skeletonCards = [
    { id: 'product-loading-1' },
    { id: 'product-loading-2' },
    { id: 'product-loading-3' },
    { id: 'product-loading-4' },
    { id: 'product-loading-5' },
    { id: 'product-loading-6' },
  ] as const;
  protected readonly sortOptions: readonly UiOption<CatalogSort>[] = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price low to high', value: 'price-asc' },
    { label: 'Price high to low', value: 'price-desc' },
  ];

  protected readonly state = signal<ListingState>({ kind: 'loading' });
  protected readonly categories = signal<readonly CatalogCategory[]>([]);
  protected readonly query = signal('');
  protected readonly category = signal('');
  protected readonly minPrice = signal<number | null>(null);
  protected readonly maxPrice = signal<number | null>(null);
  protected readonly sort = signal<CatalogSort>('newest');
  protected readonly page = signal(1);
  protected readonly filtersOpen = signal(false);
  protected readonly addingProductId = signal<string | null>(null);
  protected readonly statusMessage = signal('');

  protected readonly isLoading = computed(() => this.state().kind === 'loading');
  protected readonly products = computed(() => {
    const state = this.state();
    return state.kind === 'loaded' ? state.collection.products : [];
  });
  protected readonly totalItems = computed(() => {
    const state = this.state();
    return state.kind === 'loaded' ? state.collection.total : 0;
  });
  protected readonly errorMessage = computed(() => {
    const state = this.state();
    return state.kind === 'error' ? state.message : '';
  });
  protected readonly categoryOptions = computed<readonly UiOption[]>(() =>
    this.categories().map((category) => ({
      label: `${category.name} (${category.productCount})`,
      value: category.slug,
      helper: category.description,
    })),
  );
  protected readonly suggestions = computed<readonly SearchSuggestion[]>(() =>
    this.products().slice(0, 5).map((product) => ({
      id: product.id,
      label: product.name,
      description: product.category,
      href: `/products/${product.slug}`,
    })),
  );
  protected readonly activeFilters = computed(() => {
    const filters: { id: 'query' | 'category' | 'price'; label: string }[] = [];
    if (this.query()) {
      filters.push({ id: 'query', label: `Search: ${this.query()}` });
    }
    if (this.category()) {
      filters.push({ id: 'category', label: `Category: ${categoryLabel(this.categories(), this.category())}` });
    }
    if (this.minPrice() !== null || this.maxPrice() !== null) {
      filters.push({ id: 'price', label: `Price: ${this.minPrice() ?? 0} to ${this.maxPrice() ?? 'any'}` });
    }
    return filters;
  });

  ngOnInit(): void {
    this.catalogData.getCategories().subscribe((categories) => this.categories.set(categories));
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.query.set(params.get('search') ?? '');
      this.category.set(params.get('category') ?? params.get('category__slug') ?? '');
      this.minPrice.set(toNumberOrNull(params.get('minPrice') ?? params.get('min_price')));
      this.maxPrice.set(toNumberOrNull(params.get('maxPrice') ?? params.get('max_price')));
      this.sort.set(parseSort(params.get('sort') ?? params.get('ordering')));
      this.page.set(toNumberOrNull(params.get('page')) ?? 1);
      this.loadProducts();
    });
  }

  protected updateQuery(value: string): void {
    this.query.set(value);
  }

  protected applySearch(value: string): void {
    this.query.set(value);
    this.navigateWithFilters(1);
  }

  protected clearSearch(): void {
    this.query.set('');
    this.navigateWithFilters(1);
  }

  protected useSuggestion(suggestion: SearchSuggestion): void {
    this.query.set(suggestion.label);
    this.navigateWithFilters(1);
  }

  protected setCategory(value: string | number): void {
    this.category.set(String(value));
    this.navigateWithFilters(1);
  }

  protected setSort(value: string | number): void {
    this.sort.set(parseSort(String(value)));
    this.navigateWithFilters(1);
  }

  protected setPriceDraft(value: PriceRangeValue): void {
    this.minPrice.set(value.min);
    this.maxPrice.set(value.max);
  }

  protected applyPrice(value: PriceRangeValue): void {
    this.minPrice.set(value.min);
    this.maxPrice.set(value.max);
    this.navigateWithFilters(1);
  }

  protected setPage(page: number): void {
    this.navigateWithFilters(page);
  }

  protected removeFilter(id: 'query' | 'category' | 'price'): void {
    if (id === 'query') {
      this.query.set('');
    }
    if (id === 'category') {
      this.category.set('');
    }
    if (id === 'price') {
      this.minPrice.set(null);
      this.maxPrice.set(null);
    }
    this.navigateWithFilters(1);
  }

  protected clearFilters(): void {
    this.query.set('');
    this.category.set('');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.sort.set('newest');
    this.navigateWithFilters(1);
  }

  protected loadProducts(): void {
    this.state.set({ kind: 'loading' });
    this.catalogData
      .getProducts({
        search: this.query(),
        category: this.category(),
        minPrice: this.minPrice(),
        maxPrice: this.maxPrice(),
        sort: this.sort(),
        page: this.page(),
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (collection) => this.state.set({ kind: 'loaded', collection }),
        error: () => this.state.set({ kind: 'error', message: 'Try again or clear filters to continue browsing.' }),
      });
  }

  protected addToCart(product: UiProductCardProduct): void {
    this.addingProductId.set(product.id);
    this.statusMessage.set('');
    this.cartWorkflow
      .addProduct(product, 1)
      .pipe(finalize(() => this.addingProductId.set(null)))
      .subscribe((result) => this.statusMessage.set(result.message));
  }

  private navigateWithFilters(page: number): void {
    const queryParams: Params = {};
    if (this.query()) queryParams['search'] = this.query();
    if (this.category()) queryParams['category'] = this.category();
    if (this.minPrice() !== null) queryParams['minPrice'] = this.minPrice();
    if (this.maxPrice() !== null) queryParams['maxPrice'] = this.maxPrice();
    if (this.sort() !== 'newest') queryParams['sort'] = this.sort();
    if (page > 1) queryParams['page'] = page;
    void this.router.navigate([], { relativeTo: this.route, queryParams });
    this.filtersOpen.set(false);
  }
}

function toNumberOrNull(value: string | null): number | null {
  if (value === null || value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSort(value: string | null): CatalogSort {
  switch (value) {
    case 'newest':
    case 'price-asc':
    case 'price-desc':
      return value;
    case 'price':
      return 'price-asc';
    case '-price':
      return 'price-desc';
    case '-created_at':
    case 'featured':
    case 'rating':
    default:
      return 'newest';
  }
}

function categoryLabel(categories: readonly CatalogCategory[], slug: string): string {
  return categories.find((category) => category.slug === slug)?.name ?? slug;
}
