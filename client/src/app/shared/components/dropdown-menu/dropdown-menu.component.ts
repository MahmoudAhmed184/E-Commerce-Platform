import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { AvatarComponent } from '../avatar/avatar.component';
import { uniqueId } from '../component-utils';
import type { UiMenuGroup, UiMenuItem } from '../ui.types';

export type DropdownPlacement = 'start' | 'end';
export type DropdownTrigger = 'label' | 'avatar';

interface NormalizedMenuItem extends UiMenuItem {
  disabledForMenu: boolean;
}

interface NormalizedMenuGroup extends Omit<UiMenuGroup, 'items'> {
  id: string;
  items: readonly NormalizedMenuItem[];
}

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative inline-flex' },
  template: `
    <button
      [class]="triggerClasses()"
      type="button"
      [attr.aria-label]="label()"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="menuId"
      [disabled]="disabled()"
      (click)="open.update((value) => !value)"
      (keydown.escape)="open.set(false)"
    >
      @if (trigger() === 'avatar') {
        <app-avatar [name]="avatarName() ?? label()" [imageUrl]="avatarImageUrl()" size="sm" />
      } @else {
        {{ label() }}
      }
    </button>

    @if (open()) {
      <div
        [class]="menuClasses()"
        role="menu"
        [id]="menuId"
        tabindex="-1"
        (keydown.escape)="open.set(false)"
      >
        @for (group of normalizedGroups(); track group.id) {
          @if (group.label) {
            <p class="px-sm py-2xs type-label-sm text-text-muted">{{ group.label }}</p>
          }
          @for (item of group.items; track item.id) {
            <button
              class="grid min-h-touch-min w-full gap-2xs rounded-sm px-sm py-xs text-start interactive-transition hover:bg-surface-subtle focus-visible:focus-ring disabled:state-disabled"
              [class.text-text-error]="item.destructive"
              [class.text-text-primary]="!item.destructive"
              type="button"
              role="menuitem"
              [disabled]="item.disabledForMenu"
              [attr.aria-current]="item.id === selectedId() ? 'true' : null"
              (click)="choose(item)"
            >
              <span class="type-label-md">{{ item.label }}</span>
              @if (item.description) {
                <span class="max-w-[16rem] type-body-sm text-text-muted">{{ item.description }}</span>
              }
            </button>
          }
        }
      </div>
    }
  `,
})
export class DropdownMenuComponent {
  readonly label = input('Actions');
  readonly items = input<readonly UiMenuItem[]>([]);
  readonly groups = input<readonly UiMenuGroup[] | null>(null);
  readonly placement = input<DropdownPlacement>('end');
  readonly trigger = input<DropdownTrigger>('label');
  readonly avatarName = input<string | null>(null);
  readonly avatarImageUrl = input<string | null>(null);
  readonly selectedId = input<string | null>(null);
  readonly disabledIds = input<readonly string[]>([]);
  readonly disabled = input(false);

  readonly selected = output<UiMenuItem>();

  protected readonly open = signal(false);
  protected readonly menuId = uniqueId('menu');
  protected readonly triggerClasses = computed(() => {
    if (this.trigger() === 'avatar') {
      return [
        'inline-flex',
        'min-h-touch-min min-w-touch-min',
        'items-center',
        'justify-center',
        'rounded-full',
        'p-0',
        'interactive-transition',
        'hover:shadow-md',
        'focus-visible:focus-ring',
        'disabled:state-disabled',
      ].join(' ');
    }

    return 'surface-panel surface-depth-raised inline-flex min-h-touch-min items-center gap-xs rounded-md px-md py-xs type-label-md text-text-primary interactive-transition hover:shadow-md focus-visible:focus-ring disabled:state-disabled';
  });
  protected readonly normalizedGroups = computed<readonly NormalizedMenuGroup[]>(() => {
    const disabledIds = new Set(this.disabledIds());

    return (this.groups() ?? [{ items: this.items() }]).map((group, index) => ({
      ...group,
      id: group.label ?? `menu-group-${index}`,
      items: group.items.map((item) => ({
        ...item,
        disabledForMenu: !!item.disabled || disabledIds.has(item.id),
      })),
    }));
  });
  protected readonly menuClasses = computed(() => {
    const placement = this.placement() === 'end' ? 'end-0' : 'start-0';
    return `surface-panel surface-depth-floating absolute ${placement} top-full z-dropdown mt-2xs grid w-[18rem] max-w-[90vw] gap-2xs rounded-md p-2xs`;
  });

  protected choose(item: NormalizedMenuItem): void {
    if (item.disabledForMenu) {
      return;
    }
    this.selected.emit(item);
    this.open.set(false);
  }
}
