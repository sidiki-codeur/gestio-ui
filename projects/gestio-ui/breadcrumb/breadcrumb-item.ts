import {
  Component,
  InjectionToken,
  Signal,
  TemplateRef,
  computed,
  contentChild,
  inject,
  viewChild,
} from '@angular/core';

/** Contrat interne entre `gestio-breadcrumb` et ses éléments. */
export interface ɵGestioBreadcrumbHost {
  readonly items: Signal<readonly GestioBreadcrumbEntry[]>;
}

/** Usage interne : fourni par `gestio-breadcrumb`. */
export const ɵGESTIO_BREADCRUMB = new InjectionToken<ɵGestioBreadcrumbHost>('GESTIO_BREADCRUMB');

/**
 * Lien d'un fil d'Ariane, sur un élément `<a>` natif : compatible avec
 * `routerLink` comme avec `href`.
 *
 * ```html
 * <gestio-breadcrumb-entry><a gestioBreadcrumbLink routerLink="/clients">Clients</a></gestio-breadcrumb-entry>
 * ```
 *
 * Dans le dernier élément, le lien reçoit `aria-current="page"`.
 */
@Component({
  selector: 'a[gestioBreadcrumbLink]',
  exportAs: 'gestioBreadcrumbLink',
  template: `<ng-content />`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--gestio-space-1);
      border-radius: var(--gestio-radius-sm);
      color: var(--gestio-color-text-muted);
      text-decoration: none;
      text-underline-offset: 0.2em;
      transition: color var(--gestio-duration-fast) var(--gestio-easing-standard);
    }

    :host(:hover) {
      color: var(--gestio-color-text);
      text-decoration: underline;
    }

    :host(:focus-visible) {
      outline: 2px solid var(--gestio-color-focus-ring);
      outline-offset: 2px;
    }

    :host([aria-current='page']) {
      color: var(--gestio-color-text);
      font-weight: var(--gestio-font-weight-medium);
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        transition: none;
      }
    }
  `,
  host: {
    class: 'gestio-breadcrumb-link',
    '[attr.aria-current]': 'item?.current() ? "page" : null',
  },
})
export class GestioBreadcrumbLink {
  protected readonly item = inject(GestioBreadcrumbEntry, { optional: true });
}

/**
 * Élément d'un `gestio-breadcrumb`. Son contenu est soit un lien
 * `a[gestioBreadcrumbLink]`, soit un simple texte (page courante).
 *
 * ```html
 * <gestio-breadcrumb-entry>Facture F-2026-0142</gestio-breadcrumb-entry>
 * ```
 *
 * Le contenu est rendu par le fil d'Ariane, dans un `<li>` de sa liste.
 */
@Component({
  selector: 'gestio-breadcrumb-entry',
  exportAs: 'gestioBreadcrumbEntry',
  template: `<ng-template #content><ng-content /></ng-template>`,
})
export class GestioBreadcrumbEntry {
  private readonly breadcrumb = inject(ɵGESTIO_BREADCRUMB, { optional: true });

  /** @docs-private Contenu rendu par `gestio-breadcrumb`. */
  readonly content = viewChild.required<TemplateRef<unknown>>('content');
  /** @docs-private Lien éventuel de l'élément. */
  readonly link = contentChild(GestioBreadcrumbLink);
  /** Vrai pour le dernier élément : la page courante. */
  readonly current = computed(() => this.breadcrumb?.items().at(-1) === this);
}
