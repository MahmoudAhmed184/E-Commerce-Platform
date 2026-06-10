import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { UiTone } from '../ui.types';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <span [class]="classes()">
      {{ label() }}
      @if (count() !== null) {
        <span aria-hidden="true">{{ count() }}</span>
      }
    </span>
  `,
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('default');
  readonly tone = input<UiTone | null>(null);
  readonly label = input.required<string>();
  readonly count = input<number | null>(null);

  protected readonly classes = computed(() => {
    const variants: Record<BadgeVariant, string> = {
      default: 'bg-surface-subtle text-text-secondary',
      success: 'border-hairline border-success-600 bg-surface-success text-text-success',
      warning: 'border-hairline border-warning-600 bg-surface-warning text-text-warning',
      error: 'border-hairline border-border-error bg-surface-error text-text-error',
      info: 'border-hairline border-info-600 bg-surface-info text-text-info',
      outline: 'border-hairline border-border-default text-text-secondary',
    };

    return `inline-flex items-center gap-1 rounded-full px-xs py-2xs type-label-sm ${variants[this.resolvedVariant()]}`;
  });

  private resolvedVariant(): BadgeVariant {
    const tone = this.tone();
    if (!tone) {
      return this.variant();
    }

    const tones: Record<UiTone, BadgeVariant> = {
      default: 'default',
      neutral: 'default',
      primary: 'info',
      secondary: 'outline',
      success: 'success',
      warning: 'warning',
      error: 'error',
      info: 'info',
      accent: 'info',
      outline: 'outline',
    };

    return tones[tone];
  }
}
