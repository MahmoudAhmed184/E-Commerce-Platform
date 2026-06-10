import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { uniqueId } from '../component-utils';

export interface UiTab {
  id: string;
  label: string;
  disabled?: boolean;
  content?: string;
}

interface UiDisplayTab extends UiTab {
  tabId: string;
  panelId: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="grid gap-6">
      <div
        class="inline-flex w-fit flex-wrap gap-1 rounded-md bg-surface-subtle p-1"
        role="tablist"
        [attr.aria-orientation]="orientation()"
      >
        @for (tab of displayTabs(); track tab.id) {
          <button
            class="min-h-touch-min rounded-sm px-md py-xs type-label-md interactive-transition focus-visible:focus-ring disabled:state-disabled"
            [class.bg-surface-raised]="tab.id === selectedId()"
            [class.text-text-primary]="tab.id === selectedId()"
            [class.shadow-xs]="tab.id === selectedId()"
            [class.text-text-muted]="tab.id !== selectedId()"
            [class.hover:text-text-secondary]="tab.id !== selectedId()"
            type="button"
            role="tab"
            [id]="tab.tabId"
            [attr.aria-selected]="tab.id === selectedId()"
            [attr.aria-controls]="tab.panelId"
            [disabled]="tab.disabled"
            (click)="activate(tab)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      @if (selectedTab(); as tab) {
        <section
          class="type-body-md text-text-secondary"
          role="tabpanel"
          [id]="tab.panelId"
          [attr.aria-labelledby]="tab.tabId"
          tabindex="0"
        >
          @if (tab.content) {
            <p>{{ tab.content }}</p>
          }
          <ng-content />
        </section>
      }
    </div>
  `,
})
export class TabsComponent {
  readonly tabs = input<readonly UiTab[]>([]);
  readonly activeId = input<string | null>(null);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly lazy = input(true);

  readonly activeIdChange = output<string>();

  private readonly componentId = uniqueId('tabs');
  protected readonly displayTabs = computed<readonly UiDisplayTab[]>(() =>
    this.tabs().map((tab) => ({
      ...tab,
      tabId: tabElementId(this.componentId, tab.id),
      panelId: panelElementId(this.componentId, tab.id),
    })),
  );
  protected readonly selectedId = computed(() => this.activeId() ?? this.displayTabs().find((tab) => !tab.disabled)?.id ?? '');
  protected readonly selectedTab = computed(() => this.displayTabs().find((tab) => tab.id === this.selectedId()) ?? null);

  protected activate(tab: UiTab): void {
    if (tab.disabled) {
      return;
    }
    this.activeIdChange.emit(tab.id);
  }
}

function tabElementId(componentId: string, id: string): string {
  return `${componentId}-tab-${id}`;
}

function panelElementId(componentId: string, id: string): string {
  return `${componentId}-panel-${id}`;
}
