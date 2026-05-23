import { TestBed } from '@angular/core/testing';

import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  beforeEach(async () => {
    localStorage.setItem('vendra-commerce-theme', 'light');

    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  it('toggles from white mode to dark mode when pressed', () => {
    const fixture = TestBed.createComponent(ThemeToggleComponent);

    fixture.detectChanges();
    TestBed.tick();

    const button = queryButton(fixture.nativeElement);
    expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');

    button.click();
    TestBed.tick();
    fixture.detectChanges();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(button.getAttribute('aria-label')).toBe('Switch to white mode');
  });
});

function queryButton(value: unknown): HTMLButtonElement {
  expect(value).toBeInstanceOf(HTMLElement);
  if (!(value instanceof HTMLElement)) {
    throw new Error('Expected fixture root to be an HTMLElement.');
  }

  const button = value.querySelector('button');
  expect(button).toBeInstanceOf(HTMLButtonElement);
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Expected theme toggle to render a button.');
  }

  return button;
}
