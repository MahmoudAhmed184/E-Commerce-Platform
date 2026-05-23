import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { AuthService } from './core/services/auth/auth.service';
import { FooterComponent } from './layout/footer/footer.component';
import { GlobalNavComponent } from './layout/global-nav/global-nav.component';
import { SessionTimeoutModalComponent } from './layout/session-timeout-modal/session-timeout-modal.component';
import { SkipNavigationComponent } from './layout/skip-navigation/skip-navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FooterComponent, GlobalNavComponent, RouterOutlet, SessionTimeoutModalComponent, SkipNavigationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col bg-background text-foreground">
      <app-skip-navigation targetId="main-content" />
      @if (!isAdminRoute()) {
        <app-global-nav />
      }

      <main id="main-content" class="min-w-0 flex-1" tabindex="-1">
        <router-outlet />
      </main>

      @if (!isAdminRoute()) {
        <app-footer />
      }
      <app-session-timeout-modal
        [open]="showSessionTimeoutModal()"
        [secondsRemaining]="authService.secondsUntilExpiry()"
        [extending]="authService.sessionExtending()"
        [error]="authService.sessionError()"
        [hasDraft]="authService.sessionHasDraft()"
        (extend)="extendSession()"
        (signOut)="signOut()"
        (closed)="authService.dismissSessionModal()"
      />
    </div>
  `,
})
export class App {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly isAdminRoute = computed(() => isAdminWorkspaceUrl(this.currentUrl()));
  protected readonly showSessionTimeoutModal = computed(() => this.authService.sessionModalOpen() && !this.isAuthRoute());

  protected extendSession(): void {
    this.authService.extendSession().subscribe({
      error: () => undefined,
    });
  }

  protected signOut(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigateByUrl('/auth/login'),
    });
  }

  private isAuthRoute(): boolean {
    return this.currentUrl().startsWith('/auth');
  }
}

export function isAdminWorkspaceUrl(url: string): boolean {
  const path = url.split(/[?#]/, 1)[0] ?? '';
  return path === '/admin' || path.startsWith('/admin/');
}
