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
      <article class="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm" aria-busy="true">
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

        <div class="flex min-w-0 flex-1 flex-col gap-2 p-4">
          <p class="font-mono text-xs font-medium uppercase tracking-wider text-neutral-400">
            {{ item.category }}
          </p>

          <h3 class="text-sm font-semibold leading-snug text-neutral-900 line-clamp-2">
            <a class="focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-sm" [routerLink]="['/products', item.slug]">{{ item.name }}</a>
          </h3>

          <p class="font-mono text-base font-bold text-neutral-900">
            {{ item.price | currency: item.currency }}
          </p>

          @if (item.stockStatus === 'low-stock') {
            <div class="flex items-center gap-1.5">
              <span class="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              <span class="text-xs text-amber-600">Low stock</span>
            </div>
          } @else if (item.stockStatus === 'out-of-stock') {
            <span class="text-xs text-neutral-400">Unavailable</span>
          }

          @if (showQuickAdd()) {
            <div class="mt-auto pt-2">
              <app-button
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
    'bg-neutral-50',
    'focus-visible:ring-2',
    'focus-visible:ring-indigo-500',
    'focus-visible:ring-offset-2',
    this.viewMode() === 'grid'
      ? 'aspect-square rounded-t-xl'
      : 'w-thumbnail-lg shrink-0 rounded-s-xl',
  ].join(' '));
  protected readonly cardClasses = computed(() => [
    'group',
    'relative',
    'overflow-hidden',
    'rounded-xl',
    'border',
    'border-neutral-100',
    'bg-white',
    'shadow-sm',
    'transition-all',
    'duration-150',
    'cursor-pointer',
    'hover:border-indigo-200',
    'hover:shadow-[0_4px_16px_rgba(79,70,229,0.08)]',
    'hover:-translate-y-0.5',
    this.viewMode() === 'grid' ? 'flex flex-col h-full' : 'flex',
    this.isDisabled() ? 'opacity-40' : '',
  ].filter(Boolean).join(' '));
}
