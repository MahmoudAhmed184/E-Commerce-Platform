import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { AdminWorkflowService, type AdminDashboardMetric, type AdminDashboardQueueItem, type AdminDashboardResult } from '../../services/admin-workflow/admin-workflow.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AlertBannerComponent, BadgeComponent, EmptyStateComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="grid gap-lg">
      <header class="grid gap-xs">
        <p class="type-label-sm text-text-muted">Admin</p>
        <h2 class="type-heading-xl text-text-primary">Dashboard</h2>
        <p class="type-body-md text-text-secondary">Monitor customer activity, order status, payment records, catalog health, and review moderation.</p>
      </header>

      @if (isLoading()) {
        <app-skeleton-loader shape="block" [count]="4" label="Loading dashboard" />
      } @else if (errorMessage()) {
        <app-empty-state type="admin" title="Dashboard unavailable" [message]="errorMessage()" />
      } @else {
        <app-alert-banner tone="info" title="Operations queue" [message]="summaryMessage()" />

        <dl class="grid gap-md md:grid-cols-2 xl:grid-cols-4">
          @for (metric of metrics(); track metric.id) {
            <div class="grid gap-xs rounded-md border-hairline border-border-default bg-surface-raised p-md shadow-xs">
              <dt class="type-label-sm text-text-muted">{{ metric.label }}</dt>
              <dd class="type-heading-lg text-text-primary">{{ metric.value }}</dd>
              <dd><app-badge [tone]="metric.tone" [label]="metric.detail" /></dd>
            </div>
          } @empty {
            <div class="rounded-md border-hairline border-border-default bg-surface-raised p-md">
              <p class="type-body-sm text-text-muted">No dashboard metrics are available.</p>
            </div>
          }
        </dl>

        <section class="grid gap-md rounded-md border-hairline border-border-default bg-surface-raised p-md shadow-xs" aria-labelledby="admin-queue-title">
          <div class="flex flex-wrap items-center justify-between gap-md">
            <div>
              <p class="type-label-sm text-text-muted">Recent activity</p>
              <h3 id="admin-queue-title" class="type-heading-lg text-text-primary">Attention queue</h3>
            </div>
            <app-badge tone="warning" [label]="queue().length + ' items'" />
          </div>

          <div class="grid gap-sm">
            @for (item of queue(); track item.id) {
              <article class="grid gap-2xs rounded-md border-hairline border-border-default bg-surface-subtle p-sm">
                <div class="flex flex-wrap items-center justify-between gap-sm">
                  <h4 class="type-label-md text-text-primary">{{ item.title }}</h4>
                  <app-badge [tone]="item.tone" [label]="item.status" />
                </div>
                <p class="type-body-sm text-text-secondary">{{ item.detail }}</p>
              </article>
            } @empty {
              <p class="type-body-sm text-text-muted">No recent operational alerts.</p>
            }
          </div>
        </section>
      }
    </section>
  `,
})
export class DashboardPage implements OnInit {
  private readonly adminWorkflow = inject(AdminWorkflowService);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly metrics = signal<readonly AdminDashboardMetric[]>([]);
  protected readonly queue = signal<readonly AdminDashboardQueueItem[]>([]);
  protected readonly summaryMessage = computed(() => {
    const queueLength = this.queue().length;
    if (queueLength === 0) {
      return 'No urgent operational alerts in the latest activity window.';
    }

    return `${queueLength} recent records may need review in the operations queue.`;
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);
    this.adminWorkflow
      .loadDashboard()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((result) => this.applyDashboardResult(result));
  }

  private applyDashboardResult(result: AdminDashboardResult): void {
    if (result.status === 'failed') {
      this.errorMessage.set(result.message);
      return;
    }

    this.metrics.set(result.metrics);
    this.queue.set(result.queue);
  }
}
