import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Service, inject, signal } from '@angular/core';

export type ShowcaseDesign = 'gestio' | 'material';

const STORAGE_KEY = 'gestio-showcase-design';

/**
 * Design du showcase : Gestio (par défaut) ou Material 3, appliqué par
 * l'attribut data-gestio-design sur <html>. Le design initial est posé par
 * le script de index.html (évite un flash) ; ce service le lit puis le met à jour.
 */
@Service()
export class DesignService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly design = signal<ShowcaseDesign>(
    this.document.documentElement.getAttribute('data-gestio-design') === 'material'
      ? 'material'
      : 'gestio',
  );

  toggle(): void {
    this.set(this.design() === 'material' ? 'gestio' : 'material');
  }

  set(design: ShowcaseDesign): void {
    this.design.set(design);
    const root = this.document.documentElement;
    if (design === 'material') {
      root.setAttribute('data-gestio-design', 'material');
    } else {
      root.removeAttribute('data-gestio-design');
    }
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEY, design);
    } catch {
      // Stockage indisponible (navigation privée, politique du navigateur) : sans conséquence.
    }
  }
}
