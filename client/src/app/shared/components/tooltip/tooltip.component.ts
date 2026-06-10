import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { uniqueId } from '../component-utils';

export type TooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <span
      class="relative inline-flex"
      [attr.aria-describedby]="visible() ? tooltipId : null"
      (mouseenter)="show()"
      (mouseleave)="hide()"
      (focusin)="show()"
      (focusout)="hide()"
    >
      <ng-content />
      @if (visible()) {
        <span [class]="classes()" [id]="tooltipId" role="tooltip">
          {{ content() }}
        </span>
      }
    </span>
  `,
})
export class TooltipComponent {
  readonly content = input.required<string>();
  readonly placement = input<TooltipPlacement>('top');
  readonly delay = input(120);

  protected readonly visible = signal(false);
  protected readonly tooltipId = uniqueId('tooltip');
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly classes = computed(() => {
    const placements: Record<TooltipPlacement, string> = {
      top: 'bottom-full start-1/2 mb-xs -translate-x-1/2',
      bottom: 'top-full start-1/2 mt-xs -translate-x-1/2',
      start: 'end-full me-xs top-1/2 -translate-y-1/2',
      end: 'start-full ms-xs top-1/2 -translate-y-1/2',
    };
    return `surface-panel surface-depth-floating absolute z-dropdown max-w-[var(--ui-container-sm)] rounded-sm px-xs py-2xs type-label-sm text-text-primary ${placements[this.placement()]}`;
  });

  protected show(): void {
    this.clearTimer();
    this.timeoutId = setTimeout(() => this.visible.set(true), this.delay());
  }

  protected hide(): void {
    this.clearTimer();
    this.visible.set(false);
  }

  private clearTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
