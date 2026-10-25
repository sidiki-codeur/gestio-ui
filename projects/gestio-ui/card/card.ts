import { Component, computed, input } from '@angular/core';
import { GestioCardActions, GestioCardFooter } from './card-slots';

export type GestioCardVariant = 'bordered' | 'elevated' | 'flat';
export type GestioCardPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * Conteneur visuel. Aucune sémantique interactive n'est ajoutée : pour une
 * carte cliquable, placer un lien ou un bouton à l'intérieur.
 *
 * Zones de projection : `[gestioCardHeader]`, `[gestioCardActions]`
 * (à droite de l'en-tête), contenu par défaut et `[gestioCardFooter]`.
 * Importer `GestioCardActions` et `GestioCardFooter` (ou `GESTIO_CARD_IMPORTS`)
 * pour la mise en page de ces deux zones.
 */
@Component({
  selector: 'gestio-card',
  template: `
    <div class="gestio-card__header">
      <div class="gestio-card__heading"><ng-content select="[gestioCardHeader]" /></div>
      <div class="gestio-card__actions"><ng-content select="[gestioCardActions]" /></div>
    </div>
    <div class="gestio-card__body"><ng-content /></div>
    <div class="gestio-card__footer"><ng-content select="[gestioCardFooter]" /></div>
  `,
  styleUrl: './card.scss',
  host: {
    class: 'gestio-card',
    '[class]': 'modifierClasses()',
  },
})
export class GestioCard {
  readonly variant = input<GestioCardVariant>('bordered');
  /** Espacement intérieur des zones. */
  readonly padding = input<GestioCardPadding>('md');

  protected readonly modifierClasses = computed(
    () => `gestio-card--${this.variant()} gestio-card--padding-${this.padding()}`,
  );
}

/** Composant carte et ses zones mises en forme. */
export const GESTIO_CARD_IMPORTS = [GestioCard, GestioCardActions, GestioCardFooter] as const;
