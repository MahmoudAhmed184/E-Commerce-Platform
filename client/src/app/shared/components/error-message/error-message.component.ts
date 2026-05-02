import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-error-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message()) {
      <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
        <p>{{ message() }}</p>
      </div>
    }

    @if (fieldErrors(); as errors) {
      <div class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
        @for (entry of fieldErrorEntries(errors); track entry.key) {
          <p><span class="font-medium">{{ entry.key }}:</span> {{ entry.value.join(' ') }}</p>
        }
      </div>
    }
  `,
})
export class ErrorMessageComponent {
  readonly message = input('');
  readonly fieldErrors = input<Record<string, string[]> | null | undefined>(null);

  protected fieldErrorEntries(errors: Record<string, string[]>): { key: string; value: string[] }[] {
    return Object.entries(errors).map(([key, value]) => ({ key, value }));
  }
}
