import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { uniqueId } from '../component-utils';

export interface AccordionItem {
  id: string;
  title: string;
  content: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-accordion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="surface-panel surface-depth-raised divide-y-hairline divide-border-default rounded-md">
      @for (item of displayItems(); track item.id) {
        <section>
          <h3>
            <button
              class="flex min-h-touch-min w-full items-center justify-between gap-md px-md py-sm text-start type-label-md text-text-primary interactive-transition hover:bg-surface-subtle focus-visible:focus-ring disabled:state-disabled"
              type="button"
              [id]="item.buttonId"
              [disabled]="item.disabled"
              [attr.aria-expanded]="item.open"
              [attr.aria-controls]="item.panelId"
              (click)="toggle(item)"
            >
              <span>{{ item.title }}</span>
              <span aria-hidden="true">{{ item.open ? '-' : '+' }}</span>
            </button>
          </h3>

          @if (item.open) {
            <div
              class="px-md pb-md type-body-md text-text-secondary"
              role="region"
              [id]="item.panelId"
              [attr.aria-labelledby]="item.buttonId"
            >
              {{ item.content }}
            </div>
          }
        </section>
      }
    </div>
  `,
})
export class AccordionComponent {
  readonly items = input<readonly AccordionItem[]>([]);
  readonly multiple = input(false);
  readonly defaultOpenIds = input<readonly string[]>([]);

  readonly openIdsChange = output<readonly string[]>();

  private readonly componentId = uniqueId('accordion');
  protected readonly openIds = signal<readonly string[]>([]);
  protected readonly displayItems = computed(() => {
    const current = this.openIds().length ? this.openIds() : this.defaultOpenIds();
    return this.items().map((item) => ({
      ...item,
      open: current.includes(item.id),
      buttonId: `${this.componentId}-button-${item.id}`,
      panelId: `${this.componentId}-panel-${item.id}`,
    }));
  });

  protected toggle(item: AccordionItem): void {
    if (item.disabled) {
      return;
    }
    const current = this.openIds().length ? this.openIds() : this.defaultOpenIds();
    const next = current.includes(item.id)
      ? current.filter((id) => id !== item.id)
      : this.multiple() ? [...current, item.id] : [item.id];
    this.openIds.set(next);
    this.openIdsChange.emit(next);
  }
}
