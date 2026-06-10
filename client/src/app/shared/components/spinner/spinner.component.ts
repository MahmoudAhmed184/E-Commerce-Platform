import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { UiSize } from '../ui.types';

@Component({
  selector: 'app-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <span [class]="classes()" role="status" [attr.aria-label]="label()">
      <span class="sr-only">{{ label() }}</span>
    </span>
  `,
})
export class SpinnerComponent {
  readonly size = input<UiSize>('md');
  readonly label = input('Loading');

  protected readonly classes = computed(() => {
    const sizes: Record<UiSize, string> = {
      sm: 'size-icon-sm',
      md: 'size-icon-md',
      lg: 'size-icon-lg',
    };

    return [
      'inline-block',
      'rounded-full',
      'shimmer',
      sizes[this.size()],
    ].join(' ');
  });
}
