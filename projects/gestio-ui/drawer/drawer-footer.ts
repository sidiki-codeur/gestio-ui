import { Component } from '@angular/core';

/**
 * Zone d'actions d'un panneau, projetée dans le pied de `<gestio-drawer>`
 * ou de `<gestio-drawer-content>`. Aligne les boutons en fin de ligne ;
 * empilés pleine largeur sur petit écran.
 *
 * ```html
 * <div gestioDrawerFooter>…boutons…</div>
 * ```
 */
@Component({
  selector: '[gestioDrawerFooter]',
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
  host: { class: 'gestio-drawer-footer' },
})
export class GestioDrawerFooter {}
