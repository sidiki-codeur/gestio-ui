import { Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { GESTIO_TABS, GestioTabsHost } from './tabs-host';

/**
 * Onglet et son panneau. L'élément `<gestio-tab>` est le `tabpanel` ;
 * l'en-tête cliquable est rendu par `<gestio-tabs>`.
 *
 * Les panneaux inactifs portent l'attribut `hidden` : leur contenu n'est ni
 * visible ni atteignable au clavier.
 */
@Component({
  selector: 'gestio-tab',
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
      padding-block: var(--gestio-space-4);
    }

    :host([hidden]) {
      display: none;
    }

    :host(:focus-visible) {
      outline: 2px solid var(--gestio-color-focus-ring);
      outline-offset: 2px;
      border-radius: var(--gestio-radius-sm);
    }
  `,
  host: {
    role: 'tabpanel',
    class: 'gestio-tab',
    '[id]': 'panelId()',
    '[attr.aria-labelledby]': 'tabId()',
    '[hidden]': '!active()',
    '[attr.tabindex]': 'active() ? 0 : null',
  },
})
export class GestioTab {
  private readonly tabs = inject<GestioTabsHost>(GESTIO_TABS);

  /** Libellé de l'onglet. */
  readonly label = input.required<string>();
  /** Désactive l'onglet : il n'est ni sélectionnable ni focalisable. */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly index = computed(() => this.tabs.tabs().indexOf(this));
  readonly active = computed(() => this.tabs.activeIndex() === this.index());
  readonly tabId = computed(() => `${this.tabs.baseId}-tab-${this.index()}`);
  readonly panelId = computed(() => `${this.tabs.baseId}-panel-${this.index()}`);
}
