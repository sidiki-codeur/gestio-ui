import { CdkAccordion } from '@angular/cdk/accordion';
import { Component, contentChildren, forwardRef, inject, input } from '@angular/core';
import { GESTIO_ACCORDION, GestioAccordionHost, GestioAccordionVariant } from './accordion-host';
import { GestioAccordionItem } from './accordion-item';

export type { GestioAccordionVariant } from './accordion-host';

/**
 * Accordéon accessible (motif ARIA « Accordion »), basé sur `CdkAccordion`.
 *
 * ```html
 * <gestio-accordion variant="separated">
 *   <gestio-accordion-item heading="Coordonnées" [expanded]="true">…</gestio-accordion-item>
 *   <gestio-accordion-item heading="Conditions de paiement">…</gestio-accordion-item>
 *   <gestio-accordion-item heading="Historique" disabled>…</gestio-accordion-item>
 * </gestio-accordion>
 * ```
 *
 * Par défaut, ouvrir une section referme les autres ; `multi` autorise
 * plusieurs sections ouvertes. Clavier : Entrée/Espace ouvre ou ferme,
 * flèches haut/bas, Début et Fin passent d'un en-tête à l'autre.
 */
@Component({
  selector: 'gestio-accordion',
  exportAs: 'gestioAccordion',
  template: `<ng-content />`,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-width: 0;
      color: var(--gestio-color-text);
      font-family: var(--gestio-font-sans);
    }

    :host(.gestio-accordion--bordered) {
      overflow: hidden;
      border: var(--gestio-border-width) solid var(--gestio-color-border);
      border-radius: var(--gestio-accordion-radius, var(--gestio-radius-lg));
      background: var(--gestio-color-surface);
    }

    :host(.gestio-accordion--separated) {
      gap: var(--gestio-space-2);
    }
  `,
  hostDirectives: [{ directive: CdkAccordion, inputs: ['multi'] }],
  providers: [{ provide: GESTIO_ACCORDION, useExisting: forwardRef(() => GestioAccordion) }],
  host: {
    class: 'gestio-accordion',
    '[class]': '"gestio-accordion--" + variant()',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class GestioAccordion implements GestioAccordionHost {
  private readonly cdkAccordion = inject(CdkAccordion);

  /** Apparence : bloc encadré, cartes séparées ou sans bordure extérieure. */
  readonly variant = input<GestioAccordionVariant>('bordered');

  private readonly items = contentChildren(GestioAccordionItem, { descendants: true });

  /** Ouvre toutes les sections actives (uniquement si `multi`). */
  openAll(): void {
    this.cdkAccordion.openAll();
  }

  /** Ferme toutes les sections actives. */
  closeAll(): void {
    this.cdkAccordion.closeAll();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    // Ne concerne que les en-têtes de cet accordéon (pas ceux d'un accordéon imbriqué).
    const items = this.items().filter((item) => item.accordionHost === this);
    const enabled = items.filter((item) => !item.disabled());
    const current = enabled.findIndex((item) => item.isTrigger(event.target));
    if (current === -1 || !enabled.length) return;

    let target: number;
    switch (event.key) {
      case 'ArrowDown':
        target = (current + 1) % enabled.length;
        break;
      case 'ArrowUp':
        target = (current - 1 + enabled.length) % enabled.length;
        break;
      case 'Home':
        target = 0;
        break;
      default:
        target = enabled.length - 1;
    }
    event.preventDefault();
    enabled[target].focus();
  }
}
