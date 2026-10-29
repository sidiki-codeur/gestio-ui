import { Directive, inject, input } from '@angular/core';
import { GestioStepper } from './stepper';

/**
 * Passe à l'étape suivante du `gestio-stepper` parent au clic. Le focus est
 * alors placé sur l'en-tête de la nouvelle étape.
 *
 * ```html
 * <button gestioButton gestioStepperNext>Suivant</button>
 * ```
 *
 * En mode `linear`, le clic est sans effet tant que l'étape n'est pas terminée :
 * ajoutez votre propre `(click)` pour afficher les erreurs du formulaire.
 */
@Directive({
  selector: 'button[gestioStepperNext]',
  host: {
    '[attr.type]': 'type()',
    '(click)': 'go()',
  },
})
export class GestioStepperNext {
  private readonly stepper = inject(GestioStepper);

  /** Type natif du bouton. `button` par défaut pour ne pas soumettre de formulaire. */
  readonly type = input<'button' | 'submit'>('button');

  protected go(): void {
    this.stepper.ɵstep(1);
  }
}

/**
 * Revient à l'étape précédente du `gestio-stepper` parent au clic. Le focus
 * est alors placé sur l'en-tête de la nouvelle étape.
 *
 * ```html
 * <button gestioButton variant="outline" gestioStepperPrevious>Précédent</button>
 * ```
 */
@Directive({
  selector: 'button[gestioStepperPrevious]',
  host: {
    '[attr.type]': 'type()',
    '(click)': 'go()',
  },
})
export class GestioStepperPrevious {
  private readonly stepper = inject(GestioStepper);

  /** Type natif du bouton. `button` par défaut pour ne pas soumettre de formulaire. */
  readonly type = input<'button' | 'submit'>('button');

  protected go(): void {
    this.stepper.ɵstep(-1);
  }
}
