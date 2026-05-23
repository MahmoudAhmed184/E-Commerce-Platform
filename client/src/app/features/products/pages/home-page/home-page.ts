import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

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
    ProductCardComponent,
    RouterLink,
    SkeletonLoaderComponent,
    TabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-transparent">
      <div class="mx-auto grid max-w-[var(--ui-container-xl)] gap-2xl px-gutter-xs py-lg md:px-gutter-sm lg:px-gutter-lg">
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
          @if (data.featured[0]; as heroProduct) {
            <section class="glass-panel glass-depth-floating glass-border-shimmer overflow-hidden rounded-lg" aria-labelledby="home-title">
              <div class="grid gap-xl p-md lg:grid-cols-[var(--ui-layout-home-hero-grid)] lg:items-center lg:p-xl">
                <div class="grid gap-lg">
                  <div class="flex flex-wrap items-center gap-xs">
                    <app-badge tone="accent" label="Featured collection" />
                    <span class="type-label-sm text-text-secondary">Ready to shop</span>
                  </div>

                  <div class="grid gap-sm">
                    <h1 id="home-title" class="max-w-[var(--ui-container-md)] type-heading-xl text-text-primary md:type-display-lg">
                      Shop reliable products for everyday life.
                    </h1>
                    <p class="max-w-[var(--ui-container-md)] type-body-lg text-text-secondary">
                      Compare clear product details, see current availability, and move from cart to delivery with a checkout flow built for real orders.
                    </p>
                  </div>

                  <div class="flex flex-wrap gap-sm">
                    <a
                      class="inline-flex min-h-control-lg items-center rounded-md border-hairline border-glass-border bg-[linear-gradient(135deg,var(--ui-color-iridescent-violet),var(--ui-color-iridescent-cyan),var(--ui-color-iridescent-emerald))] px-lg py-sm type-label-lg text-text-on-primary shadow-glass-raised interactive-transition hover:shadow-glass-floating focus-visible:focus-ring"
                      routerLink="/products"
                    >
                      Shop products
                    </a>
                    <a
                      class="glass-panel glass-depth-raised inline-flex min-h-control-lg items-center rounded-md px-lg py-sm type-label-lg text-text-primary interactive-transition hover:shadow-glass-floating focus-visible:focus-ring"
                      [routerLink]="['/products', heroProduct.slug]"
                    >
                      View featured product
                    </a>
                  </div>

                  <dl class="grid gap-sm sm:grid-cols-3" aria-label="Storefront service details">
                    <div class="border-t border-glass-border pt-sm">
                      <dt class="type-label-sm text-text-muted">Inventory</dt>
                      <dd class="mt-2xs type-heading-sm text-text-primary">Verified at checkout</dd>
                    </div>
                    <div class="border-t border-glass-border pt-sm">
                      <dt class="type-label-sm text-text-muted">Checkout</dt>
                      <dd class="mt-2xs type-heading-sm text-text-primary">Review, delivery, payment</dd>
                    </div>
                    <div class="border-t border-glass-border pt-sm">
                      <dt class="type-label-sm text-text-muted">Support</dt>
                      <dd class="mt-2xs type-heading-sm text-text-primary">Track every order</dd>
                    </div>
                  </dl>
                </div>

                <div class="grid gap-sm">
                  <a class="glass-panel glass-depth-raised group block overflow-hidden rounded-lg focus-visible:focus-ring" [routerLink]="['/products', heroProduct.slug]">
                    <img class="aspect-[var(--ui-ratio-hero-media)] max-h-[var(--ui-layout-home-hero-media-max-block)] w-full object-cover interactive-transition group-hover:scale-[var(--ui-scale-hover-subtle)]" [src]="heroProduct.imageUrl" [alt]="heroProduct.name" />
                  </a>

                  <div class="glass-panel glass-depth-raised grid gap-2xs rounded-md p-sm">
                    <p class="type-label-sm text-text-muted">{{ heroProduct.category }}</p>
                    <div class="flex flex-wrap items-center justify-between gap-sm">
                      <div class="grid gap-2xs">
                        <h2 class="type-heading-sm text-text-primary">{{ heroProduct.name }}</h2>
                        <p class="type-body-sm text-text-secondary">{{ heroProduct.price | currency: heroProduct.currency }}</p>
                      </div>
                      <app-badge
                        [tone]="heroStockBadge().tone"
                        [label]="heroStockBadge().label"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          }

          <section class="grid gap-md overflow-hidden rounded-lg border-hairline border-glass-border bg-[radial-gradient(circle_at_15%_10%,var(--ui-color-aurora-violet),transparent_35%),radial-gradient(circle_at_85%_20%,var(--ui-color-aurora-cyan),transparent_32%),radial-gradient(circle_at_50%_110%,var(--ui-color-aurora-emerald),transparent_40%),var(--ui-color-glass-white-6)] p-md shadow-glass-floating backdrop-blur-xl lg:p-lg" aria-labelledby="featured-title">
            <div class="grid gap-md">
              <div class="flex flex-wrap items-end justify-between gap-md">
                <div class="grid gap-2xs">
                  <p class="type-label-sm text-text-muted">Featured products</p>
                  <h2 id="featured-title" class="type-heading-lg text-text-primary">Products worth a closer look</h2>
                  <p class="max-w-[var(--ui-container-md)] type-body-sm text-text-secondary">Compare price, availability, and customer feedback before adding items to your cart.</p>
                </div>
                <a class="type-label-md text-text-info focus-visible:focus-ring" routerLink="/products">See all products</a>
              </div>

              @if (data.featured.length || data.newArrivals.length) {
                <app-tabs [tabs]="collectionTabs" [activeId]="collectionTab()" (activeIdChange)="setCollectionTab($event)">
                  @switch (collectionTab()) {
                    @case ('new-arrivals') {
                      <div class="grid gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                      <div class="grid gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            </div>
          </section>

          <section class="grid gap-md" aria-labelledby="category-title">
            <div class="flex flex-wrap items-end justify-between gap-md">
              <div class="grid gap-2xs">
                <p class="type-label-sm text-text-muted">Departments</p>
                <h2 id="category-title" class="type-heading-lg text-text-primary">Shop by department</h2>
                <p class="max-w-[var(--ui-container-md)] type-body-sm text-text-secondary">Find products organized by category, with item counts and availability kept easy to scan.</p>
              </div>
              <a class="type-label-md text-text-info focus-visible:focus-ring" routerLink="/products">Browse all categories</a>
            </div>

            <div class="grid gap-md sm:grid-cols-2 lg:grid-cols-3" aria-label="Featured categories">
              @for (category of visibleCategories(); track category.id; let index = $index) {
                <a
                  [class]="categoryCardClasses(index)"
                  [routerLink]="['/products']"
                  [queryParams]="{ category: category.slug }"
                >
                  <div class="grid gap-sm">
                    <p class="type-label-sm text-text-muted">0{{ index + 1 }}</p>
                    <div class="grid gap-2xs">
                      <span class="type-heading-sm text-text-primary">{{ category.name }}</span>
                      <span class="type-body-sm text-text-secondary">{{ category.description || 'Shop available products in this department.' }}</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between gap-sm">
                    <span class="type-label-sm text-text-muted">{{ category.productCount }} products</span>
                    <span class="type-label-sm text-text-primary">Shop category</span>
                  </div>
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

          <section class="grid gap-lg" aria-labelledby="category-shelves-title">
            <div class="flex flex-wrap items-end justify-between gap-md">
              <div class="grid gap-2xs">
                <p class="type-label-sm text-text-muted">Category picks</p>
                <h2 id="category-shelves-title" class="type-heading-lg text-text-primary">Popular departments</h2>
                <p class="max-w-[var(--ui-container-md)] type-body-sm text-text-secondary">Browse a short selection from active departments with products ready to review.</p>
              </div>
              <a class="type-label-md text-text-info focus-visible:focus-ring" routerLink="/products">See all products</a>
            </div>

            <div class="grid gap-xl">
              @for (shelf of data.categoryShelves; track shelf.id) {
                <section class="grid gap-sm" [attr.aria-labelledby]="'category-shelf-title-' + shelf.id">
                  <div class="flex flex-wrap items-end justify-between gap-md">
                    <div class="grid gap-2xs">
                      <h3 [id]="'category-shelf-title-' + shelf.id" class="type-heading-md text-text-primary">{{ shelf.category.name }}</h3>
                      <p class="max-w-[var(--ui-container-md)] type-body-sm text-text-secondary">
                        {{ shelf.category.description || 'A focused selection from this department.' }}
                      </p>
                    </div>
                    <a
                      class="type-label-md text-text-info focus-visible:focus-ring"
                      routerLink="/products"
                      [queryParams]="{ category: shelf.category.slug }"
                    >
                      See more
                    </a>
                  </div>

                  <div class="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
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
            <p class="glass-panel glass-depth-raised rounded-md p-sm type-body-sm text-text-success" role="status">
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

  protected categoryCardClasses(index: number): string {
    const accents = ['border-iridescent-violet/70', 'border-iridescent-cyan/70', 'border-iridescent-emerald/70'] as const;
    const accent = accents[index % accents.length] ?? accents[0];

    return [
      'glass-panel',
      'glass-depth-raised',
      'grid',
      'min-h-[11rem]',
      'content-between',
      'gap-md',
      'rounded-md',
      'border-t-2',
      accent,
      'p-md',
      'interactive-transition',
      'hover:shadow-glass-floating',
      'focus-visible:focus-ring',
    ].join(' ');
  }
}

function productStockBadge(status: CatalogProduct['stockStatus']): { tone: 'warning' | 'accent' | 'success'; label: string } {
  switch (status) {
    case 'out-of-stock':
      return { tone: 'warning', label: 'Out of stock' };
    case 'low-stock':
      return { tone: 'accent', label: 'Low stock' };
    case 'in-stock':
      return { tone: 'success', label: 'Ready to ship' };
  }
}
