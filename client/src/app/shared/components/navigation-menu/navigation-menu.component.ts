import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavigationMenuLink {
  label: string;
  path: string | readonly unknown[];
  exact?: boolean;
}

@Component({
  selector: 'app-navigation-menu',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <nav
      class="hidden items-center gap-1 rounded-md border-hairline border-border-default bg-surface-subtle p-1 xl:flex"
      [attr.aria-label]="label()"
    >
      @for (link of links(); track link.path) {
        <a
          class="inline-flex min-h-touch-min items-center rounded-sm px-sm type-label-md text-text-secondary no-underline interactive-transition hover:bg-surface-raised hover:text-text-primary hover:shadow-xs focus-visible:focus-ring"
          routerLinkActive="!bg-surface-raised !text-text-primary font-semibold shadow-xs ring-1 ring-border-default"
          [routerLink]="link.path"
          [routerLinkActiveOptions]="{ exact: link.exact ?? false }"
        >
          {{ link.label }}
        </a>
      }
    </nav>
  `,
})
export class NavigationMenuComponent {
  readonly label = input('Primary navigation');
  readonly links = input<readonly NavigationMenuLink[]>([]);
}
