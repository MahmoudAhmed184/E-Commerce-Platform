import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { QuantityStepperComponent } from '../../../../shared/components/quantity-stepper/quantity-stepper.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import type { UiCartItem } from '../../../../core/models/commerce-ui/commerce-ui.model';

@Component({
  selector: 'app-cart-item-row',
  standalone: true,
  imports: [ButtonComponent, CurrencyPipe, QuantityStepperComponent, RouterLink, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (loading()) {
      <div class="glass-panel glass-depth-raised rounded-md p-md" aria-busy="true">
        <app-skeleton-loader shape="block" [count]="2" label="Loading cart item" />
      </div>
    } @else if (item(); as cartItem) {
      <article class="glass-panel glass-depth-raised grid gap-md rounded-lg p-md md:grid-cols-[var(--ui-layout-nav-grid)]">
        <a class="block size-thumbnail-md overflow-hidden rounded-md bg-glass-white-6 shadow-glass-flat focus-visible:focus-ring" [routerLink]="cartItem.productSlug ? ['/products', cartItem.productSlug] : null">
          <img class="h-full w-full object-cover" [src]="cartItem.imageUrl" [alt]="cartItem.productName" />
        </a>

        <div class="grid gap-xs">
          <h3 class="type-heading-sm text-text-primary">{{ cartItem.productName }}</h3>
          <p class="type-body-sm text-text-muted">{{ cartItem.unitPrice | currency: cartItem.currency }} each</p>
          @if (stockError()) {
            <p class="type-body-sm text-text-error" aria-live="polite">{{ stockError() }}</p>
          } @else if (cartItem.stockStatus) {
            <p class="type-body-sm text-text-muted">{{ cartItem.stockStatus }}</p>
          }
        </div>

        <div class="grid gap-sm justify-self-start md:justify-items-end">
          <app-quantity-stepper
            [value]="quantity()"
            [max]="maxQuantity()"
            [itemLabel]="cartItem.productName"
            [loading]="updating()"
            [error]="stockError()"
            (valueChange)="quantityChange.emit($event)"
          />
          <div class="flex items-center gap-sm">
            <p class="type-label-md text-text-primary">{{ lineTotal() | currency: cartItem.currency }}</p>
            <app-button variant="ghost" size="sm" [loading]="removing()" (pressed)="remove.emit(cartItem)">
              Remove
            </app-button>
          </div>
        </div>
      </article>
    }
  `,
})
export class CartItemRowComponent {
  readonly item = input<UiCartItem | null>(null);
  readonly quantity = input(1);
  readonly maxQuantity = input(99);
  readonly updating = input(false);
  readonly removing = input(false);
  readonly loading = input(false);
  readonly stockError = input<string | null>(null);

  readonly quantityChange = output<number>();
  readonly remove = output<UiCartItem>();

  protected readonly lineTotal = computed(() => (this.item()?.unitPrice ?? 0) * this.quantity());
}
