import { Component } from '@angular/core';

/** Zone d'actions de l'en-tête d'une carte : `<div gestioCardActions>…</div>`. */
@Component({
  selector: '[gestioCardActions]',
  template: '<ng-content />',
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gestio-space-2);
      align-items: center;
    }
  `,
  host: { class: 'gestio-card-actions' },
})
export class GestioCardActions {}

/** Pied de carte : `<div gestioCardFooter>…</div>`. Les boutons sont alignés à droite. */
@Component({
  selector: '[gestioCardFooter]',
  template: '<ng-content />',
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gestio-space-2);
      align-items: center;
      justify-content: flex-end;
      width: 100%;
    }
  `,
  host: { class: 'gestio-card-footer' },
})
export class GestioCardFooter {}
