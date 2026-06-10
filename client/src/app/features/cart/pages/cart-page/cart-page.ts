import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { CartService, CartItem, GuestCartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, ErrorMessageComponent],
  styles: [`
    :host { display: block; }

    .cart-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 64px 32px;
      animation: fadeIn 0.8s var(--ease-out) both;
    }

    /* ─── Header ─── */
    .cart-header {
      margin-bottom: 48px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding-bottom: 24px;
    }

    .cart-eyebrow {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--color-amber);
      margin-bottom: 12px;
    }

    .cart-title {
      font-family: var(--font-display);
      font-size: 3rem;
      font-weight: 700;
      font-style: italic;
      color: var(--color-ivory);
      margin: 0;
      line-height: 1;
    }

    /* ─── List Layout ─── */
    .cart-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 40px;
      align-items: start;
    }

    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .cart-item {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 20px;
      background: var(--color-carbon);
      border: 1px solid var(--color-charcoal);
      border-radius: var(--radius-lg);
      transition: all 0.3s var(--ease-out);
      animation: fadeUp 0.6s var(--ease-out) both;
    }

    .cart-item:hover {
      border-color: rgba(201,148,58,0.25);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }

    .item-image-wrapper {
      width: 100px;
      height: 100px;
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--color-charcoal);
      flex-shrink: 0;
      border: 1px solid rgba(255,255,255,0.05);
    }

    .item-image {
      width: 100%;
      height: 100%;
      object-cover: cover;
      transition: transform 0.5s var(--ease-out);
    }

    .cart-item:hover .item-image { transform: scale(1.1); }

    .item-details { flex-grow: 1; min-width: 0; }

    .item-name {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-ivory);
      margin: 0 0 4px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .item-price-unit {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: var(--color-ivory-ghost);
      letter-spacing: 0.02em;
    }

    .item-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    /* ─── Quantity Controller ─── */
    .qty-ctrl {
      display: flex;
      align-items: center;
      background: var(--color-charcoal);
      border: 1px solid var(--color-muted);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .qty-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--color-ivory);
      font-size: 1.2rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .qty-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); }
    .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .qty-val {
      width: 36px;
      text-align: center;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--color-ivory);
      border-left: 1px solid var(--color-muted);
      border-right: 1px solid var(--color-muted);
    }

    .item-total {
      width: 100px;
      text-align: right;
      font-family: var(--font-mono);
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--color-ivory);
    }

    .btn-remove {
      padding: 8px;
      color: #f0a8a8;
      background: transparent;
      border: none;
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.6;
      transition: opacity 0.2s, color 0.2s;
    }

    .btn-remove:hover { opacity: 1; color: #ff5a5a; }

    /* ─── Summary Sidebar ─── */
    .cart-summary {
      position: sticky;
      top: 100px;
      background: var(--color-charcoal);
      border: 1px solid var(--color-charcoal);
      border-radius: var(--radius-xl);
      padding: 32px;
      box-shadow: var(--shadow-card);
      animation: fadeIn 0.8s 0.2s var(--ease-out) both;
    }

    .summary-title {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 600;
      font-style: italic;
      color: var(--color-ivory);
      margin: 0 0 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .summary-label {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-ivory-ghost);
    }

    .summary-value {
      font-family: var(--font-mono);
      font-size: 0.95rem;
      color: var(--color-ivory);
    }

    .summary-total-row {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .total-label {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--color-ivory);
    }

    .total-value {
      font-family: var(--font-mono);
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--color-amber);
    }

    .btn-checkout {
      width: 100%;
      margin-top: 32px;
      padding: 16px;
      background: linear-gradient(135deg, var(--color-amber), var(--color-amber-light));
      color: var(--color-void);
      border: none;
      border-radius: var(--radius-sm);
      font-family: var(--font-body);
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      text-decoration: none;
      display: block;
      text-align: center;
      transition: all 0.25s var(--ease-out);
    }

    .btn-checkout:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(201,148,58,0.35);
    }

    /* ─── Empty State ─── */
    .empty-cart {
      text-align: center;
      padding: 120px 0;
      animation: fadeUp 0.8s var(--ease-out) both;
    }

    .empty-title {
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-style: italic;
      color: var(--color-ivory-ghost);
      margin-bottom: 16px;
    }

    .btn-browse {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 32px;
      border: 1px solid var(--color-amber);
      color: var(--color-amber);
      text-decoration: none;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      border-radius: var(--radius-sm);
      transition: all 0.25s;
    }

    .btn-browse:hover {
      background: var(--color-amber);
      color: var(--color-void);
    }

    @media (max-width: 900px) {
      .cart-grid { grid-template-columns: 1fr; }
      .cart-summary { position: static; }
      .cart-item { flex-wrap: wrap; }
      .item-total { width: auto; flex-grow: 1; }
    }
  `],
  template: `
    <div class="cart-container">
      <div class="cart-header">
        <p class="cart-eyebrow">Checkout</p>
        <h1 class="cart-title">Your Selection</h1>
      </div>

      @if (isLoading()) {
        <div class="mt-20 flex justify-center">
          <app-loading-spinner size="md" />
        </div>
      } @else if (error()) {
        <div class="mt-10">
          <app-error-message [message]="error()" />
        </div>
      } @else if (isEmpty()) {
        <div class="empty-cart">
          <h2 class="empty-title">Your cart is currently silent.</h2>
          <p style="color: var(--color-ivory-ghost)">Discover pieces that resonate with your style.</p>
          <a routerLink="/products" class="btn-browse">Explore Collection</a>
        </div>
      } @else {
        <div class="cart-grid">
          
          <div class="cart-items">
            @if (authService.isLoggedIn()) {
              @for (item of authCart()?.items ?? []; track item.id; let i = $index) {
                <div class="cart-item" [style.animation-delay]="i * 0.08 + 's'">
                  <div class="item-image-wrapper">
                    @if (item.primary_image) {
                      <img [src]="item.primary_image" [alt]="item.product_name" class="item-image" />
                    } @else {
                      <div class="flex h-full w-full items-center justify-center text-[10px] text-slate-500 uppercase tracking-tighter">No image</div>
                    }
                  </div>
                  
                  <div class="item-details">
                    <p class="item-name">{{ item.product_name }}</p>
                    <p class="item-price-unit">&#36;{{ item.unit_price_snapshot }} <span style="opacity:0.4">/ unit</span></p>
                  </div>

                  <div class="item-controls">
                    <div class="qty-ctrl">
                      <button class="qty-btn" [disabled]="item.quantity <= 1" (click)="changeQty(item, item.quantity - 1)">−</button>
                      <span class="qty-val">{{ item.quantity }}</span>
                      <button class="qty-btn" (click)="changeQty(item, item.quantity + 1)">+</button>
                    </div>
                    
                    <p class="item-total">&#36;{{ item.line_total }}</p>
                    
                    <button class="btn-remove" (click)="removeItem(item)">Remove</button>
                  </div>
                </div>
              }
            } @else {
              @for (item of guestCart(); track item.product; let i = $index) {
                <div class="cart-item" [style.animation-delay]="i * 0.08 + 's'">
                  <div class="item-image-wrapper">
                    @if (item.primary_image) {
                      <img [src]="item.primary_image" [alt]="item.product_name" class="item-image" />
                    } @else {
                      <div class="flex h-full w-full items-center justify-center text-[10px] text-slate-500 uppercase tracking-tighter">No image</div>
                    }
                  </div>
                  
                  <div class="item-details">
                    <p class="item-name">{{ item.product_name }}</p>
                    <p class="item-price-unit">&#36;{{ item.product_price }} <span style="opacity:0.4">/ unit</span></p>
                  </div>

                  <div class="item-controls">
                    <div class="qty-ctrl">
                      <button class="qty-btn" [disabled]="item.quantity <= 1" (click)="changeGuestQty(item, item.quantity - 1)">−</button>
                      <span class="qty-val">{{ item.quantity }}</span>
                      <button class="qty-btn" (click)="changeGuestQty(item, item.quantity + 1)">+</button>
                    </div>
                    
                    <p class="item-total">
                      &#36;{{ (parseFloat(item.product_price) * item.quantity).toFixed(2) }}
                    </p>
                    
                    <button class="btn-remove" (click)="removeGuestItem(item)">Remove</button>
                  </div>
                </div>
              }
            }
          </div>

          <aside class="cart-summary">
            <h3 class="summary-title">Summary</h3>
            
            <div class="summary-row">
              <span class="summary-label">Subtotal</span>
              <span class="summary-value">
                @if (authService.isLoggedIn()) {
                  &#36;{{ cartService.cart()?.subtotal ?? '0.00' }}
                } @else {
                  &#36;{{ cartService.guestSubtotal.toFixed(2) }}
                }
              </span>
            </div>
            
            <div class="summary-row">
              <span class="summary-label">Shipping</span>
              <span class="summary-value">Calculated at next step</span>
            </div>

            <div class="summary-row summary-total-row">
              <span class="total-label">Total</span>
              <span class="total-value">
                @if (authService.isLoggedIn()) {
                  &#36;{{ cartService.cart()?.subtotal ?? '0.00' }}
                } @else {
                  &#36;{{ cartService.guestSubtotal.toFixed(2) }}
                }
              </span>
            </div>

            <a routerLink="/checkout" class="btn-checkout">Proceed to Checkout</a>
            
            <p style="margin-top: 24px; font-size: 0.72rem; color: var(--color-ivory-ghost); text-align: center; font-family: var(--font-mono); letter-spacing: 0.05em;">
              Complimentary luxury packaging included.
            </p>
          </aside>

        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);

  protected readonly isLoading = signal(false);
  protected readonly error = signal('');

  protected readonly authCart = this.cartService.cart;
  protected readonly guestCart = this.cartService.guestItems;

  protected readonly parseFloat = parseFloat;

  protected isEmpty(): boolean {
    if (this.authService.isLoggedIn()) {
      return (this.cartService.cart()?.items.length ?? 0) === 0;
    }
    return this.cartService.guestItems().length === 0;
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.isLoading.set(true);
      this.cartService
        .loadCart()
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          error: () => this.error.set('Could not load your cart. Please try again.'),
        });
    }
  }

  protected changeQty(item: CartItem, quantity: number): void {
    this.cartService.updateItem(item.id, quantity).subscribe({
      error: () => this.error.set('Could not update quantity.'),
    });
  }

  protected removeItem(item: CartItem): void {
    this.cartService.removeItem(item.id).subscribe({
      error: () => this.error.set('Could not remove item.'),
    });
  }

  protected changeGuestQty(item: GuestCartItem, quantity: number): void {
    this.cartService.updateGuestItem(item.product, quantity);
  }

  protected removeGuestItem(item: GuestCartItem): void {
    this.cartService.removeGuestItem(item.product);
  }
}
