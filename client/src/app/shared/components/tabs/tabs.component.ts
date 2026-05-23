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
    <div class="grid gap-md">
      <div
        class="inline-flex w-fit flex-wrap gap-1 rounded-lg bg-neutral-100 p-1"
        role="tablist"
        [attr.aria-orientation]="orientation()"
      >
        @for (tab of displayTabs(); track tab.id) {
          <button
            class="rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-150 ease-out focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:state-disabled"
            [class.bg-white]="tab.id === selectedId()"
            [class.text-neutral-900]="tab.id === selectedId()"
            [class.shadow-sm]="tab.id === selectedId()"
            [class.text-neutral-500]="tab.id !== selectedId()"
            [class.hover:text-neutral-700]="tab.id !== selectedId()"
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
          class="text-sm text-neutral-600"
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
