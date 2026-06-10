import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }

    header {
      position: sticky;
      top: 0;
      z-index: 200;
      background: rgba(15, 15, 18, 0.85);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 1px solid rgba(201,148,58,0.12);
      transition: background 0.3s, border-color 0.3s;
    }

    nav {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 32px;
      height: 68px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .logo {
      text-decoration: none;
      display: flex;
      align-items: baseline;
      gap: 2px;
      animation: fadeIn 0.6s var(--ease-out) both;
    }

    .logo-stack {
      font-family: var(--font-display);
      font-size: 1.55rem;
      font-weight: 700;
      font-style: italic;
      color: var(--color-ivory);
      letter-spacing: -0.01em;
      line-height: 1;
    }

    .logo-commerce {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      font-weight: 400;
      color: var(--color-amber);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-left: 6px;
      align-self: center;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 4px;
      list-style: none;
      animation: fadeIn 0.6s 0.1s var(--ease-out) both;
    }

    .nav-links a {
      position: relative;
      display: block;
      padding: 8px 14px;
      font-family: var(--font-body);
      font-size: 0.875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-ivory-ghost);
      text-decoration: none;
      transition: color 0.25s;
    }

    .nav-links a::after {
      content: '';
      position: absolute;
      bottom: 4px;
      left: 14px;
      right: 14px;
      height: 1px;
      background: var(--color-amber);
      transform: scaleX(0);
      transform-origin: right;
      transition: transform 0.3s var(--ease-out);
    }

    .nav-links a:hover {
      color: var(--color-ivory);
    }

    .nav-links a:hover::after,
    .nav-links a.active-link::after {
      transform: scaleX(1);
      transform-origin: left;
    }

    .nav-links a.active-link {
      color: var(--color-ivory);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      animation: fadeIn 0.6s 0.2s var(--ease-out) both;
    }

    .btn-login {
      padding: 9px 22px;
      background: linear-gradient(135deg, var(--color-amber), var(--color-amber-light));
      color: var(--color-void);
      font-family: var(--font-body);
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.25s var(--ease-out);
    }

    .btn-login:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(201,148,58,0.4);
      filter: brightness(1.08);
    }

    .btn-logout {
      padding: 9px 22px;
      background: transparent;
      color: var(--color-ivory-ghost);
      font-family: var(--font-body);
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border: 1px solid var(--color-muted);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.25s;
    }

    .btn-logout:hover {
      border-color: var(--color-amber-dim);
      color: var(--color-amber-light);
    }

    @media (max-width: 640px) {
      nav { padding: 0 16px; }
      .nav-links { display: none; }
    }
  `],
  template: `
    <header>
      <nav aria-label="Primary navigation">
        <a routerLink="/" class="logo" aria-label="Stack Commerce home">
          <span class="logo-stack">Stack</span>
          <span class="logo-commerce">Commerce</span>
        </a>

        <ul class="nav-links" role="list">
          <li><a routerLink="/" routerLinkActive="active-link" [routerLinkActiveOptions]="{ exact: true }">Home</a></li>
          <li><a routerLink="/products" routerLinkActive="active-link">Products</a></li>
          <li><a routerLink="/cart" routerLinkActive="active-link">Cart</a></li>
          <li><a routerLink="/orders" routerLinkActive="active-link">Orders</a></li>
          <li><a routerLink="/profile" routerLinkActive="active-link">Profile</a></li>
          @if (authService.isAdmin()) {
            <li><a routerLink="/admin" routerLinkActive="active-link">Admin</a></li>
          }
        </ul>

        <div class="nav-actions">
          @if (authService.isLoggedIn()) {
            <button id="header-logout-btn" type="button" class="btn-logout" (click)="logout()">Logout</button>
          } @else {
            <a id="header-login-btn" routerLink="/auth/login" class="btn-login">Login</a>
          }
        </div>
      </nav>
    </header>
  `,
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/auth/login']),
      error: () => void this.router.navigate(['/auth/login']),
    });
  }
}
