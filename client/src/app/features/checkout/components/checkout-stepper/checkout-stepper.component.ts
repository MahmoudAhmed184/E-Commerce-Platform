import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { ProgressComponent } from '../../../../shared/components/progress/progress.component';
import type { UiStepperStep } from '../../../../shared/components/ui.types';

@Component({
  selector: 'app-checkout-stepper',
  standalone: true,
  imports: [NgTemplateOutlet, ProgressComponent, RouterLink, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <nav aria-label="Checkout progress">
      <app-progress [value]="progressValue()" label="Checkout progress" />
      <ol class="grid gap-sm md:grid-cols-3">
        @for (step of steps(); track step.id; let index = $index) {
          <li class="rounded-md border-hairline border-border-default bg-surface-raised p-sm">
            @if (step.href) {
              <a class="flex min-h-touch-min items-center gap-sm focus-visible:focus-ring" [routerLink]="step.href" [attr.aria-current]="step.id === currentStep() ? 'step' : null">
                <ng-container [ngTemplateOutlet]="stepContent" [ngTemplateOutletContext]="{ step: step, index: index }" />
              </a>
            } @else {
              <span class="flex min-h-touch-min items-center gap-sm" [attr.aria-current]="step.id === currentStep() ? 'step' : null">
                <ng-container [ngTemplateOutlet]="stepContent" [ngTemplateOutletContext]="{ step: step, index: index }" />
              </span>
            }
          </li>
        }
      </ol>
    </nav>

    <ng-template #stepContent let-step="step" let-index="index">
      <span class="inline-flex size-control-sm items-center justify-center rounded-full border-hairline border-border-default bg-surface-subtle type-label-sm text-text-secondary">
        @if (step.status === 'loading') {
          <app-spinner size="sm" label="Step loading" />
        } @else {
          {{ index + 1 }}
        }
      </span>
      <span class="grid">
        <span class="type-label-md" [class.text-text-primary]="step.id === currentStep()" [class.text-text-muted]="step.id !== currentStep()">{{ step.label }}</span>
        <span class="type-body-sm" [class.text-text-error]="step.status === 'error'" [class.text-text-muted]="step.status !== 'error'">{{ step.status ?? 'upcoming' }}</span>
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

  protected readonly progressValue = computed(() => {
    const index = this.steps().findIndex((step) => step.id === this.currentStep());
    if (index < 0) {
      return 0;
    }
    return ((index + 1) / this.steps().length) * 100;
  });
}
