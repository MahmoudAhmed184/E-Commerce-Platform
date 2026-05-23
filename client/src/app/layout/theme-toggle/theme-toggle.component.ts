import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LucideMoon, LucideSun } from '@lucide/angular';

import { ThemeService } from '../../core/services/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [LucideMoon, LucideSun],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="glass-panel glass-depth-raised inline-flex size-control-md items-center justify-center rounded-md text-icon-default interactive-transition hover:shadow-glass-floating focus-visible:focus-ring"
      type="button"
      [attr.aria-label]="toggleLabel()"
      [attr.title]="toggleLabel()"
      (click)="toggleTheme()"
    >
      @if (themeService.isWhiteMode()) {
        <svg lucideMoon class="size-icon-sm" aria-hidden="true"></svg>
      } @else {
        <svg lucideSun class="size-icon-sm" aria-hidden="true"></svg>
      }
    </button>
  `,
})
export class ThemeToggleComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly toggleLabel = computed(() => (this.themeService.isWhiteMode() ? 'Switch to dark mode' : 'Switch to white mode'));

  protected toggleTheme(): void {
    this.themeService.toggleResolvedTheme();
  }
}
