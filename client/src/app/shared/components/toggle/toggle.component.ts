import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <button
      class="inline-flex min-h-touch-min items-center gap-sm text-start disabled:state-disabled"
      type="button"
      role="switch"
      [attr.aria-checked]="checked()"
      [attr.aria-busy]="loading() ? 'true' : null"
      [disabled]="disabled() || loading()"
      (click)="toggle()"
    >
      <span [class]="trackClasses()" aria-hidden="true">
        <span [class]="thumbClasses()">
          @if (loading()) {
            <app-spinner size="sm" label="Updating setting" />
          }
        </span>
      </span>
      <span class="grid gap-3xs">
        <span class="type-label-md text-text-primary">{{ label() }}</span>
        @if (helper()) {
          <span class="type-body-sm text-text-muted">{{ helper() }}</span>
        }
      </span>
    </button>
  `,
})
export class ToggleComponent {
  readonly checked = input(false);
  readonly label = input.required<string>();
  readonly helper = input<string | null>(null);
  readonly disabled = input(false);
  readonly loading = input(false);

  readonly checkedChange = output<boolean>();

  protected readonly trackClasses = computed(() => [
    'relative',
    'inline-flex',
    'h-control-sm',
    'w-control-lg',
    'shrink-0',
    'rounded-full',
    'border-hairline',
    'interactive-transition',
    this.checked()
      ? 'border-iridescent-cyan bg-[linear-gradient(90deg,var(--ui-color-iridescent-violet),var(--ui-color-iridescent-cyan),var(--ui-color-iridescent-emerald))] shadow-glass-raised'
      : 'border-glass-border bg-glass-white-6 shadow-glass-flat backdrop-blur-md',
  ].join(' '));

  protected readonly thumbClasses = computed(() => [
    'absolute',
    'inset-y-2xs',
    'inline-flex',
    'aspect-square',
    'items-center',
    'justify-center',
    'rounded-full',
    'bg-text-primary',
    'text-icon-muted',
    'shadow-glass-flat',
    'interactive-transition',
    this.checked() ? 'end-2xs' : 'start-2xs',
  ].join(' '));

  protected toggle(): void {
    if (this.disabled() || this.loading()) {
      return;
    }
    this.checkedChange.emit(!this.checked());
  }
}
