import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

const THEME_STORAGE_KEY = 'vendra-commerce-theme';

describe('ThemeService', () => {
  const originalMatchMedia = globalThis.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    installMatchMedia(false);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    Object.defineProperty(globalThis, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it('uses light mode when the system preference is light and no explicit preference exists', () => {
    const service = TestBed.inject(ThemeService);

    TestBed.tick();

    expect(service.preference()).toBe('system');
    expect(service.resolvedTheme()).toBe('light');
    expect(service.isLightMode()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('honors a stored dark preference over system light mode', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const service = TestBed.inject(ThemeService);

    TestBed.tick();

    expect(service.preference()).toBe('dark');
    expect(service.resolvedTheme()).toBe('dark');
    expect(service.isLightMode()).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('persists explicit light and dark toggles', () => {
    const service = TestBed.inject(ThemeService);

    TestBed.tick();
    service.toggleResolvedTheme();
    TestBed.tick();

    expect(service.preference()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    service.toggleResolvedTheme();
    TestBed.tick();

    expect(service.preference()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});

class StaticMediaQueryList implements MediaQueryList {
  private readonly listeners = new Set<EventListenerOrEventListenerObject>();
  private readonly legacyListeners = new Set<(this: MediaQueryList, ev: MediaQueryListEvent) => unknown>();
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null = null;

  constructor(
    readonly matches: boolean,
    readonly media: string,
  ) {}

  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (type === 'change' && listener !== null) {
      this.listeners.add(listener);
    }
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (type === 'change' && listener !== null) {
      this.listeners.delete(listener);
    }
  }

  dispatchEvent(event: Event): boolean {
    for (const listener of this.listeners) {
      if (typeof listener === 'function') {
        listener.call(this, event);
      } else {
        listener.handleEvent(event);
      }
    }

    return true;
  }

  addListener(listener: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null): void {
    if (listener !== null) {
      this.legacyListeners.add(listener);
    }
  }

  removeListener(listener: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null): void {
    if (listener !== null) {
      this.legacyListeners.delete(listener);
    }
  }
}

function installMatchMedia(matches: boolean): void {
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => new StaticMediaQueryList(matches, query),
  });
}
