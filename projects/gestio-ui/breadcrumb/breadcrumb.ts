import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  viewChildren,
} from '@angular/core';
import {
  GestioBreadcrumbEntry,
  ɵGESTIO_BREADCRUMB,
  ɵGestioBreadcrumbHost,
} from './breadcrumb-item';

/** Séparateur décoratif affiché entre les éléments. */
export type GestioBreadcrumbSeparator = 'chevron' | 'slash';

/** Libellés du fil d'Ariane (internationalisation). */
export interface GestioBreadcrumbLabels {
  /** Nom de la zone de navigation. */
  navigation: string;
  /** Nom du bouton « … » ; `{count}` est remplacé par le nombre de niveaux masqués. */
  showHidden: string;
}

export const GESTIO_BREADCRUMB_LABELS: GestioBreadcrumbLabels = {
  navigation: 'Fil d’Ariane',
  showHidden: 'Afficher les {count} niveaux masqués',
};

type Entry = { kind: 'item'; item: GestioBreadcrumbEntry } | { kind: 'ellipsis'; count: number };

/**
 * Fil d'Ariane accessible (motif ARIA « Breadcrumb ») : `<nav>` nommé,
 * liste ordonnée, séparateurs décoratifs et `aria-current="page"` sur le
 * dernier élément.
 *
 * ```html
 * <gestio-breadcrumb [maxItems]="4">
 *   <gestio-breadcrumb-entry><a gestioBreadcrumbLink routerLink="/">Accueil</a></gestio-breadcrumb-entry>
 *   <gestio-breadcrumb-entry><a gestioBreadcrumbLink routerLink="/ventes">Ventes</a></gestio-breadcrumb-entry>
 *   <gestio-breadcrumb-entry><a gestioBreadcrumbLink routerLink="/ventes/factures">Factures</a></gestio-breadcrumb-entry>
 *   <gestio-breadcrumb-entry>F-2026-0142</gestio-breadcrumb-entry>
 * </gestio-breadcrumb>
 * ```
 *
 * Au-delà de `maxItems` éléments, ceux du milieu sont remplacés par un bouton
 * « … » qui les affiche ; le focus passe alors au premier élément révélé.
 */
@Component({
  selector: 'gestio-breadcrumb',
  imports: [NgTemplateOutlet],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
  providers: [{ provide: ɵGESTIO_BREADCRUMB, useExisting: forwardRef(() => GestioBreadcrumb) }],
  host: { class: 'gestio-breadcrumb' },
})
export class GestioBreadcrumb implements ɵGestioBreadcrumbHost {
  private readonly injector = inject(Injector);

  /**
   * Nombre maximal d'éléments affichés avant repli des éléments du milieu ;
   * `0` désactive le repli.
   */
  readonly maxItems = input(8, { transform: numberAttribute });
  /** Éléments toujours visibles au début en cas de repli. */
  readonly itemsBeforeCollapse = input(1, { transform: numberAttribute });
  /** Éléments toujours visibles à la fin en cas de repli. */
  readonly itemsAfterCollapse = input(1, { transform: numberAttribute });
  /** Séparateur décoratif. */
  readonly separator = input<GestioBreadcrumbSeparator>('chevron');
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioBreadcrumbLabels>>({});
  /** Nom de la navigation ; à rendre unique s'il y a plusieurs fils d'Ariane. */
  readonly ariaLabel = input<string>();

  readonly items = contentChildren(GestioBreadcrumbEntry);
  private readonly listItems = viewChildren<ElementRef<HTMLLIElement>>('listItem');
  /** Vrai après activation du bouton « … » ; replié de nouveau si les éléments changent. */
  protected readonly expanded = linkedSignal({ source: this.items, computation: () => false });

  protected readonly text = computed<GestioBreadcrumbLabels>(() => ({
    ...GESTIO_BREADCRUMB_LABELS,
    ...this.labels(),
  }));

  protected readonly entries = computed<Entry[]>(() => {
    const items = this.items();
    const all: Entry[] = items.map((item) => ({ kind: 'item', item }));
    const max = this.maxItems();
    if (this.expanded() || !max || items.length <= max) return all;
    const before = Math.max(0, Math.floor(this.itemsBeforeCollapse()));
    const after = Math.max(1, Math.floor(this.itemsAfterCollapse()));
    const hidden = items.length - before - after;
    // Une ellipse ne remplace jamais un seul élément.
    if (hidden < 2) return all;
    return [...all.slice(0, before), { kind: 'ellipsis', count: hidden }, ...all.slice(-after)];
  });

  protected showHiddenLabel(count: number): string {
    return this.text().showHidden.replace('{count}', String(count));
  }

  protected expand(): void {
    const firstRevealed = Math.max(0, Math.floor(this.itemsBeforeCollapse()));
    this.expanded.set(true);
    // Le bouton disparaît : le focus passe au premier élément révélé.
    afterNextRender(
      () => {
        const li = this.listItems()[firstRevealed]?.nativeElement;
        if (!li) return;
        const focusable = li.querySelector<HTMLElement>('a[href], button, [tabindex]');
        if (focusable) {
          focusable.focus();
        } else {
          li.tabIndex = -1;
          li.focus();
        }
      },
      { injector: this.injector },
    );
  }
}
