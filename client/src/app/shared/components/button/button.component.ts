import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { UiSize } from '../ui.types';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'danger'
  | 'icon-only';
export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonIconPosition = 'start' | 'end';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (routerLink(); as link) {
      <a
        [class]="classes()"
        [routerLink]="link"
        [attr.aria-label]="computedAriaLabel()"
        [attr.aria-busy]="loading() ? 'true' : null"
        [attr.aria-disabled]="disabled() || loading() ? 'true' : null"
        [attr.tabindex]="disabled() || loading() ? -1 : null"
        (click)="press($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else if (href(); as link) {
      <a
        [class]="classes()"
        [href]="disabled() || loading() ? null : link"
        [attr.target]="target()"
        [attr.rel]="rel()"
        [attr.aria-label]="computedAriaLabel()"
        [attr.aria-busy]="loading() ? 'true' : null"
        [attr.aria-disabled]="disabled() || loading() ? 'true' : null"
        [attr.tabindex]="disabled() || loading() ? -1 : null"
        (click)="press($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <button
        [class]="classes()"
        [attr.type]="type()"
        [attr.aria-label]="computedAriaLabel()"
        [attr.aria-busy]="loading() ? 'true' : null"
        [disabled]="disabled() || loading()"
        (click)="press($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    }

    <ng-template #content>
      @if (loading()) {
        <span
          class="inline-block size-icon-sm rounded-full border-focus border-current border-e-transparent opacity-70"
          aria-hidden="true"
        ></span>
        <span class="sr-only">Loading</span>
      } @else if (icon() && iconPosition() === 'start') {
        <span class="inline-flex size-icon-sm items-center justify-center" aria-hidden="true">{{
          icon()
        }}</span>
      }

      @if (variant() !== 'icon-only') {
        <span class="inline-flex min-w-0 items-center gap-xs truncate"><ng-content /></span>
      }

      @if (!loading() && icon() && iconPosition() === 'end') {
        <span class="inline-flex size-icon-sm items-center justify-center" aria-hidden="true">{{
          icon()
        }}</span>
      }
    </ng-template>
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<UiSize>('md');
  readonly type = input<ButtonType>('button');
  readonly routerLink = input<string | unknown[] | null>(null);
  readonly href = input<string | null>(null);
  readonly target = input<string | null>(null);
  readonly rel = input<string | null>(null);
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
      'min-w-0',
      'items-center',
      'justify-center',
      'gap-xs',
      'rounded-md',
      'no-underline',
      'interactive-transition',
      'focus-visible:focus-ring',
      'disabled:state-disabled',
      'aria-disabled:state-disabled',
      'aria-busy:state-loading',
      'cursor-pointer',
    ];
    const sizeClasses: Record<UiSize, string[]> = {
      sm: ['min-h-touch-min', 'px-sm', 'type-label-sm'],
      md: ['min-h-touch-min', 'px-md', 'type-label-md'],
      lg: ['min-h-touch-min', 'px-lg', 'type-label-lg'],
    };
    const variantClasses: Record<ButtonVariant, string[]> = {
      primary: [
        'bg-surface-primary',
        'text-text-on-primary',
        'shadow-xs',
        'hover:bg-surface-primary-hover',
      ],
      secondary: [
        'border-hairline',
        'border-border-default',
        'bg-surface-raised',
        'text-text-primary',
        'shadow-xs',
        'hover:bg-surface-subtle',
      ],
      outline: [
        'border-hairline',
        'border-border-default',
        'bg-surface-raised',
        'text-text-primary',
        'shadow-xs',
        'hover:bg-surface-subtle',
      ],
      ghost: [
        'text-text-secondary',
        'shadow-none',
        'hover:bg-surface-subtle',
        'hover:text-text-primary',
      ],
      destructive: [
        'bg-surface-danger',
        'text-text-on-danger',
        'shadow-xs',
        'hover:bg-surface-danger-hover',
      ],
      danger: [
        'bg-surface-danger',
        'text-text-on-danger',
        'shadow-xs',
        'hover:bg-surface-danger-hover',
      ],
      'icon-only': [
        'tap-target',
        'p-0',
        'text-icon-default',
        'shadow-none',
        'hover:bg-surface-subtle',
        'hover:text-text-primary',
      ],
    };

    return [
      ...base,
      ...sizeClasses[this.size()],
      ...variantClasses[this.variant()],
      this.fullWidth() ? 'w-full' : '',
    ]
      .filter(Boolean)
      .join(' ');
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
