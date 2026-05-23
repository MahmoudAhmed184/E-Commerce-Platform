import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  id?: string;
  label: string;
  href?: string;
  routerLink?: string | readonly unknown[];
}

interface BreadcrumbDisplayItem extends BreadcrumbItem {
  id: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <nav aria-label="Breadcrumb">
      <ol class="flex flex-wrap items-center gap-xs type-body-sm text-text-muted">
        @for (item of displayItems(); track item.id) {
          <li class="flex items-center gap-xs">
            @if (item.routerLink) {
              <a class="text-text-info interactive-transition hover:text-accent-900 focus-visible:focus-ring" [routerLink]="item.routerLink">{{ item.label }}</a>
            } @else if (item.href) {
              <a class="text-text-info interactive-transition hover:text-accent-900 focus-visible:focus-ring" [href]="item.href">{{ item.label }}</a>
            } @else {
              <span>{{ item.label }}</span>
            }
            <span aria-hidden="true">/</span>
          </li>
        }
        <li class="text-text-primary" aria-current="page">{{ currentLabel() }}</li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbComponent {
  readonly items = input<readonly BreadcrumbItem[]>([]);
  readonly currentLabel = input.required<string>();
  readonly collapseAt = input(4);

  protected readonly displayItems = computed<readonly BreadcrumbDisplayItem[]>(() =>
    this.items().map((item, index) => ({
      ...item,
      id: item.id ?? `${index}-${String(item.routerLink ?? item.href ?? item.label)}`,
    })),
  );
}
