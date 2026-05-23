import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import type { UiSize } from '../ui.types';

export type AvatarStatus = 'online' | 'offline' | 'busy' | 'none';

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <span [class]="classes()" [attr.aria-label]="name()">
      @if (imageUrl() && !imageFailed()) {
        <img
          class="h-full w-full rounded-full object-cover"
          [src]="imageUrl() ?? ''"
          [alt]="name()"
          (error)="imageFailed.set(true)"
        />
      } @else {
        <span aria-hidden="true">{{ initials() }}</span>
      }

      @if (status() !== 'none') {
        <span [class]="statusClasses()" aria-hidden="true"></span>
      }
    </span>
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly imageUrl = input<string | null>(null);
  readonly size = input<UiSize>('md');
  readonly status = input<AvatarStatus>('none');
  readonly fallbackInitials = input<string | null>(null);

  protected readonly imageFailed = signal(false);

  protected readonly initials = computed(() => {
    if (this.fallbackInitials()) {
      return this.fallbackInitials();
    }
    return this.name()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  protected readonly classes = computed(() => {
    const sizes: Record<UiSize, string> = {
      sm: 'size-control-sm type-label-sm',
      md: 'size-control-md type-label-md',
      lg: 'size-control-lg type-label-lg',
    };

    return `relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-hairline border-glass-border bg-glass-white-12 text-primary-900 shadow-glass-flat backdrop-blur-md ${sizes[this.size()]}`;
  });

  protected readonly statusClasses = computed(() => {
    return `absolute end-0 bottom-0 size-icon-sm rounded-full border-focus border-card ${statusTone(this.status())}`;
  });
}

function statusTone(status: AvatarStatus): string {
  switch (status) {
    case 'online':
      return 'bg-success-neon';
    case 'offline':
      return 'bg-icon-muted';
    case 'busy':
      return 'bg-warning-neon';
    case 'none':
      return '';
  }
}
