import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-button-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="glass-panel glass-depth-raised inline-flex overflow-hidden rounded-md" role="group" [attr.aria-label]="label()">
      <ng-content />
    </div>
  `,
})
export class ButtonGroupComponent {
  readonly label = input.required<string>();
}
