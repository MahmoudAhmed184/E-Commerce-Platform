import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import type { UiProductCardProduct } from '../../../../core/models/commerce-ui/commerce-ui.model';

export type ProductCardViewMode = 'grid' | 'list';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [ButtonComponent, CurrencyPipe, RouterLink, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (loading()) {
      <article class="rounded-md border-hairline border-border-default bg-surface-raised p-md shadow-xs" aria-busy="true">
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
          <img
            class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            [src]="item.imageUrl"
            [alt]="item.name"
          />
        </a>

        <div class="flex min-w-0 flex-1 flex-col space-y-2 p-md">
          <p class="type-label-sm text-text-muted">
            {{ item.category }}
          </p>

          <h3 class="type-label-md text-text-primary line-clamp-2">
            <a class="rounded-sm text-text-primary focus-visible:focus-ring" [routerLink]="['/products', item.slug]">{{ item.name }}</a>
          </h3>

          <p class="type-label-lg text-text-primary">
            {{ item.price | currency: item.currency }}
          </p>

          @if (item.stockStatus === 'low-stock') {
            <div class="flex items-center gap-1.5">
              <span class="inline-block size-2xs rounded-full bg-warning-600"></span>
              <span class="type-label-sm text-text-warning">Low stock</span>
            </div>
          } @else if (item.stockStatus === 'out-of-stock') {
            <span class="type-label-sm text-text-muted">Unavailable</span>
          }

          @if (showQuickAdd()) {
            <div class="mt-auto pt-2">
              <app-button
                variant="primary"
                size="sm"
                [fullWidth]="true"
                [disabled]="isDisabled()"
                [loading]="adding()"
                (pressed)="addToCart.emit(item)"
              >
                Add to cart
              </app-button>
            </div>
          }
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
    'bg-surface-subtle',
    'focus-visible:focus-ring',
    this.viewMode() === 'grid'
      ? 'aspect-square rounded-t-md'
      : 'w-thumbnail-lg shrink-0 rounded-s-md',
  ].join(' '));
  protected readonly cardClasses = computed(() => [
    'group',
    'relative',
    'overflow-hidden',
    'rounded-md',
    'border-hairline',
    'border-border-default',
    'bg-surface-raised',
    'interactive-transition',
    'shadow-xs',
    'cursor-pointer',
    'hover:border-border-focus',
    'hover:shadow-md',
    'hover:-translate-y-0.5',
    this.viewMode() === 'grid' ? 'flex flex-col h-full' : 'flex',
  ].filter(Boolean).join(' '));
}
