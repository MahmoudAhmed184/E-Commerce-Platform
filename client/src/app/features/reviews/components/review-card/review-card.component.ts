import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DropdownMenuComponent } from '../../../../shared/components/dropdown-menu/dropdown-menu.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import type { UiReview } from '../../../../core/models/commerce-ui/commerce-ui.model';
import type { UiMenuItem } from '../../../../shared/components/ui.types';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [BadgeComponent, ButtonComponent, DatePipe, DropdownMenuComponent, StarRatingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (reviewView(); as item) {
      <article class="grid gap-sm rounded-md border border-border bg-card p-md shadow-xs">
        <header class="flex flex-wrap items-start justify-between gap-sm">
          <div class="grid gap-2xs">
            <p class="type-label-md text-card-foreground">{{ item.authorName }}</p>
            <p class="type-body-sm text-muted-foreground">{{ item.createdAt | date: 'mediumDate' }}</p>
          </div>
          <app-badge [tone]="item.badgeTone" [label]="item.moderationState" />
        </header>

        <app-star-rating [value]="item.rating" [readonly]="true" size="sm" />

        @if (item.title) {
          <h3 class="type-heading-sm text-card-foreground">{{ item.title }}</h3>
        }
        <p class="type-body-md text-muted-foreground">{{ item.body }}</p>

        <footer class="flex flex-wrap items-center gap-xs">
          @if (canEdit()) {
            <app-button variant="secondary" size="sm" [loading]="actionLoading() === 'edit'" (pressed)="edit.emit(item)">Edit review</app-button>
          }
          @if (displayActions().length) {
            <app-dropdown-menu label="Actions" [items]="displayActions()" (selected)="selectMenuAction(item, $event)" />
          }
        </footer>

        @if (error()) {
          <p class="type-body-sm text-text-error" role="alert">{{ error() }}</p>
        }
      </article>
    }
  `,
})
export class ReviewCardComponent {
  readonly review = input<UiReview | null>(null);
  readonly canEdit = input(false);
  readonly canDelete = input(false);
  readonly moderationActions = input<readonly UiMenuItem[]>([]);
  readonly actionLoading = input<'edit' | 'delete' | null>(null);
  readonly error = input<string | null>(null);

  readonly edit = output<UiReview>();
  readonly delete = output<UiReview>();
  readonly moderationAction = output<{ review: UiReview; action: UiMenuItem }>();

  protected readonly reviewView = computed(() => {
    const review = this.review();
    return review ? { ...review, badgeTone: reviewBadgeTone(review.moderationState) } : null;
  });
  protected readonly displayActions = computed(() => {
    const actions: UiMenuItem[] = [...this.moderationActions()];
    if (this.canDelete()) {
      actions.unshift({ id: 'delete-review', label: 'Delete review', destructive: true });
    }
    return actions;
  });

  protected selectMenuAction(review: UiReview, action: UiMenuItem): void {
    if (action.id === 'delete-review') {
      this.delete.emit(review);
      return;
    }

    this.moderationAction.emit({ review, action });
  }
}

function reviewBadgeTone(state: UiReview['moderationState']): 'success' | 'warning' | 'error' | 'neutral' {
  const tones: Record<UiReview['moderationState'], 'success' | 'warning' | 'error' | 'neutral'> = {
    visible: 'success',
    pending: 'warning',
    hidden: 'warning',
    removed: 'error',
  };
  return tones[state];
}
