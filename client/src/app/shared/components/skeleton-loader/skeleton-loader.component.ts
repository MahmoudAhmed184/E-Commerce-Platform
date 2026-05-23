import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SkeletonShape = 'line' | 'block' | 'circle' | 'media';

interface SkeletonItem {
  id: number;
}

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="grid gap-sm" role="status" [attr.aria-label]="label()" aria-busy="true">
      @for (item of items(); track item.id) {
        <span [class]="classes()" aria-hidden="true"></span>
      }
      <span class="sr-only">{{ label() }}</span>
    </div>
  `,
})
export class SkeletonLoaderComponent {
  readonly rows = input(1);
  readonly count = input(1);
  readonly shape = input<SkeletonShape>('line');
  readonly label = input('Loading content');

  protected readonly items = computed<readonly SkeletonItem[]>(() =>
    Array.from({ length: Math.max(this.rows(), this.count(), 1) }, (_, index) => ({ id: index })),
  );
  protected readonly classes = computed(() => {
    const shapes: Record<SkeletonShape, string> = {
      line: 'min-h-md w-full rounded-full',
      block: 'min-h-control-lg w-full rounded-md',
      circle: 'aspect-square w-thumbnail-sm rounded-full',
      media: 'aspect-square w-full rounded-md',
    };

    return ['block', 'bg-glass-white-12', 'shadow-glass-flat', 'backdrop-blur-md', 'state-loading', shapes[this.shape()]].join(' ');
  });
}
