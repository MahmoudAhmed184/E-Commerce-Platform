import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { UiSize } from '../ui.types';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon-only';
export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonIconPosition = 'start' | 'end';

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <button
      [class]="classes()"
      [attr.type]="type()"
      [attr.aria-label]="computedAriaLabel()"
      [attr.aria-busy]="loading() ? 'true' : null"
      [disabled]="disabled() || loading()"
      (click)="press($event)"
    >
      @if (loading()) {
        <span
          class="inline-block size-icon-sm animate-spin rounded-full border-focus border-current border-e-transparent motion-reduce:animate-none"
          aria-hidden="true"
        ></span>
        <span class="sr-only">Loading</span>
      } @else if (icon() && iconPosition() === 'start') {
        <span class="inline-flex size-icon-sm items-center justify-center" aria-hidden="true">{{ icon() }}</span>
      }

      @if (variant() !== 'icon-only') {
        <span class="min-w-0 truncate"><ng-content /></span>
      }

      @if (!loading() && icon() && iconPosition() === 'end') {
        <span class="inline-flex size-icon-sm items-center justify-center" aria-hidden="true">{{ icon() }}</span>
      }
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<UiSize>('md');
  readonly type = input<ButtonType>('button');
  readonly icon = input<string | null>(null);
  readonly iconPosition = input<ButtonIconPosition>('start');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly ariaLabel = input<string | null>(null);
  readonly fullWidth = input(false);

  readonly pressed = output<MouseEvent>();

  protected readonly computedAriaLabel = computed(() => {
    if (this.ariaLabel()) {
      return this.ariaLabel();
    }

    return this.variant() === 'icon-only' ? 'Icon button' : null;
  });

  protected readonly classes = computed(() => {
    const base = [
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-xs',
      'rounded-md',
      'border-hairline',
      'type-label-md',
      'font-medium',
      'interactive-transition',
      'focus-visible:focus-ring',
      'disabled:state-disabled',
      'aria-busy:state-loading',
    ];
    const sizeClasses: Record<UiSize, string[]> = {
      sm: ['min-h-control-sm', 'px-sm', 'py-2xs'],
      md: ['min-h-control-md', 'px-md', 'py-xs'],
      lg: ['min-h-control-lg', 'px-lg', 'py-sm', 'type-label-lg'],
    };
    const variantClasses: Record<ButtonVariant, string[]> = {
      primary: [
        'border-glass-border',
        'bg-[linear-gradient(135deg,var(--ui-color-iridescent-violet),var(--ui-color-iridescent-cyan),var(--ui-color-iridescent-emerald))]',
        'text-text-on-primary',
        'shadow-glass-raised',
        'hover:shadow-glass-floating',
      ],
      secondary: ['glass-panel', 'glass-depth-raised', 'border-glass-border', 'text-text-primary', 'hover:shadow-glass-floating'],
      ghost: ['glass-border-shimmer', 'border-transparent', 'bg-transparent', 'text-text-primary', 'hover:bg-glass-white-6'],
      danger: ['border-border-error', 'bg-error-50', 'text-text-error', 'shadow-glass-flat', 'hover:border-error-600', 'hover:bg-error-900/30'],
      'icon-only': ['tap-target', 'glass-panel', 'glass-depth-raised', 'border-glass-border', 'p-0', 'text-icon-default', 'hover:shadow-glass-floating'],
    };

    return [
      ...base,
      ...sizeClasses[this.size()],
      ...variantClasses[this.variant()],
      this.fullWidth() ? 'w-full' : '',
    ].filter(Boolean).join(' ');
  });

  protected press(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.pressed.emit(event);
  }
}
