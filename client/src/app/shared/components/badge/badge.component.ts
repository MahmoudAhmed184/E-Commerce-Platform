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
      neutral: 'bg-neutral-100 text-neutral-700',
      primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      secondary: 'border border-neutral-200 text-neutral-600',
      success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      warning: 'bg-amber-50 text-amber-700 border border-amber-200',
      error: 'bg-red-50 text-red-700 border border-red-200',
      info: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      accent: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    };

    return `inline-flex items-center rounded-full text-xs font-medium px-2.5 py-0.5 font-mono ${tones[this.tone()]}`;
  });
}
