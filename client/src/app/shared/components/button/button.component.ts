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
      'gap-2',
      'rounded-lg',
      'text-sm',
      'font-medium',
      'tracking-tight',
      'transition-all',
      'duration-150',
      'ease-out',
      'focus-visible:ring-2',
      'focus-visible:ring-indigo-500',
      'focus-visible:ring-offset-2',
      'disabled:state-disabled',
      'aria-busy:state-loading',
      'cursor-pointer',
    ];
    const sizeClasses: Record<UiSize, string[]> = {
      sm: ['h-8', 'px-3', 'text-xs'],
      md: ['h-9', 'px-4'],
      lg: ['h-10', 'px-6', 'text-base'],
    };
    const variantClasses: Record<ButtonVariant, string[]> = {
      primary: [
        'bg-indigo-600',
        'text-white',
        'shadow-sm',
        'hover:bg-indigo-700',
        'active:bg-indigo-800',
      ],
      secondary: [
        'border',
        'border-neutral-200',
        'bg-white',
        'text-neutral-900',
        'shadow-xs',
        'hover:bg-neutral-50',
        'active:bg-neutral-100',
      ],
      ghost: [
        'text-neutral-600',
        'hover:bg-neutral-100',
        'hover:text-neutral-900',
        'active:bg-neutral-200',
      ],
      danger: [
        'bg-red-600',
        'text-white',
        'shadow-sm',
        'hover:bg-red-700',
        'active:bg-red-700',
      ],
      'icon-only': [
        'tap-target',
        'border',
        'border-neutral-200',
        'bg-white',
        'p-0',
        'text-neutral-600',
        'shadow-xs',
        'hover:bg-neutral-50',
        'hover:text-neutral-900',
        'active:bg-neutral-100',
      ],
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
