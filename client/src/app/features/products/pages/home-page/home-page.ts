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
import { ButtonComponent } from '../../../../shared/components/button/button.component';
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
    ButtonComponent,
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
    <main class="bg-surface-page">
      @if (state().kind === 'loading') {
        <section class="mx-auto grid max-w-[var(--ui-container-xl)] gap-8 px-gutter-xs py-12 md:px-gutter-sm lg:grid-cols-[1.1fr_0.9fr] lg:px-gutter-lg" aria-label="Loading storefront">
          <div class="grid content-center gap-4">
            <app-skeleton-loader [rows]="4" label="Loading home heading" />
            <div class="flex gap-3">
              <app-skeleton-loader shape="line" label="Loading action" />
              <app-skeleton-loader shape="line" label="Loading action" />
            </div>
          </div>
          <app-skeleton-loader shape="media" label="Loading featured product" />
        </section>
      } @else if (state().kind === 'error') {
        <section class="mx-auto max-w-[var(--ui-container-xl)] px-gutter-xs py-16 md:px-gutter-sm lg:px-gutter-lg">
          <app-error-state
            statusCode="Storefront"
            title="Storefront could not load"
            [message]="errorMessage()"
            [retry]="{ label: 'Retry', variant: 'primary' }"
            homeLink="/products"
            (retryPressed)="load()"
          />
        </section>
      } @else if (loaded(); as data) {
        @if (data.featured[0]; as heroProduct) {
          <section class="relative min-h-[520px] overflow-hidden border-b border-border-default bg-surface-raised" aria-labelledby="home-title">
            <div class="mx-auto grid min-h-[520px] max-w-[var(--ui-container-xl)] gap-8 px-gutter-xs py-10 md:px-gutter-sm lg:grid-cols-[55%_45%] lg:items-center lg:px-gutter-lg">
              <div class="grid w-full min-w-0 gap-6 justify-self-stretch">
                <p class="type-label-sm text-text-info">
                  Featured collection &bull; Ready to shop
                </p>

                <h1 id="home-title" class="w-full max-w-2xl type-display-lg text-text-primary">
                  Shop reliable products for
                  <span>everyday life.</span>
                </h1>

                <p class="w-full max-w-md type-body-lg text-text-secondary">
                  Compare clear product details, see current availability, and move from cart to delivery with a checkout flow built for real orders.
                </p>

                <div class="mb-2 flex flex-wrap items-center gap-3">
                  <app-button [routerLink]="'/products'" size="lg">
                    Shop products
                  </app-button>
                  <app-button variant="secondary" [routerLink]="['/products', heroProduct.slug]" size="lg">
                    View featured
                  </app-button>
                </div>

                <div class="flex flex-wrap items-center gap-6 type-label-sm text-text-muted">
                  <div class="flex items-center gap-1.5">
                    <svg lucidePackageCheck class="h-3.5 w-3.5 text-text-info" aria-hidden="true"></svg>
                    <span>Verified inventory</span>
                  </div>
                  <div class="h-3 w-px bg-border-default" aria-hidden="true"></div>
                  <div class="flex items-center gap-1.5">
                    <svg lucideShieldCheck class="h-3.5 w-3.5 text-text-info" aria-hidden="true"></svg>
                    <span>Secure checkout</span>
                  </div>
                  <div class="h-3 w-px bg-border-default" aria-hidden="true"></div>
                  <div class="flex items-center gap-1.5">
                    <svg lucideTruck class="h-3.5 w-3.5 text-text-info" aria-hidden="true"></svg>
                    <span>Order tracking</span>
                  </div>
                </div>
              </div>

              <div class="w-full min-w-0 overflow-hidden rounded-md border-hairline border-border-default bg-surface-subtle shadow-sm">
                <a class="block overflow-hidden rounded-t-md focus-visible:focus-ring" [routerLink]="['/products', heroProduct.slug]">
                  <img
                    class="h-80 w-full object-contain transition-transform duration-300 ease-out hover:scale-[1.03]"
                    [src]="heroProduct.imageUrl"
                    [alt]="heroProduct.name"
                  />
                </a>
                <div class="flex items-center justify-between gap-4 border-t-hairline border-border-default bg-surface-raised p-md">
                  <div class="min-w-0">
                    <p class="truncate type-label-md text-text-primary">{{ heroProduct.name }}</p>
                    <p class="type-code-sm text-text-secondary">{{ heroProduct.price | currency: heroProduct.currency }}</p>
                  </div>
                  <app-badge
                    [variant]="heroStockBadge().variant"
                    [label]="heroStockBadge().label"
                  />
                </div>
              </div>
            </div>
          </section>
        }

        <div class="mx-auto grid max-w-[var(--ui-container-xl)] gap-16 px-gutter-xs py-16 md:px-gutter-sm lg:px-gutter-lg">
          <section class="grid gap-6" aria-labelledby="featured-title">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div class="grid min-w-0 gap-1">
                <p class="type-label-sm text-text-muted">Featured products</p>
                <h2 id="featured-title" class="type-heading-lg text-text-primary">Products worth a closer look</h2>
                <p class="max-w-lg type-body-sm text-text-secondary">Compare price, availability, and customer feedback before adding items to your cart.</p>
              </div>
              <a class="rounded-sm type-label-md text-text-info focus-visible:focus-ring" routerLink="/products">See all products</a>
            </div>

            @if (data.featured.length || data.newArrivals.length) {
              <app-tabs [tabs]="collectionTabs" [activeId]="collectionTab()" (activeIdChange)="setCollectionTab($event)">
                @switch (collectionTab()) {
                  @case ('new-arrivals') {
                    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

          <section class="grid gap-6" aria-labelledby="category-title">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div class="grid min-w-0 gap-1">
                <p class="type-label-sm text-text-muted">Departments</p>
                <h2 id="category-title" class="type-heading-lg text-text-primary">Shop by department</h2>
                <p class="max-w-lg type-body-sm text-text-secondary">Find products organized by category, with item counts and availability kept easy to scan.</p>
              </div>
              <a class="rounded-sm type-label-md text-text-info focus-visible:focus-ring" routerLink="/products">Browse all categories</a>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Featured categories">
              @for (category of visibleCategories(); track category.id) {
                <a
                  class="group grid min-h-[11rem] content-between gap-4 rounded-md border-hairline border-border-default bg-surface-raised p-md shadow-xs interactive-transition hover:-translate-y-0.5 hover:border-border-focus hover:shadow-md focus-visible:focus-ring"
                  [routerLink]="['/products']"
                  [queryParams]="{ category: category.slug }"
                >
                  <div class="grid gap-3">
                    <div class="flex items-center justify-between gap-3">
                      <span class="text-text-info" aria-hidden="true">
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
                      <app-badge variant="outline" [label]="category.productCount + ' products'" />
                    </div>
                    <div class="grid gap-1">
                      <span class="mt-3 type-label-lg text-text-primary">{{ category.name }}</span>
                      <span class="line-clamp-2 type-body-sm text-text-secondary">{{ category.description || 'Shop available products in this department.' }}</span>
                    </div>
                  </div>
                  <span class="inline-block type-label-sm text-text-info transition-transform duration-150 ease-out group-hover:translate-x-1">Shop category</span>
                </a>
              } @empty {
                <app-empty-state type="generic" title="No categories available" message="Departments will appear when products are assigned to active categories." />
              }
            </div>

            @if (remainingCategoryCount() > 0) {
              <p class="type-body-sm text-text-muted">
                Showing the {{ visibleCategories().length }} largest departments. {{ remainingCategoryCount() }} more are available in product filters.
              </p>
            }
          </section>

          <section class="grid gap-8" aria-labelledby="category-shelves-title">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div class="grid min-w-0 gap-1">
                <p class="type-label-sm text-text-muted">Category picks</p>
                <h2 id="category-shelves-title" class="type-heading-lg text-text-primary">Popular departments</h2>
                <p class="max-w-lg type-body-sm text-text-secondary">Browse a short selection from active departments with products ready to review.</p>
              </div>
              <a class="rounded-sm type-label-md text-text-info focus-visible:focus-ring" routerLink="/products">See all products</a>
            </div>

            <div class="grid gap-12">
              @for (shelf of data.categoryShelves; track shelf.id) {
                <section class="grid gap-4" [attr.aria-labelledby]="'category-shelf-title-' + shelf.id">
                  <div class="flex flex-wrap items-end justify-between gap-4">
                    <div class="grid min-w-0 gap-1">
                      <h3 [id]="'category-shelf-title-' + shelf.id" class="type-heading-md text-text-primary">{{ shelf.category.name }}</h3>
                      <p class="max-w-lg type-body-sm text-text-secondary">
                        {{ shelf.category.description || 'A focused selection from this department.' }}
                      </p>
                    </div>
                    <a
                      class="rounded-sm type-label-md text-text-info focus-visible:focus-ring"
                      routerLink="/products"
                      [queryParams]="{ category: shelf.category.slug }"
                    >
                      See more
                    </a>
                  </div>

                  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <p class="rounded-md border-hairline border-success-600 bg-surface-success p-sm type-body-sm text-text-success" role="status">
              {{ statusMessage() }}
            </p>
          }
        </div>
      }
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

function productStockBadge(status: CatalogProduct['stockStatus']): { variant: 'outline' | 'warning' | 'success'; label: string } {
  switch (status) {
    case 'out-of-stock':
      return { variant: 'outline', label: 'Unavailable' };
    case 'low-stock':
      return { variant: 'warning', label: 'Low stock' };
    case 'in-stock':
      return { variant: 'success', label: 'Ready to ship' };
  }
}
