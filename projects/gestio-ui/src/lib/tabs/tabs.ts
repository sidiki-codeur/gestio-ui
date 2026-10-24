import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  input,
  model,
  viewChildren,
} from '@angular/core';
import { gestioUniqueId } from '../core/id';
import { GestioTab } from './tab';
import { GESTIO_TABS, GestioTabsHost } from './tabs-host';

export type GestioTabsVariant = 'underline' | 'pills';

/**
 * Onglets accessibles (motif ARIA « Tabs », activation automatique).
 *
 * ```html
 * <gestio-tabs [(selectedIndex)]="onglet" ariaLabel="Fiche client">
 *   <gestio-tab label="Informations">…</gestio-tab>
 *   <gestio-tab label="Factures">…</gestio-tab>
 *   <gestio-tab label="Archives" disabled>…</gestio-tab>
 * </gestio-tabs>
 * ```
 *
 * Clavier : flèches gauche/droite, Début/Fin. Les onglets désactivés sont ignorés.
 */
@Component({
  selector: 'gestio-tabs',
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
  providers: [{ provide: GESTIO_TABS, useExisting: forwardRef(() => GestioTabs) }],
  host: {
    class: 'gestio-tabs',
    '[class.gestio-tabs--pills]': 'variant() === "pills"',
    '[class.gestio-tabs--underline]': 'variant() === "underline"',
  },
})
export class GestioTabs implements GestioTabsHost {
  /** Index de l'onglet sélectionné (liaison bidirectionnelle `[(selectedIndex)]`). */
  readonly selectedIndex = model(0);
  readonly variant = input<GestioTabsVariant>('underline');
  /** Nom accessible de la liste d'onglets. */
  readonly ariaLabel = input<string>();
  /** Étire les onglets sur toute la largeur. */
  readonly stretch = input(false, { transform: booleanAttribute });

  readonly baseId = gestioUniqueId('gestio-tabs');
  readonly tabs = contentChildren(GestioTab);
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  /**
   * Onglet réellement actif : l'index demandé s'il est valide et activable,
   * sinon le premier onglet activable.
   */
  readonly activeIndex = computed(() => {
    const tabs = this.tabs();
    const requested = this.selectedIndex();
    if (tabs[requested] && !tabs[requested].disabled()) return requested;
    return tabs.findIndex((tab) => !tab.disabled());
  });

  protected select(index: number): void {
    const tab = this.tabs()[index];
    if (!tab || tab.disabled() || index === this.activeIndex()) return;
    this.selectedIndex.set(index);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    const enabled = this.tabs()
      .map((tab, index) => ({ tab, index }))
      .filter(({ tab }) => !tab.disabled())
      .map(({ index }) => index);
    if (!enabled.length) return;

    const position = enabled.indexOf(this.activeIndex());
    let target: number | undefined;

    switch (event.key) {
      case 'ArrowRight':
        target = enabled[(position + 1) % enabled.length];
        break;
      case 'ArrowLeft':
        target = enabled[(position - 1 + enabled.length) % enabled.length];
        break;
      case 'Home':
        target = enabled[0];
        break;
      case 'End':
        target = enabled[enabled.length - 1];
        break;
      default:
        return;
    }

    event.preventDefault();
    this.select(target);
    this.tabButtons()[target]?.nativeElement.focus();
  }
}
