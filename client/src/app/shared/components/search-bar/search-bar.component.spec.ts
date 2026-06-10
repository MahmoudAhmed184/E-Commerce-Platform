import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SearchBarComponent, type SearchSuggestion } from './search-bar.component';

@Component({
  standalone: true,
  imports: [SearchBarComponent],
  template: `
    <app-search-bar
      [query]="query()"
      [suggestions]="suggestions"
      (queryChange)="query.set($event)"
      (suggestionSelected)="selected.set($event)"
    />
  `,
})
class SearchBarHostComponent {
  readonly query = signal('');
  readonly selected = signal<SearchSuggestion | null>(null);
  readonly suggestions: readonly SearchSuggestion[] = [
    { id: 'watch', label: 'Women watches', description: 'Accessories' },
  ];
}

describe('search-bar.component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBarHostComponent],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('closes the suggestion list when focus leaves the search control', () => {
    const fixture = TestBed.createComponent(SearchBarHostComponent);
    fixture.detectChanges();

    const root: unknown = fixture.nativeElement;
    expect(root).toBeInstanceOf(HTMLElement);
    if (!(root instanceof HTMLElement)) {
      return;
    }

    const input = querySearchInput(root);
    input.value = 'wo';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(root.querySelector('[role="listbox"]')).not.toBeNull();

    input.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }),
    );
    fixture.detectChanges();

    expect(root.querySelector('[role="listbox"]')).toBeNull();
  });
});

function querySearchInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('input[type="search"]');
  expect(input).toBeInstanceOf(HTMLInputElement);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected search bar to render a search input.');
  }

  return input;
}
