import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'admin-theme';
  
  // Initialize with light, we will update it in constructor if browser
  public readonly theme = signal<Theme>('light');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const storedTheme = localStorage.getItem(this.storageKey) as Theme | null;
      if (storedTheme === 'dark' || storedTheme === 'light') {
        this.theme.set(storedTheme);
      } else {
        // Optional: Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.theme.set(prefersDark ? 'dark' : 'light');
      }

      // Apply theme when signal changes
      effect(() => {
        const currentTheme = this.theme();
        localStorage.setItem(this.storageKey, currentTheme);
        
        if (currentTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      });
    }
  }

  toggleTheme(): void {
    this.theme.update(current => current === 'light' ? 'dark' : 'light');
  }
}
