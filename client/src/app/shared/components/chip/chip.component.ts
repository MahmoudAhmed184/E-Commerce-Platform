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
          class="inline-flex size-icon-md items-center justify-center rounded-full text-current interactive-transition hover:bg-surface-subtle focus-visible:focus-ring"
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
      default: 'border-border-default bg-surface-subtle text-text-secondary',
      neutral: 'border-border-default bg-surface-raised text-text-secondary',
      primary: 'border-info-600 bg-surface-info text-text-info',
      secondary: 'border-border-default bg-surface-raised text-text-secondary',
      success: 'border-success-600 bg-success-50 text-text-success',
      warning: 'border-warning-600 bg-warning-50 text-text-warning',
      error: 'border-border-error bg-error-50 text-text-error',
      info: 'border-info-600 bg-info-50 text-text-info',
      accent: 'border-info-600 bg-surface-info text-text-info',
      outline: 'border-border-default bg-surface-raised text-text-secondary',
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
      '',
      tones[this.tone()],
      this.selected() ? 'shadow-sm' : 'shadow-xs',
    ].filter(Boolean).join(' ');
  });
}
