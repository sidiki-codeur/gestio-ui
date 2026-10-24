import { Component, Directive, ViewEncapsulation, computed, input } from '@angular/core';
import { GestioResponsive, GestioSpace } from './responsive';
import { resolveResponsive, responsiveVars, spaceToken } from './responsive-utils';

/** Nombre de colonnes occupées, ou `'full'` pour toute la largeur. */
export type GestioGridSpan = number | 'full';

/**
 * Grille responsive. Deux modes :
 * - `columns` : nombre de colonnes par point de rupture, ex. `{ base: 1, md: 2, xl: 4 }` ;
 * - `minItemWidth` : autant de colonnes que possible d'au moins cette largeur (ex. `'16rem'`).
 *
 * Les points de rupture s'appliquent à la largeur **de la grille** (container
 * queries) : la même grille s'adapte dans une page comme dans une carte étroite.
 *
 * ```html
 * <gestio-grid [columns]="{ base: 1, sm: 2, lg: 4 }" [gap]="4">
 *   <gestio-card>…</gestio-card>
 *   <gestio-card [gestioGridSpan]="{ base: 'full', lg: 2 }">…</gestio-card>
 * </gestio-grid>
 * ```
 */
@Component({
  selector: 'gestio-grid',
  template: '<div class="gestio-grid__inner"><ng-content /></div>',
  styleUrl: './grid.scss',
  // Les éléments de la grille sont projetés : les styles doivent les atteindre.
  // Toutes les règles sont préfixées par .gestio-grid.
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'gestio-grid',
    '[class.gestio-grid--auto]': '!!minItemWidth()',
    '[style]': 'vars()',
  },
})
export class GestioGrid {
  readonly columns = input<GestioResponsive<number>>(1);
  /** Mode automatique : largeur minimale d'une colonne (prioritaire sur `columns`). */
  readonly minItemWidth = input<string>();
  readonly gap = input<GestioResponsive<GestioSpace>>(4);
  /** Alignement vertical des éléments dans leur ligne. */
  readonly align = input<'start' | 'center' | 'end' | 'stretch'>('stretch');

  protected readonly vars = computed(() => ({
    ...responsiveVars('--gestio-grid-cols', resolveResponsive(this.columns(), 1), (n) =>
      String(Math.max(1, Math.floor(n))),
    ),
    ...responsiveVars(
      '--gestio-grid-gap',
      resolveResponsive<GestioSpace>(this.gap(), 4),
      spaceToken,
    ),
    '--gestio-grid-min': this.minItemWidth() ?? null,
    '--gestio-grid-align': this.align(),
  }));
}

/**
 * Nombre de colonnes occupées par un élément de `gestio-grid`, éventuellement
 * par point de rupture : `[gestioGridSpan]="{ base: 'full', md: 2 }"`.
 * Garder un nombre inférieur ou égal aux colonnes disponibles à chaque point.
 */
@Directive({
  selector: '[gestioGridSpan]',
  host: {
    class: 'gestio-grid-item',
    '[style]': 'vars()',
  },
})
export class GestioGridItem {
  readonly span = input.required<GestioResponsive<GestioGridSpan>>({ alias: 'gestioGridSpan' });

  protected readonly vars = computed(() =>
    responsiveVars('--gestio-grid-span', resolveResponsive(this.span(), 1), (span) =>
      span === 'full' ? '1 / -1' : `span ${Math.max(1, Math.floor(span))}`,
    ),
  );
}
