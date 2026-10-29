import { Directionality } from '@angular/cdk/bidi';
import { Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GESTIO_DRAWER_HOST } from './drawer-host';

/** Libellés du panneau latéral (internationalisation). */
export interface GestioDrawerLabels {
  /** Nom accessible du bouton de fermeture. */
  close: string;
}

export const GESTIO_DRAWER_LABELS: GestioDrawerLabels = {
  close: 'Fermer le panneau',
};

/**
 * Mise en page d'un panneau latéral : en-tête (titre, description, zone
 * libre), corps défilant, pied d'actions et bouton de fermeture.
 * À utiliser dans le composant ouvert par `GestioDrawerService`
 * (`<gestio-drawer>` l'utilise lui-même).
 *
 * ```html
 * <gestio-drawer-content heading="Facture F-2024-0042" description="Émise le 12 mars">
 *   <p>Contenu…</p>
 *   <div gestioDrawerFooter>
 *     <button gestioButton variant="outline" (click)="ref.close()">Fermer</button>
 *   </div>
 * </gestio-drawer-content>
 * ```
 */
@Component({
  selector: 'gestio-drawer-content',
  templateUrl: './drawer-content.html',
  styleUrl: './drawer.scss',
  host: {
    class: 'gestio-drawer-content',
    '[class.gestio-drawer-content--end]': 'position() === "end"',
    '[class.gestio-drawer-content--start]': 'position() === "start"',
    '[class.gestio-drawer-content--bottom]': 'position() === "bottom"',
    '[class.gestio-drawer-content--from-left]': 'enterFrom() === "left"',
    '[class.gestio-drawer-content--from-right]': 'enterFrom() === "right"',
    '[class.gestio-drawer-content--from-bottom]': 'enterFrom() === "bottom"',
  },
})
export class GestioDrawerContent {
  private readonly host = inject(GESTIO_DRAWER_HOST, { optional: true });
  private readonly dir = inject(Directionality, { optional: true });

  /** Titre du panneau, utilisé comme nom accessible. */
  readonly heading = input.required<string>();
  /** Description courte, reliée par `aria-describedby`. */
  readonly description = input<string>();
  /** Affiche le bouton de fermeture dans l'en-tête. */
  readonly showClose = input(true, { transform: booleanAttribute });
  /** Libellés (bouton de fermeture). */
  readonly labels = input<Partial<GestioDrawerLabels>>({});

  private readonly fallbackId = gestioUniqueId('gestio-drawer-layout');
  protected readonly titleId = this.host?.titleId ?? `${this.fallbackId}-title`;
  protected readonly descriptionId = this.host?.descriptionId ?? `${this.fallbackId}-description`;

  protected readonly text = computed(() => ({ ...GESTIO_DRAWER_LABELS, ...this.labels() }));
  protected readonly position = computed(() => this.host?.position() ?? 'end');
  /** Côté physique d'où glisse le panneau à l'ouverture. */
  protected readonly enterFrom = computed(() => {
    const position = this.position();
    if (position === 'bottom') return 'bottom';
    const rtl = this.dir?.value === 'rtl';
    return (position === 'end') !== rtl ? 'right' : 'left';
  });

  protected close(): void {
    this.host?.close();
  }
}
