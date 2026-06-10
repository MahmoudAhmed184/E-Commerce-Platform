import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-input-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="surface-panel surface-depth-raised flex min-h-touch-min items-stretch overflow-hidden rounded-sm text-text-primary focus-within:border-border-focus focus-within:focus-ring">
      <ng-content select="[prefix]" />
      <div class="min-w-0 flex-1">
        <ng-content />
      </div>
      <ng-content select="[suffix]" />
    </div>
  `,
})
export class InputGroupComponent {}
