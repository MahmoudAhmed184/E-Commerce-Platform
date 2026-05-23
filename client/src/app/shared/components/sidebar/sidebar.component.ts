import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarLink {
  label: string;
  path: string | readonly unknown[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <aside class="glass-panel glass-depth-raised hidden border-e border-glass-border p-md lg:block" [attr.aria-label]="ariaLabel()">
      <a class="inline-flex items-center gap-xs rounded-sm type-heading-sm text-card-foreground focus-visible:focus-ring" [routerLink]="homeLink()">
        <img class="size-8 object-contain" [src]="brandIconSrc()" alt="" width="1024" height="1024" />
        <span>{{ brandLabel() }}</span>
      </a>
      <nav class="mt-lg grid gap-2xs" [attr.aria-label]="navLabel()">
        @for (link of links(); track link.path) {
          <a
            class="min-h-control-md rounded-md px-sm py-xs type-label-md text-muted-foreground interactive-transition hover:bg-glass-white-12 hover:text-card-foreground focus-visible:focus-ring"
            [routerLink]="link.path"
            routerLinkActive="bg-glass-white-12 text-text-primary shadow-glass-flat"
            [routerLinkActiveOptions]="{ exact: link.path === homeLink() }"
          >
            {{ link.label }}
          </a>
        }
      </nav>
    </aside>
  `,
})
export class SidebarComponent {
  readonly brandLabel = input.required<string>();
  readonly brandIconSrc = input('logo-icon.png?v=20260522');
  readonly homeLink = input<string | readonly unknown[]>('/');
  readonly links = input<readonly SidebarLink[]>([]);
  readonly ariaLabel = input('Sidebar');
  readonly navLabel = input('Sidebar navigation');
}
