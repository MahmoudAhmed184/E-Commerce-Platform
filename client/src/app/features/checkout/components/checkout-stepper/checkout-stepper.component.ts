import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCheck } from '@lucide/angular';

import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { ProgressComponent } from '../../../../shared/components/progress/progress.component';
import type { UiStepperStep } from '../../../../shared/components/ui.types';

@Component({
  selector: 'app-checkout-stepper',
  standalone: true,
  imports: [LucideCheck, NgTemplateOutlet, ProgressComponent, RouterLink, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <nav class="surface-panel surface-depth-flat rounded-md p-xs text-text-primary md:p-sm" aria-label="Checkout progress">
      <div class="mb-xs flex flex-wrap items-center justify-between gap-xs">
        <p class="type-label-sm text-text-muted">Step {{ currentIndex() + 1 }} of {{ steps().length }}</p>
        <p class="type-label-sm text-text-secondary">{{ currentStepLabel() }}</p>
      </div>
      <app-progress [value]="progressValue()" label="Checkout progress" />
      <ol class="mt-xs grid gap-xs md:grid-cols-3">
        @for (step of steps(); track step.id; let index = $index) {
          <li [class]="stepItemClasses(step)">
            @if (step.href) {
              <a class="grid min-h-touch-min grid-cols-[auto_minmax(0,1fr)] items-center gap-xs rounded-md px-xs py-2xs no-underline focus-visible:focus-ring" [routerLink]="step.href" [attr.aria-current]="step.id === currentStep() ? 'step' : null">
                <ng-container [ngTemplateOutlet]="stepContent" [ngTemplateOutletContext]="{ step: step, index: index }" />
              </a>
            } @else {
              <span class="grid min-h-touch-min grid-cols-[auto_minmax(0,1fr)] items-center gap-xs rounded-md px-xs py-2xs" [attr.aria-current]="step.id === currentStep() ? 'step' : null">
                <ng-container [ngTemplateOutlet]="stepContent" [ngTemplateOutletContext]="{ step: step, index: index }" />
              </span>
            }
          </li>
        }
      </ol>
    </nav>

    <ng-template #stepContent let-step="step" let-index="index">
      <span [class]="stepMarkerClasses(step)">
        @if (step.status === 'loading') {
          <app-spinner size="sm" label="Step loading" />
        } @else if (step.status === 'completed') {
          <svg lucideCheck class="size-icon-sm" aria-hidden="true"></svg>
        } @else {
          {{ index + 1 }}
        }
      </span>
      <span class="grid min-w-0 gap-3xs">
        <span class="truncate type-label-md" [class.text-text-primary]="step.id === currentStep()" [class.text-text-secondary]="step.id !== currentStep()">{{ step.label }}</span>
        <span [class]="stepStatusClasses(step)">{{ stepStatusLabel(step) }}</span>
      </span>
    </ng-template>
  `,
})
export class CheckoutStepperComponent {
  readonly steps = input<readonly UiStepperStep[]>([
    { id: 'review', label: 'Review order', href: '/checkout/review' },
    { id: 'delivery', label: 'Delivery', href: '/checkout/delivery' },
    { id: 'payment', label: 'Payment', href: '/checkout/payment' },
  ]);
  readonly currentStep = input.required<string>();
  readonly errors = input<Record<string, string | undefined>>({});

  protected readonly currentIndex = computed(() => {
    const index = this.steps().findIndex((step) => step.id === this.currentStep());
    return index < 0 ? 0 : index;
  });
  protected readonly currentStepLabel = computed(() => this.steps()[this.currentIndex()]?.label ?? 'Checkout');
  protected readonly progressValue = computed(() => {
    const total = this.steps().length;
    return total ? ((this.currentIndex() + 1) / total) * 100 : 0;
  });

  protected stepItemClasses(step: UiStepperStep): string {
    return [
      'rounded-md',
      'border-hairline',
      'interactive-transition',
      step.id === this.currentStep()
        ? 'border-border-focus bg-surface-raised shadow-xs'
        : step.status === 'completed'
          ? 'border-border-default bg-surface-subtle'
          : 'border-transparent bg-transparent',
    ].join(' ');
  }

  protected stepMarkerClasses(step: UiStepperStep): string {
    return [
      'inline-flex',
      'size-control-sm',
      'items-center',
      'justify-center',
      'rounded-full',
      'border-hairline',
      'type-label-sm',
      step.status === 'completed'
        ? 'border-border-focus bg-surface-primary text-text-on-primary'
        : step.status === 'error'
          ? 'border-border-error bg-surface-error text-text-error'
          : step.id === this.currentStep()
            ? 'border-border-focus bg-surface-raised text-text-primary'
            : 'border-border-default bg-surface-raised text-text-secondary',
    ].join(' ');
  }

  protected stepStatusClasses(step: UiStepperStep): string {
    return [
      'type-body-sm',
      step.status === 'error'
        ? 'text-text-error'
        : step.id === this.currentStep()
          ? 'text-text-secondary'
          : 'text-text-muted',
    ].join(' ');
  }

  protected stepStatusLabel(step: UiStepperStep): string {
    const labels: Record<NonNullable<UiStepperStep['status']>, string> = {
      completed: 'Complete',
      current: 'Current',
      upcoming: 'Next',
      error: 'Needs attention',
      loading: 'Checking',
    };

    return labels[step.status ?? 'upcoming'];
  }
}
