import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, type OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideCreditCard, LucideLifeBuoy, LucidePackageCheck, LucidePackageX, LucideShieldCheck } from '@lucide/angular';
import { finalize } from 'rxjs';

import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { AccordionComponent, type AccordionItem } from '../../../../shared/components/accordion/accordion.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { BreadcrumbComponent, type BreadcrumbItem } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { ImageGalleryComponent } from '../../../../shared/components/image-gallery/image-gallery.component';
import { QuantityStepperComponent } from '../../../../shared/components/quantity-stepper/quantity-stepper.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { TabsComponent, type UiTab } from '../../../../shared/components/tabs/tabs.component';
import { ReviewCardComponent } from '../../../reviews/components/review-card/review-card.component';
import { CatalogPageDataService, type CatalogProduct } from '../../services/catalog-page-data/catalog-page-data.service';
import { ProductCartWorkflowService } from '../../services/product-cart-workflow/product-cart-workflow.service';

type DetailState =
  | { kind: 'loading' }
  | { kind: 'loaded'; product: CatalogProduct }
  | { kind: 'error'; message: string };

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [
    AccordionComponent,
    AlertBannerComponent,
    BadgeComponent,
    BreadcrumbComponent,
    ButtonComponent,
    CurrencyPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    ImageGalleryComponent,
    LucideCreditCard,
    LucideLifeBuoy,
    LucidePackageCheck,
    LucidePackageX,
    LucideShieldCheck,
    QuantityStepperComponent,
    ReviewCardComponent,
    RouterLink,
    SkeletonLoaderComponent,
    StarRatingComponent,
    TabsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-surface-page">
      <div class="mx-auto grid max-w-[var(--ui-container-xl)] gap-xl px-gutter-xs py-xl md:px-gutter-sm lg:px-gutter-lg">
        @if (state().kind === 'loading') {
          <section class="grid gap-xl lg:grid-cols-[var(--ui-layout-product-detail-grid)]" aria-label="Loading product">
            <app-skeleton-loader shape="media" label="Loading product gallery" />
            <div class="grid content-start gap-md">
              <app-skeleton-loader [rows]="5" label="Loading product details" />
              <app-skeleton-loader shape="block" label="Loading product actions" />
            </div>
          </section>
        } @else if (state().kind === 'error') {
          <app-error-state
            statusCode="404"
            title="Product not found"
            [message]="errorMessage()"
            [retry]="{ label: 'Retry', variant: 'primary' }"
            homeLink="/products"
            (retryPressed)="reload()"
          />
        } @else if (product(); as item) {
          <app-breadcrumb [items]="breadcrumbItems" [currentLabel]="item.name" />

          @if (statusMessage()) {
            <app-alert-banner tone="success" title="Cart updated" [message]="statusMessage()" [dismissible]="true" (dismissed)="statusMessage.set('')" />
          }

          <section class="grid gap-xl lg:grid-cols-[var(--ui-layout-product-detail-grid)] lg:items-start" aria-labelledby="product-title">
            <div class="grid min-w-0 gap-md lg:sticky lg:top-[8rem]">
              <div class="grid max-w-[var(--ui-container-md)] gap-xs">
                <p class="type-label-sm text-text-muted">{{ item.category }}</p>
                <h1 id="product-title" class="type-heading-xl text-text-primary md:type-display-lg">{{ item.name }}</h1>
                <p class="type-body-md text-text-secondary">{{ item.description }}</p>
              </div>
              <app-image-gallery [images]="item.images" [selectedIndex]="selectedImageIndex()" (selectedIndexChange)="selectedImageIndex.set($event)" />
            </div>

            <aside class="surface-panel surface-depth-floating grid min-w-0 gap-md rounded-md p-md lg:sticky lg:top-[8rem] lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:p-md lg:[scrollbar-gutter:stable] xl:p-lg">
              <div class="grid gap-md">
                <div class="flex flex-wrap items-center gap-xs">
                  <app-badge tone="neutral" [label]="item.category" />
                  <app-badge [tone]="stockSummary().tone" [label]="stockSummary().label" />
                </div>
                <div class="flex flex-wrap items-start justify-between gap-md">
                  <div class="grid gap-xs">
                    <h2 class="type-heading-md text-text-primary">Purchase details</h2>
                    <div class="flex flex-wrap items-center gap-xs">
                      @if (reviewSummary().count > 0) {
                        <app-star-rating [value]="item.rating ?? 0" [readonly]="true" size="sm" />
                        <p class="type-body-sm text-text-muted">{{ reviewSummary().count }} reviews</p>
                      } @else {
                        <p class="type-body-sm text-text-muted">No reviews yet</p>
                      }
                    </div>
                  </div>
                  <div class="rounded-md border-hairline border-border-default bg-surface-raised px-sm py-xs text-end shadow-xs">
                    <p class="type-label-sm text-text-muted">Price</p>
                    <p class="type-heading-lg text-text-primary">{{ item.price | currency: item.currency }}</p>
                  </div>
                </div>
              </div>

              @if (item.stockStatus !== 'out-of-stock') {
                <div class="flex gap-sm rounded-md border-hairline border-border-default bg-surface-raised p-sm text-text-secondary shadow-xs" role="status">
                  <span class="inline-flex size-control-sm shrink-0 items-center justify-center rounded-md bg-surface-subtle text-text-success">
                    <svg lucideShieldCheck class="size-icon-md" aria-hidden="true"></svg>
                  </span>
                  <div class="min-w-0">
                    <p class="type-label-md text-text-primary">Inventory verified at checkout</p>
                    <p class="mt-2xs type-body-sm">Stock is checked again before your order is submitted.</p>
                  </div>
                </div>
              }

              <dl class="grid gap-xs lg:grid-cols-2">
                <div class="flex gap-sm rounded-md bg-surface-raised p-sm shadow-xs lg:col-span-2">
                  <svg lucideCreditCard class="mt-2xs size-icon-md shrink-0 text-icon-muted" aria-hidden="true"></svg>
                  <div class="min-w-0">
                    <dt class="type-label-sm text-text-muted">Checkout</dt>
                    <dd class="mt-2xs type-body-sm text-text-primary">Review, delivery, and payment</dd>
                  </div>
                </div>
                <div class="flex gap-sm rounded-md bg-surface-raised p-sm shadow-xs">
                  <svg lucidePackageCheck class="mt-2xs size-icon-md shrink-0 text-icon-muted" aria-hidden="true"></svg>
                  <div class="min-w-0">
                    <dt class="type-label-sm text-text-muted">Availability</dt>
                    <dd class="mt-2xs type-body-sm text-text-primary">{{ stockSummary().label }}</dd>
                  </div>
                </div>
                <div class="flex gap-sm rounded-md bg-surface-raised p-sm shadow-xs">
                  <svg lucideLifeBuoy class="mt-2xs size-icon-md shrink-0 text-icon-muted" aria-hidden="true"></svg>
                  <div class="min-w-0">
                    <dt class="type-label-sm text-text-muted">Support</dt>
                    <dd class="mt-2xs type-body-sm text-text-primary">Tracking and order help</dd>
                  </div>
                </div>
              </dl>

              @if (item.stockStatus === 'out-of-stock') {
                <section class="grid gap-sm rounded-md border-hairline border-border-default bg-surface-subtle p-md text-text-secondary shadow-xs" aria-live="polite">
                  <div class="flex gap-sm">
                    <svg lucidePackageX class="mt-2xs size-icon-md shrink-0" aria-hidden="true"></svg>
                    <div class="min-w-0">
                      <h3 class="type-heading-sm text-text-primary">Unavailable</h3>
                      <p class="mt-2xs type-body-sm">Choose another available product or check back later.</p>
                    </div>
                  </div>
                  <app-button variant="secondary" size="md" [fullWidth]="true" (pressed)="browseProducts()">Browse products</app-button>
                </section>
              } @else {
                <div class="grid gap-sm">
                  <app-quantity-stepper
                    [value]="quantity()"
                    [max]="maxQuantity()"
                    [itemLabel]="item.name"
                    [error]="quantityError()"
                    (valueChange)="quantity.set($event)"
                  />

                  <app-button
                    size="lg"
                    [fullWidth]="true"
                    [loading]="addingToCart()"
                    [disabled]="!!quantityError()"
                    (pressed)="addToCart(item)"
                  >
                    Add to cart
                  </app-button>
                </div>
              }
            </aside>
          </section>

          <section class="grid gap-lg lg:grid-cols-[var(--ui-layout-product-meta-grid)]">
            <div class="surface-panel surface-depth-raised grid gap-md rounded-md p-md" aria-labelledby="details-title">
              <div class="grid gap-2xs">
                <p class="type-label-sm text-muted-foreground">Details</p>
                <h2 id="details-title" class="type-heading-lg text-card-foreground">Product information</h2>
              </div>

              <app-tabs [tabs]="contentTabs" [activeId]="contentTab()" (activeIdChange)="setContentTab($event)">
                @switch (contentTab()) {
                  @case ('description') {
                    <p class="type-body-md text-muted-foreground">{{ item.description }}</p>
                  }
                  @case ('specs') {
                    <dl class="grid gap-sm">
                      @for (spec of item.specs; track spec.id) {
                        <div class="flex justify-between gap-md border-b border-border-default pb-xs">
                          <dt class="type-body-sm text-muted-foreground">{{ spec.label }}</dt>
                          <dd class="type-body-sm text-card-foreground">{{ spec.value }}</dd>
                        </div>
                      } @empty {
                        <p class="type-body-sm text-muted-foreground">Detailed specifications will be added soon.</p>
                      }
                    </dl>
                  }
                  @default {
                    <ul class="grid gap-xs type-body-md text-muted-foreground">
                      @for (feature of item.features; track feature.id) {
                        <li class="flex gap-xs">
                          <span class="text-text-success" aria-hidden="true">✓</span>
                          <span>{{ feature.label }}</span>
                        </li>
                      } @empty {
                        <li>Product highlights will be added soon.</li>
                      }
                    </ul>
                  }
                }
              </app-tabs>
            </div>

            <div class="surface-panel surface-depth-raised grid gap-md rounded-md p-md">
              <div class="grid gap-2xs">
                <p class="type-label-sm text-muted-foreground">Policies</p>
                <h2 class="type-heading-lg text-card-foreground">Shipping and care</h2>
              </div>
              <app-accordion [items]="policyItems()" [defaultOpenIds]="['shipping']" />
            </div>
          </section>

          <section class="grid gap-md" aria-labelledby="reviews-title">
            @defer (on viewport) {
              <div class="grid gap-2xs">
                <p class="type-label-sm text-text-muted">Reviews</p>
                <h2 id="reviews-title" class="type-heading-lg text-text-primary">Customer reviews</h2>
              </div>

              @if (item.reviews.length) {
                <div class="grid gap-md md:grid-cols-2">
                  @for (review of item.reviews; track review.id) {
                    <app-review-card [review]="review" />
                  }
                </div>
              } @else {
                <app-empty-state
                  type="reviews"
                  title="No reviews yet"
                  message="Be the first customer to review this item after purchase."
                  [action]="{ label: 'Continue shopping', variant: 'secondary' }"
                  (actionPressed)="browseProducts()"
                />
              }
            } @placeholder {
              <app-skeleton-loader [rows]="3" label="Loading product reviews" />
            }
          </section>

          <nav class="flex flex-wrap gap-sm" aria-label="Product actions">
            <app-button variant="secondary" [routerLink]="'/products'">
              Back to products
            </app-button>
            <app-button [routerLink]="'/cart'">
              View cart
            </app-button>
          </nav>
        }
      </div>
    </main>
  `,
})
export class ProductDetailPage implements OnInit {
  private readonly catalogData = inject(CatalogPageDataService);
  private readonly cartWorkflow = inject(ProductCartWorkflowService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly breadcrumbItems: readonly BreadcrumbItem[] = [{ label: 'Products', routerLink: '/products' }];
  protected readonly state = signal<DetailState>({ kind: 'loading' });
  protected readonly selectedImageIndex = signal(0);
  protected readonly quantity = signal(1);
  protected readonly contentTab = signal<'highlights' | 'description' | 'specs'>('highlights');
  protected readonly addingToCart = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly contentTabs: readonly UiTab[] = [
    { id: 'highlights', label: 'Highlights' },
    { id: 'description', label: 'Description' },
    { id: 'specs', label: 'Specs' },
  ];
  protected readonly product = computed(() => {
    const state = this.state();
    return state.kind === 'loaded' ? state.product : null;
  });
  protected readonly errorMessage = computed(() => {
    const state = this.state();
    return state.kind === 'error' ? state.message : '';
  });
  protected readonly maxQuantity = computed(() => Math.max(this.product()?.inventory ?? 1, 1));
  protected readonly quantityError = computed(() => {
    const item = this.product();
    if (!item || item.stockStatus === 'out-of-stock') {
      return null;
    }
    if (this.quantity() > item.inventory) {
      return `Only ${item.inventory} available.`;
    }
    return null;
  });
  protected readonly stockSummary = computed(() => productStockSummary(this.product()));
  protected readonly reviewSummary = computed(() => productReviewSummary(this.product()));
  protected readonly policyItems = computed(() => {
    const item = this.product();
    return item ? buildPolicyItems(item) : [];
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.load(params.get('slug') ?? '');
    });
  }

  protected reload(): void {
    this.load(this.route.snapshot.paramMap.get('slug') ?? '');
  }

  protected addToCart(product: CatalogProduct): void {
    this.addingToCart.set(true);
    this.statusMessage.set('');
    this.cartWorkflow
      .addProduct(product, this.quantity())
      .pipe(finalize(() => this.addingToCart.set(false)))
      .subscribe((result) => this.statusMessage.set(result.message));
  }

  protected browseProducts(): void {
    void this.router.navigateByUrl('/products');
  }

  protected setContentTab(value: string): void {
    this.contentTab.set(value === 'description' || value === 'specs' ? value : 'highlights');
  }

  private load(slug: string): void {
    if (!slug) {
      this.state.set({ kind: 'error', message: 'Choose a product from the listing to continue.' });
      return;
    }
    this.state.set({ kind: 'loading' });
    this.selectedImageIndex.set(0);
    this.quantity.set(1);
    this.catalogData.getProduct(slug).subscribe({
      next: (product) => this.state.set({ kind: 'loaded', product }),
      error: () => this.state.set({ kind: 'error', message: 'Try again or return to the product listing.' }),
    });
  }
}

function productStockSummary(product: CatalogProduct | null): { tone: 'outline' | 'accent' | 'success'; label: string } {
  if (!product || product.stockStatus === 'out-of-stock') {
    return { tone: 'outline', label: 'Unavailable' };
  }
  if (product.stockStatus === 'low-stock') {
    return { tone: 'accent', label: `Low stock (${product.inventory} left)` };
  }

  return { tone: 'success', label: 'In stock' };
}

function productReviewSummary(product: CatalogProduct | null): { count: number } {
  return { count: product?.reviewCount ?? product?.reviews.length ?? 0 };
}

function buildPolicyItems(product: CatalogProduct): readonly AccordionItem[] {
  return [
    {
      id: 'shipping',
      title: 'Shipping',
      content:
        product.stockStatus === 'out-of-stock'
          ? 'This item is temporarily unavailable. Browse the catalog for in-stock alternatives before checkout.'
          : 'Orders are checked for availability before submission and prepared for delivery after confirmation.',
    },
    {
      id: 'returns',
      title: 'Returns',
      content: 'Keep your order number available for support. Eligible return and payment issues are handled through order support.',
    },
    {
      id: 'care',
      title: 'Care instructions',
      content: `Use ${product.name} according to the product guidance included with the shipment.`,
    },
  ];
}
