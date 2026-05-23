import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="glass-panel glass-depth-flat mt-auto rounded-none border-x-0 border-b-0 border-t border-glass-border text-text-primary">
      <div class="border-b border-glass-border">
        <div class="mx-auto grid max-w-[var(--ui-container-2xl)] gap-md px-gutter-xs py-lg md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:px-gutter-sm lg:px-gutter-lg">
          <div class="grid gap-2xs">
            <p class="type-label-sm text-text-muted">Customer care</p>
            <p class="type-heading-sm text-text-primary">Need help with an order, delivery, return, or product question?</p>
          </div>
          <a class="type-label-md text-text-primary focus-visible:focus-ring" href="mailto:support@vendra.com">support@vendra.com</a>
          <p class="type-body-sm text-text-muted">Sunday to Thursday, 09:00 to 17:00</p>
        </div>
      </div>

      <div class="mx-auto grid max-w-[var(--ui-container-2xl)] gap-xl px-gutter-xs py-xl md:grid-cols-2 md:px-gutter-sm lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))] lg:px-gutter-lg">
        <section class="grid gap-sm">
          <div>
            <div class="mb-xs inline-flex items-center gap-xs">
              <img class="size-10 object-contain" src="logo-icon.png?v=20260522" alt="" width="1024" height="1024" />
              <p class="type-label-sm text-text-muted">Vendra</p>
            </div>
            <h2 class="type-heading-md text-text-primary">Reliable shopping for everyday products.</h2>
          </div>
          <p class="max-w-[22rem] type-body-sm text-text-secondary">
            Compare products, review live availability, and move through checkout with order tracking and support close at hand.
          </p>
        </section>

        <section class="grid gap-xs">
          <h2 class="type-heading-sm text-text-primary">Shop</h2>
          <a class="type-body-sm text-text-secondary hover:text-text-primary focus-visible:focus-ring" routerLink="/products">All products</a>
          <a class="type-body-sm text-text-secondary hover:text-text-primary focus-visible:focus-ring" routerLink="/products">New arrivals</a>
          <a class="type-body-sm text-text-secondary hover:text-text-primary focus-visible:focus-ring" routerLink="/products">Featured products</a>
        </section>

        <section class="grid gap-xs">
          <h2 class="type-heading-sm text-text-primary">Support</h2>
          <a class="type-body-sm text-text-secondary hover:text-text-primary focus-visible:focus-ring" routerLink="/orders">Track an order</a>
          <a class="type-body-sm text-text-secondary hover:text-text-primary focus-visible:focus-ring" href="mailto:support@vendra.com">Contact support</a>
          <a class="type-body-sm text-text-secondary hover:text-text-primary focus-visible:focus-ring" routerLink="/products">Browse in-stock items</a>
        </section>

        <section class="grid gap-xs">
          <h2 class="type-heading-sm text-text-primary">Account</h2>
          <a class="type-body-sm text-text-secondary hover:text-text-primary focus-visible:focus-ring" routerLink="/auth/login">Sign in</a>
          <a class="type-body-sm text-text-secondary hover:text-text-primary focus-visible:focus-ring" routerLink="/auth/register">Create account</a>
          <a class="type-body-sm text-text-secondary hover:text-text-primary focus-visible:focus-ring" routerLink="/profile">Profile</a>
        </section>

        <section class="grid gap-xs">
          <h2 class="type-heading-sm text-text-primary">Policies</h2>
          <a class="type-body-sm text-text-secondary hover:text-text-primary focus-visible:focus-ring" href="/returns">Returns</a>
          <a class="type-body-sm text-text-secondary hover:text-text-primary focus-visible:focus-ring" href="/privacy">Privacy</a>
          <a class="type-body-sm text-text-secondary hover:text-text-primary focus-visible:focus-ring" href="/terms">Terms</a>
        </section>
      </div>

      <div class="border-t border-glass-border px-gutter-xs py-sm text-center type-body-sm text-text-muted md:px-gutter-sm lg:px-gutter-lg">
        © 2026 Vendra. All rights reserved.
      </div>
    </footer>
  `,
})
export class FooterComponent {}
