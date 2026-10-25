import { Component, booleanAttribute, input } from '@angular/core';
import { GestioSize } from '@gestiolabs336/ui/core';

export type GestioSpinnerSize = GestioSize;

/**
 * Indicateur de chargement circulaire. Annonce `label` aux lecteurs d'écran
 * (`role="status"`), sauf s'il est `decorative` (le contexte l'annonce déjà).
 *
 * ```html
 * <gestio-spinner label="Chargement des factures" />
 * ```
 */
@Component({
  selector: 'gestio-spinner',
  template: `
    <span class="gestio-spinner__circle" aria-hidden="true"></span>
    @if (!decorative()) {
      <span class="gestio-spinner__label">{{ label() }}</span>
    }
  `,
  styleUrl: './spinner.scss',
  host: {
    '[class]': "'gestio-spinner gestio-spinner--' + size()",
    '[attr.role]': 'decorative() ? null : "status"',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
  },
})
export class GestioSpinner {
  readonly size = input<GestioSpinnerSize>('md');
  /** Texte annoncé (masqué visuellement). */
  readonly label = input('Chargement en cours');
  /** Masque l'indicateur aux technologies d'assistance. */
  readonly decorative = input(false, { transform: booleanAttribute });
}
