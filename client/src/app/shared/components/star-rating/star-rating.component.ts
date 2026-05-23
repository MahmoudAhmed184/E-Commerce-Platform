import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { uniqueId } from '../component-utils';
import type { UiSize } from '../ui.types';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (readonly()) {
      <span class="inline-flex items-center gap-xs text-text-secondary" [attr.aria-label]="textEquivalent()">
        <span class="text-warning-400" aria-hidden="true">{{ displayStars() }}</span>
        <span class="type-body-sm">{{ textEquivalent() }}</span>
      </span>
    } @else {
      <fieldset class="grid gap-xs" [attr.aria-describedby]="error() ? errorId : null">
        <legend class="type-label-md text-text-primary">{{ label() }}</legend>
        <div class="flex items-center gap-2xs" role="radiogroup">
          @if (allowClear()) {
            <button class="min-h-control-sm rounded-sm px-xs type-label-sm text-text-muted interactive-transition hover:bg-glass-white-12 focus-visible:focus-ring" type="button" (click)="valueChange.emit(0)">Clear</button>
          }
          @for (star of editableStars(); track star.rating) {
            <label class="inline-flex min-h-touch-min cursor-pointer items-center">
              <input
                class="sr-only"
                type="radio"
                [name]="groupName"
                [value]="star.rating"
                [checked]="star.rating === value()"
                [attr.aria-label]="star.rating + ' of ' + max()"
                (change)="valueChange.emit(star.rating)"
              />
              <span [class]="star.classes" aria-hidden="true">★</span>
            </label>
          }
        </div>
        @if (error()) {
          <p class="type-body-sm text-text-error" [id]="errorId" aria-live="polite">{{ error() }}</p>
        }
      </fieldset>
    }
  `,
})
export class StarRatingComponent {
  readonly value = input(0);
  readonly readonly = input(true);
  readonly max = input(5);
  readonly size = input<UiSize>('md');
  readonly label = input('Rating');
  readonly allowClear = input(false);
  readonly error = input<string | null>(null);

  readonly valueChange = output<number>();

  protected readonly groupName = uniqueId('rating');
  protected readonly errorId = `${this.groupName}-error`;
  protected readonly ratingValues = computed(() => Array.from({ length: this.max() }, (_, index) => index + 1));
  protected readonly textEquivalent = computed(() => `${this.value()} out of ${this.max()}`);
  protected readonly displayStars = computed(() => this.ratingValues().map((rating) => rating <= Math.round(this.value()) ? '★' : '☆').join(''));
  protected readonly editableStars = computed(() =>
    this.ratingValues().map((rating) => ({ rating, classes: starClasses(rating, this.value(), this.size()) })),
  );
}

function starClasses(rating: number, value: number, size: UiSize): string {
  const sizes: Record<UiSize, string> = {
    sm: 'text-size-label-lg',
    md: 'text-size-heading-sm',
    lg: 'text-size-heading-md',
  };
  return `${sizes[size]} ${rating <= value ? 'text-warning-400' : 'text-icon-muted'}`;
}
