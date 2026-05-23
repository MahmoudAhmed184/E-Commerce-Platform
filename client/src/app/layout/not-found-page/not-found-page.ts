import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [ErrorStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="grid min-h-[var(--ui-layout-min-screen-minus-header)] place-items-center bg-transparent px-gutter-xs py-2xl md:px-gutter-sm">
      <app-error-state
        statusCode="404"
        title="Page not found"
        message="This link may have moved or expired. Return home, search products, or contact support if you were trying to reach an order."
        homeLink="/"
        supportLink="mailto:support@vendra.com"
      />
    </main>
  `,
})
export class NotFoundPage {}
