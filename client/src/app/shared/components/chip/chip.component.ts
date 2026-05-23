import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { UiTone } from '../ui.types';

@Component({
  selector: 'app-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <span [class]="classes()">
      <span class="min-w-0 truncate">{{ label() }}</span>
      @if (count() !== null) {
        <span aria-hidden="true">{{ count() }}</span>
      }
      @if (removable()) {
        <button
          class="inline-flex size-icon-md items-center justify-center rounded-full text-current interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring"
          type="button"
          [attr.aria-label]="'Remove ' + label()"
          (click)="removed.emit()"
        >
          <span aria-hidden="true">x</span>
        </button>
      }
    </span>
  `,
})
export class ChipComponent {
  readonly tone = input<UiTone>('primary');
  readonly label = input.required<string>();
  readonly removable = input(false);
  readonly selected = input(false);
  readonly count = input<number | null>(null);

  readonly removed = output<void>();

  protected readonly classes = computed(() => {
    const tones: Record<UiTone, string> = {
      neutral: 'border-glass-border bg-glass-white-6 text-text-secondary',
      primary: 'border-iridescent-violet/60 bg-glass-white-12 text-primary-900',
      secondary: 'border-iridescent-cyan/60 bg-glass-white-12 text-secondary-900',
      success: 'border-success-600 bg-success-50 text-text-success',
      warning: 'border-warning-600 bg-warning-50 text-text-warning',
      error: 'border-border-error bg-error-50 text-text-error',
      info: 'border-info-600 bg-info-50 text-text-info',
      accent: 'border-iridescent-emerald/60 bg-glass-white-12 text-accent-900',
    };

    return [
      'inline-flex',
      'max-w-full',
      'items-center',
      'gap-2xs',
      'rounded-full',
      'border-hairline',
      'px-xs',
      'py-2xs',
      'type-label-sm',
      'backdrop-blur-md',
      tones[this.tone()],
      this.selected() ? 'shadow-glass-raised' : 'shadow-glass-flat',
    ].filter(Boolean).join(' ');
  });
}
