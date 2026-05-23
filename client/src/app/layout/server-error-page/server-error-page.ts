import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-server-error-page',
  standalone: true,
  imports: [ErrorStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="grid min-h-[var(--ui-layout-min-screen-minus-header)] place-items-center bg-transparent px-gutter-xs py-2xl md:px-gutter-sm">
      <app-error-state
        [statusCode]="statusCode()"
        [title]="title()"
        [message]="message()"
        [retry]="primaryAction()"
        homeLink="/"
        supportLink="mailto:support@vendra.com"
        (retryPressed)="handlePrimaryAction()"
      />
    </main>
  `,
})
export class ServerErrorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly statusCode = signal<number | string>(500);
  protected readonly retrying = signal(false);
  protected readonly title = computed(() => (this.statusCode() === 403 ? 'Admin access required' : 'Something went wrong'));
  protected readonly message = computed(() =>
    this.statusCode() === 403
      ? 'Use an administrator account to access the operations workspace, or return home to continue shopping.'
      : 'We could not complete the request. Retry the page or contact support with the time this happened.',
  );
  protected readonly primaryAction = computed(() => ({
    label: this.statusCode() === 403 ? 'Sign in as admin' : this.retrying() ? 'Retrying' : 'Retry',
    variant: 'primary' as const,
    loading: this.retrying(),
  }));

  ngOnInit(): void {
    const status = Number(this.route.snapshot.queryParamMap.get('status'));
    this.statusCode.set(Number.isFinite(status) && status > 0 ? status : 500);
  }

  protected handlePrimaryAction(): void {
    if (this.statusCode() === 403) {
      void this.router.navigate(['/auth/login'], {
        queryParams: {
          returnUrl: '/admin',
          role: 'admin',
        },
      });
      return;
    }

    this.retrying.set(true);
    queueMicrotask(() => this.retrying.set(false));
  }
}
