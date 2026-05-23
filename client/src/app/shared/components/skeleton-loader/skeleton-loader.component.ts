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
    <div class="grid gap-3" role="status" [attr.aria-label]="label()" aria-busy="true">
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
      line: 'h-4 w-full rounded-full',
      block: 'h-10 w-full rounded-lg',
      circle: 'aspect-square w-14 rounded-full',
      media: 'aspect-square w-full rounded-xl',
    };

    return ['block', 'shimmer', 'rounded-lg', shapes[this.shape()]].join(' ');
  });
}
