import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-block animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.125em]"
      [class.h-4]="size() === 'sm'"
      [class.w-4]="size() === 'sm'"
      [class.h-5]="size() === 'md'"
      [class.w-5]="size() === 'md'"
      [class.h-6]="size() === 'lg'"
      [class.w-6]="size() === 'lg'"
      [attr.aria-label]="ariaLabel()"
      role="status"
    ></span>
  `,
})
export class LoadingSpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  protected readonly ariaLabel = computed(() => `Loading ${this.size()}`);
}
