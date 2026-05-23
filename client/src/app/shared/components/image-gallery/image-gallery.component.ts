import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { DialogComponent } from '../dialog/dialog.component';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import type { UiGalleryImage } from '../ui.types';

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [DialogComponent, SkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (loading()) {
      <app-skeleton-loader shape="media" label="Loading product images" />
    } @else {
      <section class="grid gap-sm" aria-label="Image gallery">
        @if (selectedImage(); as image) {
          <button class="glass-panel glass-depth-raised glass-border-shimmer grid overflow-hidden rounded-lg bg-surface-subtle focus-visible:focus-ring disabled:cursor-default" type="button" [disabled]="!zoomable()" (click)="openLightbox()">
            <img
              class="aspect-[var(--ui-ratio-hero-media)] max-h-[var(--ui-layout-product-gallery-max-block)] w-full object-contain p-sm sm:p-md"
              [src]="image.src"
              [alt]="image.alt"
            />
          </button>
        }

        <div class="flex gap-sm overflow-x-auto pb-2xs" role="list">
          @for (image of images(); track image.id; let index = $index) {
            <button
              class="h-thumbnail-sm w-thumbnail-lg shrink-0 overflow-hidden rounded-full border-hairline bg-glass-white-12 p-2xs shadow-glass-flat backdrop-blur-md interactive-transition hover:border-border-focus hover:shadow-glass-floating focus-visible:focus-ring"
              [class.border-border-focus]="index === selectedIndex()"
              [class.border-glass-border]="index !== selectedIndex()"
              [class.shadow-glass-raised]="index === selectedIndex()"
              [class.opacity-100]="index === selectedIndex()"
              [class.opacity-75]="index !== selectedIndex()"
              type="button"
              role="listitem"
              [attr.aria-label]="'Show image ' + (index + 1)"
              (click)="select(index)"
            >
              <img class="h-full w-full rounded-full object-cover" [src]="image.thumbnailSrc ?? image.src" [alt]="image.alt" />
            </button>
          }
        </div>
      </section>

      <app-dialog [open]="lightboxOpen()" title="Image preview" size="lg" (closed)="lightboxOpen.set(false)">
        @if (selectedImage(); as image) {
          <img class="max-h-[var(--ui-layout-lightbox-max-block)] w-full rounded-md object-contain" [src]="image.src" [alt]="image.alt" />
        }
      </app-dialog>
    }
  `,
})
export class ImageGalleryComponent {
  readonly images = input<readonly UiGalleryImage[]>([]);
  readonly selectedIndex = input(0);
  readonly zoomable = input(true);
  readonly swipe = input(true);
  readonly loading = input(false);

  readonly selectedIndexChange = output<number>();

  protected readonly lightboxOpen = signal(false);
  protected readonly selectedImage = computed(() => this.images()[this.selectedIndex()] ?? this.images()[0] ?? null);

  protected openLightbox(): void {
    if (!this.zoomable()) {
      return;
    }

    this.lightboxOpen.set(true);
  }

  protected select(index: number): void {
    this.selectedIndexChange.emit(index);
  }
}
