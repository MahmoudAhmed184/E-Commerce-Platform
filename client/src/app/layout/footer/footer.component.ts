import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    footer {
      background: var(--color-void);
      border-top: 1px solid rgba(201,148,58,0.1);
      padding: 64px 32px 32px;
      margin-top: 80px;
    }

    .footer-inner {
      max-width: 1280px;
      margin: 0 auto;
    }

    .footer-top {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr 1fr;
      gap: 48px;
      padding-bottom: 48px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .brand-col .logo {
      display: flex;
      align-items: baseline;
      gap: 2px;
      margin-bottom: 16px;
      text-decoration: none;
    }

    .brand-stack {
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 700;
      font-style: italic;
      color: var(--color-ivory);
    }

    .brand-tag {
      font-family: var(--font-mono);
      font-size: 0.6rem;
      color: var(--color-amber);
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-left: 6px;
      align-self: center;
    }

    .brand-desc {
      font-size: 0.875rem;
      color: var(--color-ivory-ghost);
      line-height: 1.7;
      max-width: 260px;
    }

    .link-col h4 {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 500;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--color-amber);
      margin-bottom: 20px;
    }

    .link-col a {
      display: block;
      font-size: 0.875rem;
      color: var(--color-ivory-ghost);
      text-decoration: none;
      margin-bottom: 12px;
      transition: color 0.2s;
    }

    .link-col a:hover {
      color: var(--color-ivory);
    }

    .footer-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 32px;
      gap: 16px;
    }

    .copyright {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--color-muted);
      letter-spacing: 0.05em;
    }

    .copyright span {
      color: var(--color-amber-dim);
    }

    @media (max-width: 768px) {
      .footer-top {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 480px) {
      footer { padding: 48px 16px 24px; }
      .footer-top { grid-template-columns: 1fr; gap: 32px; }
      .footer-bottom { flex-direction: column; align-items: flex-start; }
    }
  `],
  template: `
    <footer>
      <div class="footer-inner">
        <div class="footer-top">
          <div class="brand-col">
            <a routerLink="/" class="logo">
              <span class="brand-stack">Stack</span>
              <span class="brand-tag">Commerce</span>
            </a>
            <p class="brand-desc">Curated premium products. Exceptional quality delivered to your door.</p>
          </div>

          <div class="link-col">
            <h4>Shop</h4>
            <a routerLink="/">Home</a>
            <a routerLink="/products">All Products</a>
            <a routerLink="/products">New Arrivals</a>
            <a routerLink="/cart">My Cart</a>
          </div>

          <div class="link-col">
            <h4>Account</h4>
            <a routerLink="/auth/login">Sign In</a>
            <a routerLink="/auth/register">Register</a>
            <a routerLink="/orders">My Orders</a>
            <a routerLink="/profile">Profile</a>
          </div>

          <div class="link-col">
            <h4>Support</h4>
            <a routerLink="/products">FAQ</a>
            <a routerLink="/products">Shipping</a>
            <a routerLink="/products">Returns</a>
            <a routerLink="/products">Contact</a>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="copyright">&copy; {{ year }} <span>Stack Commerce</span>. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
}
