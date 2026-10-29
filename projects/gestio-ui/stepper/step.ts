import { Component, TemplateRef, booleanAttribute, input, viewChild } from '@angular/core';

/** Accepte `undefined` (état automatique) en plus des valeurs booléennes. */
function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null ? undefined : booleanAttribute(value);
}

/**
 * Étape d'un `gestio-stepper`. Son contenu est affiché par le stepper dans le
 * panneau de l'étape ; l'en-tête (numéro, libellé, état) est rendu par le stepper.
 *
 * ```html
 * <gestio-step label="Coordonnées" description="Adresse et contact" [completed]="contact.valid">
 *   …
 * </gestio-step>
 * ```
 *
 * Le contenu de toutes les étapes reste instancié (les panneaux inactifs sont
 * masqués par `hidden`) : l'état saisi est conservé d'une étape à l'autre.
 */
@Component({
  selector: 'gestio-step',
  template: `<ng-template #content><ng-content /></ng-template>`,
  styles: `
    :host {
      display: none;
    }
  `,
  host: { class: 'gestio-step' },
})
export class GestioStep {
  /** Libellé de l'étape. */
  readonly label = input.required<string>();
  /** Texte secondaire affiché sous le libellé. */
  readonly description = input<string>();
  /**
   * Étape terminée. Non renseigné : l'étape est considérée terminée une fois
   * quittée. En mode `linear`, `false` empêche d'aller au-delà de l'étape.
   */
  readonly completed = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBoolean,
  });
  /** Étape facultative : elle ne bloque jamais la progression en mode `linear`. */
  readonly optional = input(false, { transform: booleanAttribute });
  /** Signale une erreur dans l'étape (icône et état annoncé). */
  readonly hasError = input(false, { transform: booleanAttribute });
  /** `false` : impossible de revenir sur l'étape une fois quittée. */
  readonly editable = input(true, { transform: booleanAttribute });

  /** Contenu de l'étape, rendu par le stepper. Usage interne. */
  readonly content = viewChild.required<TemplateRef<unknown>>('content');
}
