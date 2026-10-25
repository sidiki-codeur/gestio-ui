import { Component, booleanAttribute, input } from '@angular/core';

export type GestioContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Conteneur centré à largeur maximale, avec des marges latérales qui
 * s'adaptent à l'écran (1 rem sur mobile, jusqu'à 2 rem).
 *
 * ```html
 * <gestio-container size="lg">…</gestio-container>
 * ```
 */
@Component({
  selector: 'gestio-container',
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      margin-inline: auto;
      max-width: var(--_max, none);
    }

    :host(.gestio-container--gutters) {
      padding-inline: clamp(var(--gestio-space-4), 4vw, var(--gestio-space-8));
    }
  `,
  host: {
    class: 'gestio-container',
    '[class.gestio-container--gutters]': 'gutters()',
    '[style.--_max]': 'maxWidths[size()]',
  },
})
export class GestioContainer {
  /** Largeur maximale : sm 40 rem, md 48 rem, lg 64 rem, xl 80 rem, full sans limite. */
  readonly size = input<GestioContainerSize>('xl');
  /** Marges latérales adaptatives. */
  readonly gutters = input(true, { transform: booleanAttribute });

  protected readonly maxWidths: Record<GestioContainerSize, string> = {
    sm: '40rem',
    md: '48rem',
    lg: '64rem',
    xl: '80rem',
    full: 'none',
  };
}
