import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavigationMenuLink {
  label: string;
  path: string | readonly unknown[];
  exact?: boolean;
}

@Component({
  selector: 'app-navigation-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <nav class="glass-panel glass-depth-raised hidden items-center gap-2xs rounded-md p-2xs lg:flex" [attr.aria-label]="label()">
      @for (link of links(); track link.path) {
        <a
          class="inline-flex min-h-control-md items-center rounded-md px-sm type-label-md text-muted-foreground interactive-transition hover:bg-glass-white-12 hover:text-card-foreground focus-visible:focus-ring"
          routerLinkActive="bg-glass-white-12 text-text-primary shadow-glass-flat"
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
