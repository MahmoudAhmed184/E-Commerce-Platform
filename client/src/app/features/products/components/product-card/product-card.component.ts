import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import type { UiProductCardProduct } from '../../../../core/models/commerce-ui/commerce-ui.model';

export type ProductCardViewMode = 'grid' | 'list';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [BadgeComponent, ButtonComponent, CurrencyPipe, RouterLink, SkeletonLoaderComponent, StarRatingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (loading()) {
      <article class="glass-panel glass-depth-raised grid gap-sm overflow-hidden rounded-md p-sm" aria-busy="true">
        <app-skeleton-loader shape="media" label="Loading product image" />
        <app-skeleton-loader [rows]="3" label="Loading product details" />
      </article>
    } @else if (product(); as item) {
      <article [class]="cardClasses()" [attr.aria-disabled]="isDisabled()">
        <a
          [class]="imageClasses()"
          [routerLink]="['/products', item.slug]"
          [attr.aria-label]="item.name + ', ' + (item.price | currency: item.currency)"
          (click)="selected.emit(item)"
        >
          <img class="h-full w-full object-cover interactive-transition group-hover:scale-[var(--ui-scale-hover-subtle)]" [src]="item.imageUrl" [alt]="item.name" />
        </a>

        <div class="grid min-w-0 flex-1 gap-sm p-md">
          <div class="flex flex-wrap items-center gap-xs">
            <p class="type-label-sm text-text-muted">{{ item.category }}</p>
            @if (item.saleLabel) {
              <app-badge tone="accent" [label]="item.saleLabel" />
            }
            @if (item.stockStatus === 'out-of-stock') {
              <app-badge tone="warning" label="Out of stock" />
            }
          </div>

          <h3 class="type-heading-sm text-text-primary">
            <a class="focus-visible:focus-ring" [routerLink]="['/products', item.slug]">{{ item.name }}</a>
          </h3>

          <div class="flex flex-wrap items-center gap-xs">
            @if ((item.reviewCount ?? 0) > 0 && item.rating !== undefined) {
              <app-star-rating [value]="item.rating" [readonly]="true" size="sm" />
              <p class="type-body-sm text-text-muted">{{ item.reviewCount }} reviews</p>
            } @else {
              <p class="type-body-sm text-text-muted">No reviews yet</p>
            }
          </div>

          <div class="mt-auto flex flex-wrap items-end justify-between gap-sm border-t-hairline border-glass-border pt-sm">
            <div class="grid gap-2xs">
              <p class="type-label-sm text-text-muted">Price</p>
              <p class="type-heading-sm text-text-primary">{{ item.price | currency: item.currency }}</p>
            </div>
            @if (showQuickAdd()) {
              <app-button size="sm" [disabled]="isDisabled()" [loading]="adding()" (pressed)="addToCart.emit(item)">
                Add to cart
              </app-button>
            }
          </div>
        </div>
      </article>
    }
  `,
})
export class ProductCardComponent {
  readonly product = input<UiProductCardProduct | null>(null);
  readonly viewMode = input<ProductCardViewMode>('grid');
  readonly showQuickAdd = input(true);
  readonly loading = input(false);
  readonly outOfStock = input(false);
  readonly adding = input(false);

  readonly addToCart = output<UiProductCardProduct>();
  readonly selected = output<UiProductCardProduct>();

  protected readonly isDisabled = computed(() => this.outOfStock() || this.product()?.stockStatus === 'out-of-stock');
  protected readonly imageClasses = computed(() => [
    'block',
    'overflow-hidden',
    'bg-glass-white-6',
    'focus-visible:focus-ring',
    this.viewMode() === 'grid'
      ? 'aspect-[var(--ui-ratio-product-media)] max-h-[var(--ui-layout-product-card-media-max-block)] rounded-t-md'
      : 'w-thumbnail-lg shrink-0 rounded-s-md',
  ].join(' '));
  protected readonly cardClasses = computed(() => [
    'group',
    'relative',
    'overflow-hidden',
    'rounded-md',
    'glass-panel',
    'glass-depth-raised',
    'glass-border-shimmer',
    'interactive-transition',
    'hover:-translate-y-[var(--ui-space-2xs)]',
    'hover:shadow-glass-floating',
    this.viewMode() === 'grid' ? 'grid h-full' : 'flex',
    this.isDisabled() ? 'opacity-disabled' : '',
  ].filter(Boolean).join(' '));
}
