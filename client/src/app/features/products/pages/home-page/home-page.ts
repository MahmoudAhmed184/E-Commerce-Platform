import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  LucideCable,
  LucideDumbbell,
  LucideShoppingBasket,
  LucideSmartphone,
  LucideUtensilsCrossed,
  LucideWatch,
  LucideShieldCheck,
  LucideTruck,
  LucidePackageCheck,
} from '@lucide/angular';

import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TabsComponent, type UiTab } from '../../../../shared/components/tabs/tabs.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { CatalogPageDataService, type CatalogHomeCollections, type CatalogProduct } from '../../services/catalog-page-data/catalog-page-data.service';
import { ProductCartWorkflowService } from '../../services/product-cart-workflow/product-cart-workflow.service';

type HomePageState =
  | { kind: 'loading' }
  | ({ kind: 'loaded' } & CatalogHomeCollections)
  | { kind: 'error'; message: string };

const HOME_CATEGORY_LIMIT = 6;

@Component({
  selector: 'app-home-page',
  imports: [
    BadgeComponent,
    CurrencyPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LucideCable,
    LucideDumbbell,
    LucideShoppingBasket,
    LucideSmartphone,
    LucideUtensilsCrossed,
    LucideWatch,
    LucideShieldCheck,
    LucideTruck,
    LucidePackageCheck,
    ProductCardComponent,
    RouterLink,
    SkeletonLoaderComponent,
    TabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-neutral-50">
      <div class="mx-auto grid max-w-[var(--ui-container-xl)] gap-16 px-gutter-xs py-8 md:px-gutter-sm lg:px-gutter-lg">
        @if (state().kind === 'loading') {
          <section class="grid gap-lg lg:grid-cols-[var(--ui-layout-home-hero-grid)]" aria-label="Loading storefront">
            <div class="grid content-center gap-md">
              <app-skeleton-loader [rows]="4" label="Loading home heading" />
              <div class="flex gap-sm">
                <app-skeleton-loader shape="line" label="Loading action" />
                <app-skeleton-loader shape="line" label="Loading action" />
              </div>
            </div>
            <app-skeleton-loader shape="media" label="Loading featured product" />
          </section>
        } @else if (state().kind === 'error') {
          <app-error-state
            statusCode="Storefront"
            title="Storefront could not load"
            [message]="errorMessage()"
            [retry]="{ label: 'Retry', variant: 'primary' }"
            homeLink="/products"
            (retryPressed)="load()"
          />
        } @else if (loaded(); as data) {
          <!-- ═══ HERO SECTION ═══ -->
          @if (data.featured[0]; as heroProduct) {
            <section class="min-h-[520px] overflow-hidden border-b border-neutral-100 bg-white rounded-2xl" aria-labelledby="home-title">
              <div class="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-10">
                <!-- Left column -->
                <div class="grid gap-6">
                  <p class="text-xs font-medium uppercase tracking-widest text-indigo-600">
                    Featured collection · Ready to shop
                  </p>

                  <h1 id="home-title" class="max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-neutral-950 md:text-5xl">
                    Shop reliable products for
                    <span class="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">everyday life.</span>
                  </h1>

                  <p class="max-w-md text-base leading-relaxed text-neutral-500">
                    Compare clear product details, see current availability, and move from cart to delivery with a checkout flow built for real orders.
                  </p>

                  <div class="flex flex-wrap items-center gap-3">
                    <a
                      class="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white shadow-sm transition-all duration-150 ease-out hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      routerLink="/products"
                    >
                      Shop products
                    </a>
                    <a
                      class="inline-flex h-10 items-center rounded-lg px-6 text-sm font-medium text-neutral-600 transition-all duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      [routerLink]="['/products', heroProduct.slug]"
                    >
                      View featured →
                    </a>
                  </div>

                  <!-- Trust strip -->
                  <div class="flex flex-wrap items-center gap-6 pt-2">
                    <div class="flex items-center gap-1.5">
                      <svg lucideShieldCheck class="h-3.5 w-3.5 text-indigo-500" aria-hidden="true"></svg>
                      <span class="text-xs text-neutral-500">Verified inventory</span>
                    </div>
                    <div class="h-3 w-px bg-neutral-200" aria-hidden="true"></div>
                    <div class="flex items-center gap-1.5">
                      <svg lucidePackageCheck class="h-3.5 w-3.5 text-indigo-500" aria-hidden="true"></svg>
                      <span class="text-xs text-neutral-500">Secure checkout</span>
                    </div>
                    <div class="h-3 w-px bg-neutral-200" aria-hidden="true"></div>
                    <div class="flex items-center gap-1.5">
                      <svg lucideTruck class="h-3.5 w-3.5 text-indigo-500" aria-hidden="true"></svg>
                      <span class="text-xs text-neutral-500">Order tracking</span>
                    </div>
                  </div>
                </div>

                <!-- Right column: Product showcase card -->
                <div class="overflow-hidden rounded-2xl bg-neutral-50 shadow-sm">
                  <a class="block overflow-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-t-2xl" [routerLink]="['/products', heroProduct.slug]">
                    <img
                      class="h-80 w-full object-contain transition-transform duration-300 hover:scale-[1.03]"
                      [src]="heroProduct.imageUrl"
                      [alt]="heroProduct.name"
                    />
                  </a>
                  <div class="flex items-center justify-between gap-4 border-t border-neutral-200 p-4">
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-neutral-900 truncate">{{ heroProduct.name }}</p>
                      <p class="font-mono text-sm text-neutral-500">{{ heroProduct.price | currency: heroProduct.currency }}</p>
                    </div>
                    <app-badge
                      [tone]="heroStockBadge().tone"
                      [label]="heroStockBadge().label"
                    />
                  </div>
                </div>
              </div>
            </section>
          }

          <!-- ═══ FEATURED PRODUCTS SECTION ═══ -->
          <section class="grid gap-6" aria-labelledby="featured-title">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div class="grid gap-1">
                <p class="text-xs font-medium uppercase tracking-widest text-neutral-400">Featured products</p>
                <h2 id="featured-title" class="text-3xl font-bold tracking-tight text-neutral-950">Products worth a closer look</h2>
                <p class="max-w-lg text-sm text-neutral-500">Compare price, availability, and customer feedback before adding items to your cart.</p>
              </div>
              <a class="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-sm" routerLink="/products">See all products</a>
            </div>

            @if (data.featured.length || data.newArrivals.length) {
              <app-tabs [tabs]="collectionTabs" [activeId]="collectionTab()" (activeIdChange)="setCollectionTab($event)">
                @switch (collectionTab()) {
                  @case ('new-arrivals') {
                    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      @for (product of data.newArrivals; track product.id) {
                        <app-product-card
                          [product]="product"
                          [outOfStock]="product.stockStatus === 'out-of-stock'"
                          [adding]="addingProductId() === product.id"
                          (addToCart)="quickAdd(product)"
                        />
                      } @empty {
                        <app-empty-state type="generic" title="No new arrivals" message="Recently published products will appear here." />
                      }
                    </div>
                  }
                  @default {
                    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      @for (product of data.featured; track product.id) {
                        <app-product-card
                          [product]="product"
                          [outOfStock]="product.stockStatus === 'out-of-stock'"
                          [adding]="addingProductId() === product.id"
                          (addToCart)="quickAdd(product)"
                        />
                      } @empty {
                        <app-empty-state type="generic" title="No featured products" message="Featured products will appear when the catalog is updated." />
                      }
                    </div>
                    }
                }
              </app-tabs>
            } @else {
              <app-empty-state
                type="generic"
                title="No featured products"
                message="Browse the full catalog for currently available items."
                [action]="{ label: 'Shop products', variant: 'primary' }"
                (actionPressed)="goToProducts()"
              />
            }
          </section>

          <!-- ═══ DEPARTMENT / CATEGORY CARDS ═══ -->
          <section class="grid gap-6" aria-labelledby="category-title">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div class="grid gap-1">
                <p class="text-xs font-medium uppercase tracking-widest text-neutral-400">Departments</p>
                <h2 id="category-title" class="text-3xl font-bold tracking-tight text-neutral-950">Shop by department</h2>
                <p class="max-w-lg text-sm text-neutral-500">Find products organized by category, with item counts and availability kept easy to scan.</p>
              </div>
              <a class="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-sm" routerLink="/products">Browse all categories</a>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Featured categories">
              @for (category of visibleCategories(); track category.id) {
                <a
                  class="group grid min-h-[11rem] content-between gap-4 rounded-xl border border-neutral-100 bg-white p-5 shadow-sm transition-all duration-150 cursor-pointer hover:border-indigo-200 hover:shadow-[0_2px_12px_rgba(79,70,229,0.07)] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  [routerLink]="['/products']"
                  [queryParams]="{ category: category.slug }"
                >
                  <div class="grid gap-3">
                    <div class="flex items-center justify-between">
                      <span class="text-indigo-500" aria-hidden="true">
                        @switch (categoryIcon(category.name)) {
                          @case ('utensils-crossed') { <svg lucideUtensilsCrossed class="h-5 w-5"></svg> }
                          @case ('shopping-basket') { <svg lucideShoppingBasket class="h-5 w-5"></svg> }
                          @case ('dumbbell') { <svg lucideDumbbell class="h-5 w-5"></svg> }
                          @case ('smartphone') { <svg lucideSmartphone class="h-5 w-5"></svg> }
                          @case ('cable') { <svg lucideCable class="h-5 w-5"></svg> }
                          @case ('watch') { <svg lucideWatch class="h-5 w-5"></svg> }
                          @default { <svg lucideShoppingBasket class="h-5 w-5"></svg> }
                        }
                      </span>
                      <app-badge tone="secondary" [label]="category.productCount + ' products'" />
                    </div>
                    <div class="grid gap-1">
                      <span class="text-base font-semibold text-neutral-900">{{ category.name }}</span>
                      <span class="text-sm leading-relaxed text-neutral-500 line-clamp-2">{{ category.description || 'Shop available products in this department.' }}</span>
                    </div>
                  </div>
                  <span class="text-xs font-medium text-indigo-600 transition-transform duration-150 group-hover:translate-x-1 inline-block">Shop category →</span>
                </a>
              } @empty {
                <app-empty-state type="generic" title="No categories available" message="Departments will appear when products are assigned to active categories." />
              }
            </div>

            @if (remainingCategoryCount() > 0) {
              <p class="text-sm text-neutral-400">
                Showing the {{ visibleCategories().length }} largest departments. {{ remainingCategoryCount() }} more are available in product filters.
              </p>
            }
          </section>

          <!-- ═══ CATEGORY SHELVES (Popular departments) ═══ -->
          <section class="grid gap-8" aria-labelledby="category-shelves-title">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div class="grid gap-1">
                <p class="text-xs font-medium uppercase tracking-widest text-neutral-400">Category picks</p>
                <h2 id="category-shelves-title" class="text-3xl font-bold tracking-tight text-neutral-950">Popular departments</h2>
                <p class="max-w-lg text-sm text-neutral-500">Browse a short selection from active departments with products ready to review.</p>
              </div>
              <a class="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-sm" routerLink="/products">See all products</a>
            </div>

            <div class="grid gap-12">
              @for (shelf of data.categoryShelves; track shelf.id) {
                <section class="grid gap-4" [attr.aria-labelledby]="'category-shelf-title-' + shelf.id">
                  <div class="flex flex-wrap items-end justify-between gap-4">
                    <div class="grid gap-1">
                      <h3 [id]="'category-shelf-title-' + shelf.id" class="text-xl font-semibold tracking-tight text-neutral-950">{{ shelf.category.name }}</h3>
                      <p class="max-w-lg text-sm text-neutral-500">
                        {{ shelf.category.description || 'A focused selection from this department.' }}
                      </p>
                    </div>
                    <a
                      class="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-sm"
                      routerLink="/products"
                      [queryParams]="{ category: shelf.category.slug }"
                    >
                      See more
                    </a>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    @for (product of shelf.products; track product.id) {
                      <app-product-card
                        [product]="product"
                        [outOfStock]="product.stockStatus === 'out-of-stock'"
                        [adding]="addingProductId() === product.id"
                        (addToCart)="quickAdd(product)"
                      />
                    } @empty {
                      <app-empty-state type="generic" title="No products in this category" message="Products for this department will appear after they are published." />
                    }
                  </div>
                </section>
              } @empty {
                <app-empty-state type="generic" title="No category selections available" message="Department selections will appear when active categories contain products." />
              }
            </div>
          </section>

          @if (statusMessage()) {
            <p class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">
              {{ statusMessage() }}
            </p>
          }
        }
      </div>
    </main>
  `,
})
export class HomePage implements OnInit {
  private readonly catalogData = inject(CatalogPageDataService);
  private readonly cartWorkflow = inject(ProductCartWorkflowService);
  private readonly router = inject(Router);

  protected readonly state = signal<HomePageState>({ kind: 'loading' });
  protected readonly addingProductId = signal<string | null>(null);
  protected readonly statusMessage = signal('');
  protected readonly collectionTab = signal<'featured' | 'new-arrivals'>('featured');
  protected readonly collectionTabs: readonly UiTab[] = [
    { id: 'featured', label: 'Featured' },
    { id: 'new-arrivals', label: 'New arrivals' },
  ];
  protected readonly loaded = computed(() => {
    const state = this.state();
    return state.kind === 'loaded' ? state : null;
  });
  protected readonly visibleCategories = computed(() => {
    const data = this.loaded();
    if (!data) {
      return [];
    }

    return [...data.categories]
      .sort((first, second) => second.productCount - first.productCount || first.name.localeCompare(second.name))
      .slice(0, HOME_CATEGORY_LIMIT);
  });
  protected readonly remainingCategoryCount = computed(() => {
    const data = this.loaded();
    return Math.max((data?.categories.length ?? 0) - this.visibleCategories().length, 0);
  });
  protected readonly errorMessage = computed(() => {
    const state = this.state();
    return state.kind === 'error' ? state.message : '';
  });
  protected readonly heroStockBadge = computed(() => productStockBadge(this.loaded()?.featured[0]?.stockStatus ?? 'out-of-stock'));

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.state.set({ kind: 'loading' });
    this.catalogData.getHomeCollections().subscribe({
      next: (data) => this.state.set({ kind: 'loaded', ...data }),
      error: () => this.state.set({ kind: 'error', message: 'Refresh the page or browse products directly.' }),
    });
  }

  protected quickAdd(product: CatalogProduct): void {
    this.statusMessage.set('');
    this.addingProductId.set(product.id);
    this.cartWorkflow
      .addProduct(product, 1)
      .pipe(finalize(() => this.addingProductId.set(null)))
      .subscribe((result) => this.statusMessage.set(result.message));
  }

  protected goToProducts(): void {
    void this.router.navigateByUrl('/products');
  }

  protected setCollectionTab(value: string): void {
    this.collectionTab.set(value === 'new-arrivals' ? 'new-arrivals' : 'featured');
  }

  protected categoryIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('kitchen')) return 'utensils-crossed';
    if (lower.includes('grocer')) return 'shopping-basket';
    if (lower.includes('sport')) return 'dumbbell';
    if (lower.includes('smartphone') || lower.includes('phone')) return 'smartphone';
    if (lower.includes('mobile') || lower.includes('accessor')) return 'cable';
    if (lower.includes('watch')) return 'watch';
    return 'shopping-basket';
  }
}

function productStockBadge(status: CatalogProduct['stockStatus']): { tone: 'warning' | 'info' | 'success'; label: string } {
  switch (status) {
    case 'out-of-stock':
      return { tone: 'warning', label: 'Out of stock' };
    case 'low-stock':
      return { tone: 'info', label: 'Low stock' };
    case 'in-stock':
      return { tone: 'success', label: 'Ready to ship' };
  }
}
