import { Component, booleanAttribute, computed, input, output } from '@angular/core';

/** Élément du fil d'Ariane. Sans `href`, l'élément est affiché comme texte. */
export interface GestioBreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

/** Clic sur un lien du fil d'Ariane, pour une navigation par le routeur. */
export interface GestioBreadcrumbClick {
  readonly item: GestioBreadcrumbItem;
  readonly index: number;
  readonly event: MouseEvent;
}

/** Libellés de l'en-tête de page (internationalisation). */
export interface GestioPageHeaderLabels {
  /** Nom de la navigation du fil d'Ariane. */
  breadcrumb: string;
  /** Texte du lien ou bouton de retour. */
  back: string;
}

export const GESTIO_PAGE_HEADER_LABELS: GestioPageHeaderLabels = {
  breadcrumb: "Fil d'Ariane",
  back: 'Retour',
};

/**
 * En-tête d'une page d'application : fil d'Ariane, lien de retour, titre
 * `<h1>`, sous-titre, statut, actions et zone basse (onglets, filtres…).
 *
 * ```html
 * <gestio-page-header
 *   heading="Atelier Moreau SARL"
 *   subheading="Client depuis mars 2021"
 *   [breadcrumbs]="[{ label: 'Clients', href: '/clients' }, { label: 'Atelier Moreau SARL' }]"
 * >
 *   <gestio-badge gestioPageHeaderStatus variant="success">Actif</gestio-badge>
 *   <div gestioPageHeaderActions>
 *     <button gestioButton variant="outline">Modifier</button>
 *     <button gestioButton>Nouvelle facture</button>
 *   </div>
 * </gestio-page-header>
 * ```
 *
 * Zones de projection : `[gestioPageHeaderStatus]` (à côté du titre),
 * `[gestioPageHeaderActions]` (composant `GestioPageHeaderActions`, à droite,
 * sous le titre sur petit écran), contenu par défaut (sous le sous-titre) et
 * `[gestioPageHeaderFooter]` (onglets, filtres).
 */
@Component({
  selector: 'gestio-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  host: {
    class: 'gestio-page-header',
    '[class.gestio-page-header--divider]': 'divider()',
  },
})
export class GestioPageHeader {
  /** Titre de la page, rendu dans un `<h1>` (obligatoire). */
  readonly heading = input.required<string>();
  /** Texte secondaire sous le titre. */
  readonly subheading = input<string>();
  /** Fil d'Ariane ; le dernier élément représente la page courante. */
  readonly breadcrumbs = input<readonly GestioBreadcrumbItem[]>([]);
  /** Adresse du lien de retour. */
  readonly backHref = input<string>();
  /** Affiche un bouton de retour sans adresse : écouter `(back)`. */
  readonly showBack = input(false, { transform: booleanAttribute });
  /** Texte du lien ou bouton de retour (par défaut : `labels.back`). */
  readonly backLabel = input<string>();
  /** Trait de séparation sous l'en-tête. */
  readonly divider = input(false, { transform: booleanAttribute });
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioPageHeaderLabels>>({});

  /** Émis au clic sur le bouton de retour (quand `backHref` est absent). */
  readonly back = output<void>();
  /**
   * Émis au clic sur un lien du fil d'Ariane. Appeler `event.preventDefault()`
   * puis naviguer avec le routeur pour éviter un rechargement complet.
   */
  readonly breadcrumbClick = output<GestioBreadcrumbClick>();

  protected readonly text = computed<GestioPageHeaderLabels>(() => ({
    ...GESTIO_PAGE_HEADER_LABELS,
    ...this.labels(),
  }));

  protected readonly backText = computed(() => this.backLabel() || this.text().back);

  protected readonly hasBack = computed(() => !!this.backHref() || this.showBack());
}

/** Zone d'actions de l'en-tête de page : `<div gestioPageHeaderActions>…</div>`. */
@Component({
  selector: '[gestioPageHeaderActions]',
  template: '<ng-content />',
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gestio-space-2);
      align-items: center;
    }
  `,
  host: { class: 'gestio-page-header-actions' },
})
export class GestioPageHeaderActions {}

/** En-tête de page et sa zone d'actions. */
export const GESTIO_PAGE_HEADER_IMPORTS = [GestioPageHeader, GestioPageHeaderActions] as const;
