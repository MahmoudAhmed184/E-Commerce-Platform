import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="h-2 overflow-hidden rounded-full bg-surface-raised shadow-xs" role="progressbar" [attr.aria-label]="label()" [attr.aria-valuemin]="0" [attr.aria-valuemax]="100" [attr.aria-valuenow]="boundedValue()">
      <div class="h-full rounded-full bg-surface-primary interactive-transition" [style.width.%]="boundedValue()"></div>
    </div>
  `,
})
export class ProgressComponent {
  readonly value = input(0);
  readonly label = input('Progress');

  protected readonly boundedValue = computed(() => Math.min(Math.max(this.value(), 0), 100));
}
