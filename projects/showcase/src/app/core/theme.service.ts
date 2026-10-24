import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Service, inject, signal } from '@angular/core';

export type ShowcaseTheme = 'light' | 'dark';

const STORAGE_KEY = 'gestio-showcase-theme';

/**
 * Thème du showcase. Le thème initial est posé par un court script dans
 * index.html (évite un flash) ; ce service le lit puis le met à jour.
 */
@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly theme = signal<ShowcaseTheme>(
    this.document.documentElement.getAttribute('data-gestio-theme') === 'dark' ? 'dark' : 'light',
  );

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: ShowcaseTheme): void {
    this.theme.set(theme);
    this.document.documentElement.setAttribute('data-gestio-theme', theme);
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Stockage indisponible (navigation privée, politique du navigateur) : sans conséquence.
    }
  }
}
