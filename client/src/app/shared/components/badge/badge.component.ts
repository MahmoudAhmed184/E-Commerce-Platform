import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { UiTone } from '../ui.types';

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
  readonly tone = input<UiTone>('neutral');
  readonly label = input.required<string>();
  readonly count = input<number | null>(null);

  protected readonly classes = computed(() => {
    const tones: Record<UiTone, string> = {
      neutral: 'border-glass-border bg-glass-white-6 text-text-secondary shadow-glass-flat',
      primary: 'border-iridescent-violet/60 bg-glass-white-12 text-primary-900 shadow-glass-flat',
      secondary: 'border-iridescent-cyan/60 bg-glass-white-12 text-secondary-900 shadow-glass-flat',
      success: 'border-success-600 bg-success-50 text-text-success shadow-glass-flat',
      warning: 'border-warning-600 bg-warning-50 text-text-warning shadow-glass-flat',
      error: 'border-border-error bg-error-50 text-text-error shadow-glass-flat',
      info: 'border-info-600 bg-info-50 text-text-info shadow-glass-flat',
      accent: 'border-iridescent-emerald/60 bg-glass-white-12 text-accent-900 shadow-glass-flat',
    };

    return `inline-flex items-center gap-2xs rounded-full border-hairline px-xs py-2xs type-label-sm backdrop-blur-md ${tones[this.tone()]}`;
  });
}
