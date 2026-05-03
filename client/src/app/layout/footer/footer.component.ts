import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t border-slate-200 bg-white">
      <div class="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">Stack Commerce</div>
    </footer>
  `,
})
export class FooterComponent {}
