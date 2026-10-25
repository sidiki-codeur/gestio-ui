import { Component, ViewEncapsulation, booleanAttribute, input } from '@angular/core';

export type GestioTableDensity = 'compact' | 'comfortable';

/**
 * Style d'un `<table>` natif : la sémantique (caption, th scope, thead/tbody/tfoot)
 * reste entièrement celle de HTML.
 *
 * ```html
 * <gestio-table-container label="Factures">
 *   <table gestioTable striped>
 *     <caption>Factures d'octobre</caption>
 *     <thead><tr><th scope="col">N°</th><th scope="col" class="gestio-table-numeric">Montant</th></tr></thead>
 *     <tbody><tr><td>F-118</td><td class="gestio-table-numeric">1 250,00 €</td></tr></tbody>
 *   </table>
 * </gestio-table-container>
 * ```
 *
 * Les cellules étant écrites par l'application, les styles ne sont pas
 * encapsulés : ils sont tous limités aux tableaux portant la classe `gestio-table`
 * (spécificité minimale via `:where()`, facile à surcharger).
 */
@Component({
  selector: 'table[gestioTable]',
  template: '<ng-content />',
  styleUrl: './table.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'gestio-table',
    '[class.gestio-table--compact]': 'density() === "compact"',
    '[class.gestio-table--striped]': 'striped()',
    '[class.gestio-table--hover]': 'hover()',
    '[class.gestio-table--column-dividers]': 'columnDividers()',
  },
})
export class GestioTable {
  /** Hauteur des lignes. */
  readonly density = input<GestioTableDensity>('comfortable');
  /** Alterne la couleur de fond des lignes. */
  readonly striped = input(false, { transform: booleanAttribute });
  /** Surligne la ligne survolée. */
  readonly hover = input(true, { transform: booleanAttribute });
  /** Traits verticaux entre les colonnes. */
  readonly columnDividers = input(false, { transform: booleanAttribute });
}

/**
 * Conteneur d'un tableau : bordure, coins arrondis et défilement horizontal
 * accessible au clavier (zone focalisable, nommée par `label`).
 */
@Component({
  selector: 'gestio-table-container',
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      max-width: 100%;
      overflow: auto;
      border: var(--gestio-border-width) solid var(--gestio-color-border);
      border-radius: var(--gestio-radius-lg);
      background: var(--gestio-color-surface);
      -webkit-overflow-scrolling: touch;
    }

    :host(:focus-visible) {
      outline: 2px solid var(--gestio-color-focus-ring);
      outline-offset: 2px;
    }
  `,
  host: {
    class: 'gestio-table-container',
    tabindex: '0',
    '[attr.role]': 'label() ? "region" : null',
    '[attr.aria-label]': 'label() ?? null',
    '[style.max-height]': 'maxHeight() ?? null',
  },
})
export class GestioTableContainer {
  /** Nom accessible de la zone défilante (recommandé). */
  readonly label = input<string>();
  /** Hauteur maximale (ex. `'24rem'`) : l'en-tête du tableau reste alors visible. */
  readonly maxHeight = input<string>();
}
