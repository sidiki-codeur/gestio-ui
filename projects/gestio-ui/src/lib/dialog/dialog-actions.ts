import { Component } from '@angular/core';

/**
 * Zone d'actions d'une modale, projetée dans le pied de `<gestio-dialog>`.
 * Aligne les boutons à droite ; empilés pleine largeur sur petit écran.
 *
 * ```html
 * <div gestioDialogActions>…boutons…</div>
 * ```
 */
@Component({
  selector: '[gestioDialogActions]',
  template: '<ng-content />',
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gestio-space-2);
      justify-content: flex-end;
      align-items: center;
      width: 100%;
    }

    @media (max-width: 480px) {
      :host {
        flex-direction: column-reverse;
        align-items: stretch;
      }
    }
  `,
  host: { class: 'gestio-dialog-actions' },
})
export class GestioDialogActions {}
