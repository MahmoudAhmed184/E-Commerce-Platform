import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';

@Component({
  selector: 'app-rating-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center" [class.cursor-pointer]="!readonly" (mouseleave)="hoverRating.set(0)">
      @for (star of stars; track star) {
        <button
          type="button"
          [disabled]="readonly"
          class="transition-transform duration-150 ease-in-out hover:scale-110 disabled:scale-100 disabled:cursor-default"
          [style.fontSize]="fontSize"
          (mouseenter)="onHover(star)"
          (click)="onSelect(star)"
          [attr.aria-label]="'Rate ' + star + ' stars'"
        >
          <span class="relative inline-block text-slate-200">
            <!-- Background star (empty) -->
            ★
            <!-- Foreground star (filled) -->
            <span
              class="absolute left-0 top-0 overflow-hidden text-amber-400"
              [style.width]="getFillWidth(star)"
            >
              ★
            </span>
          </span>
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-block; }
  `]
})
export class RatingWidgetComponent {
  @Input({ required: true }) rating = 0;
  @Input() readonly = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Output() rate = new EventEmitter<number>();

  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly hoverRating = signal(0);

  get fontSize(): string {
    switch (this.size) {
      case 'sm': return '1rem';
      case 'lg': return '2rem';
      default: return '1.5rem';
    }
  }

  protected onHover(star: number): void {
    if (!this.readonly) {
      this.hoverRating.set(star);
    }
  }

  protected onSelect(star: number): void {
    if (!this.readonly) {
      this.rate.emit(star);
    }
  }

  protected getFillWidth(star: number): string {
    const current = !this.readonly && this.hoverRating() > 0 ? this.hoverRating() : this.rating;
    
    if (current >= star) return '100%';
    if (current > star - 1) return `${(current - (star - 1)) * 100}%`;
    return '0%';
  }
}
