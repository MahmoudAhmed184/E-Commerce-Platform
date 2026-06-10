import { ChangeDetectionStrategy, Component, type OnInit, computed, inject, signal } from '@angular/core';
import {
  LucideArrowRight,
  LucideCreditCard,
  LucideListChecks,
  LucidePackage,
  LucideReceiptText,
  LucideUsersRound,
} from '@lucide/angular';
import { finalize } from 'rxjs';

import { AlertBannerComponent } from '../../../../shared/components/alert-banner/alert-banner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { AdminWorkflowService, type AdminDashboardMetric, type AdminDashboardQueueItem, type AdminDashboardResult } from '../../services/admin-workflow/admin-workflow.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    AlertBannerComponent,
    BadgeComponent,
    ButtonComponent,
    LucideArrowRight,
    LucideCreditCard,
    LucideListChecks,
    LucidePackage,
    LucideReceiptText,
    LucideUsersRound,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="admin-page">
      <header class="admin-page-header">
        <div class="admin-page-heading">
          <p class="admin-kicker">Overview</p>
          <h2 class="admin-title">Dashboard</h2>
          <p class="admin-description">Monitor customer activity, order status, payment records, catalog health, and review moderation.</p>
        </div>

        <div class="admin-actions">
          <app-button variant="secondary" [routerLink]="'/admin/orders'">
            Review orders
            <svg lucideArrowRight class="size-icon-sm" aria-hidden="true"></svg>
          </app-button>
          <app-button [routerLink]="'/admin/products'">
            Update catalog
            <svg lucideArrowRight class="size-icon-sm" aria-hidden="true"></svg>
          </app-button>
        </div>
      </header>

      @if (isLoading()) {
        <app-skeleton-loader shape="block" [count]="4" label="Loading dashboard" />
      } @else if (errorMessage()) {
        <section class="admin-panel" aria-labelledby="dashboard-unavailable-title">
          <div class="admin-panel-header">
            <div>
              <p class="type-label-sm text-text-muted">Metrics</p>
              <h3 id="dashboard-unavailable-title" class="admin-panel-title">Dashboard unavailable</h3>
              <p class="admin-panel-copy">{{ errorMessage() }}</p>
            </div>
            <app-button variant="secondary" size="sm" (pressed)="loadDashboard()">Retry</app-button>
          </div>
          <div class="admin-panel-body">
            <p class="type-body-sm text-text-secondary">The admin workspace is still available. Use the sidebar to manage users, orders, payments, catalog, categories, or reviews directly.</p>
          </div>
        </section>
      } @else {
        <app-alert-banner tone="info" [title]="'Operations queue'" [message]="summaryMessage()" />

        <dl class="admin-stat-grid">
          @for (metric of metrics(); track metric.id) {
            <div class="admin-stat-card">
              <div class="admin-stat-card-row">
                <dt class="type-label-sm text-text-muted">{{ metric.label }}</dt>
                <span class="admin-stat-icon" [attr.data-tone]="metric.tone" aria-hidden="true">
                  @switch (metric.id) {
                    @case ('users') {
                      <svg lucideUsersRound class="size-icon-sm"></svg>
                    }
                    @case ('orders') {
                      <svg lucideReceiptText class="size-icon-sm"></svg>
                    }
                    @case ('payments') {
                      <svg lucideCreditCard class="size-icon-sm"></svg>
                    }
                    @case ('products') {
                      <svg lucidePackage class="size-icon-sm"></svg>
                    }
                    @default {
                      <svg lucideListChecks class="size-icon-sm"></svg>
                    }
                  }
                </span>
              </div>
              <dd class="admin-stat-value">{{ metric.value }}</dd>
              <dd><app-badge [tone]="metric.tone" [label]="metric.detail" /></dd>
            </div>
          } @empty {
            <div class="admin-panel admin-panel-body">
              <p class="type-body-sm text-text-muted">No dashboard metrics are available.</p>
            </div>
          }
        </dl>

        <section class="admin-panel" aria-labelledby="admin-queue-title">
          <div class="admin-panel-header">
            <div>
              <p class="type-label-sm text-text-muted">Recent activity</p>
              <h3 id="admin-queue-title" class="admin-panel-title">Attention queue</h3>
              <p class="admin-panel-copy">The latest records that may need an admin decision.</p>
            </div>
            <app-badge tone="warning" [label]="queue().length + ' items'" />
          </div>

          <div class="admin-panel-body admin-record-list">
            @for (item of queue(); track item.id) {
              <article class="admin-record">
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

  protected loadDashboard(): void {
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
