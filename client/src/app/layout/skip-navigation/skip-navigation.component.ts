import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skip-navigation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="glass-panel glass-depth-floating fixed start-gutter-xs top-gutter-xs z-skip-link -translate-y-[calc(var(--ui-size-control-lg)+var(--ui-space-lg))] rounded-md px-md py-xs type-label-md text-text-primary interactive-transition focus:translate-y-0 focus-visible:focus-ring"
      type="button"
      (click)="skipToMain()"
    >
      {{ label() }}
    </button>
  `,
})
export class SkipNavigationComponent {
  readonly targetId = input('main-content');
  readonly label = input('Skip to main content');

  protected skipToMain(): void {
    const target = document.getElementById(this.targetId());
    if (!target) {
      return;
    }
    const heading = target.matches('h1, [role="heading"][aria-level="1"]')
      ? target
      : target.querySelector<HTMLElement>('h1, [role="heading"][aria-level="1"]');
    const focusTarget = heading ?? target;
    const hadTabIndex = focusTarget.hasAttribute('tabindex');
    if (!hadTabIndex) {
      focusTarget.setAttribute('tabindex', '-1');
    }
    focusTarget.focus();
    focusTarget.scrollIntoView({ block: 'start' });
    if (!hadTabIndex && focusTarget !== target) {
      focusTarget.addEventListener('blur', () => focusTarget.removeAttribute('tabindex'), { once: true });
    }
  }
}
