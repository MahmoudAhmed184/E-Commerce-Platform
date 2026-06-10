import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

const THEME_STORAGE_KEY = 'vendra-commerce-theme';
const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly systemThemeState = signal<ResolvedTheme>(this.readSystemTheme());
  private readonly preferenceState = signal<ThemePreference>(this.readStoredPreference());

  readonly preference = this.preferenceState.asReadonly();
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const preference = this.preferenceState();
    return preference === 'system' ? this.systemThemeState() : preference;
  });
  readonly isLightMode = computed(() => this.resolvedTheme() === 'light');

  constructor() {
    this.listenForSystemThemeChanges();

    effect(() => {
      const preference = this.preference();
      const resolvedTheme = this.resolvedTheme();

      this.applyTheme(resolvedTheme);
      this.persistPreference(preference);
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preferenceState.set(preference);
  }

  toggleResolvedTheme(): void {
    this.preferenceState.set(this.resolvedTheme() === 'light' ? 'dark' : 'light');
  }

  private readStoredPreference(): ThemePreference {
    if (!this.isBrowser) {
      return 'system';
    }

    try {
      const storedPreference = globalThis.localStorage.getItem(THEME_STORAGE_KEY);
      return isThemePreference(storedPreference) ? storedPreference : 'system';
    } catch {
      return 'system';
    }
  }

  private readSystemTheme(): ResolvedTheme {
    if (!this.isBrowser || typeof globalThis.matchMedia !== 'function') {
      return 'light';
    }

    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private listenForSystemThemeChanges(): void {
    if (!this.isBrowser || typeof globalThis.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = (event: MediaQueryListEvent): void => {
      this.systemThemeState.set(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', updateSystemTheme);
    this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', updateSystemTheme));
  }

  private applyTheme(theme: ResolvedTheme): void {
    const root = this.document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  }

  private persistPreference(preference: ThemePreference): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      if (preference === 'system') {
        globalThis.localStorage.removeItem(THEME_STORAGE_KEY);
        return;
      }

      globalThis.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      return;
    }
  }
}

function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && THEME_PREFERENCES.some((preference) => preference === value);
}
