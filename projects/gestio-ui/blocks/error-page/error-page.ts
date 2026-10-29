import { Component, computed, input, numberAttribute } from '@angular/core';

/** Type d'erreur : code HTTP, maintenance planifiée ou absence de connexion. */
export type GestioErrorPageCode = 404 | 403 | 500 | 'maintenance' | 'offline';

/** `fullscreen` : centré sur toute la hauteur de l'écran ; `inline` : intégré dans une zone de contenu. */
export type GestioErrorPageVariant = 'fullscreen' | 'inline';

/** Niveau du titre (`h1` à `h6`). */
export type GestioErrorPageHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Libellés de la page d'erreur (internationalisation). */
export interface GestioErrorPageLabels {
  /** Surtitre d'une erreur HTTP ; `{code}` est remplacé. */
  codeEyebrow: string;
  notFoundHeading: string;
  notFoundMessage: string;
  forbiddenHeading: string;
  forbiddenMessage: string;
  serverErrorHeading: string;
  serverErrorMessage: string;
  maintenanceEyebrow: string;
  maintenanceHeading: string;
  maintenanceMessage: string;
  offlineEyebrow: string;
  offlineHeading: string;
  offlineMessage: string;
}

export const GESTIO_ERROR_PAGE_LABELS: GestioErrorPageLabels = {
  codeEyebrow: 'Erreur {code}',
  notFoundHeading: 'Page introuvable',
  notFoundMessage:
    'La page demandée n’existe pas ou a été déplacée. Vérifiez l’adresse ou revenez à l’accueil.',
  forbiddenHeading: 'Accès refusé',
  forbiddenMessage:
    'Vous n’avez pas les droits nécessaires pour afficher cette page. Contactez votre administrateur si vous pensez qu’il s’agit d’une erreur.',
  serverErrorHeading: 'Une erreur est survenue',
  serverErrorMessage:
    'Le serveur n’a pas pu traiter votre demande. Réessayez dans quelques instants ; si le problème persiste, contactez le support.',
  maintenanceEyebrow: 'Maintenance',
  maintenanceHeading: 'Maintenance en cours',
  maintenanceMessage:
    'L’application est temporairement indisponible pour une opération de maintenance. Merci de revenir un peu plus tard.',
  offlineEyebrow: 'Hors ligne',
  offlineHeading: 'Vous êtes hors ligne',
  offlineMessage: 'Vérifiez votre connexion à Internet, puis réessayez.',
};

type ErrorKind = 'not-found' | 'forbidden' | 'server-error' | 'maintenance' | 'offline';

const KINDS: Record<string, ErrorKind> = {
  '404': 'not-found',
  '403': 'forbidden',
  '500': 'server-error',
  maintenance: 'maintenance',
  offline: 'offline',
};

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/** Accepte `code="404"` (attribut statique) comme `[code]="404"`. */
function toCode(value: unknown): GestioErrorPageCode {
  if (value === 'maintenance' || value === 'offline') return value;
  const code = numberAttribute(value, 404);
  return code === 403 || code === 500 ? code : 404;
}

/**
 * Page d'erreur : 404, 403, 500, maintenance ou hors ligne. Affiche une
 * illustration décorative, un surtitre, un titre, un message et des actions.
 *
 * ```html
 * <gestio-error-page code="404">
 *   <div gestioErrorPageActions>
 *     <a gestioButton routerLink="/">Retour à l'accueil</a>
 *   </div>
 * </gestio-error-page>
 * ```
 *
 * Les textes par défaut dépendent de `code` ; `heading` et `message` les
 * remplacent pour une page, `labels` pour toute l'application.
 *
 * Zones de projection : contenu par défaut (sous le message, ex. référence
 * d'incident) et `[gestioErrorPageActions]` (composant
 * `GestioErrorPageActions`, ou `GESTIO_ERROR_PAGE_IMPORTS`).
 */
@Component({
  selector: 'gestio-error-page',
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
  host: {
    class: 'gestio-error-page',
    '[class]': 'modifierClasses()',
  },
})
export class GestioErrorPage {
  /** Type d'erreur. */
  readonly code = input<GestioErrorPageCode, unknown>(404, { transform: toCode });
  /** Titre ; remplace le titre par défaut du code. */
  readonly heading = input<string>();
  /** Message ; remplace le message par défaut du code. */
  readonly message = input<string>();
  /** Niveau du titre, de 1 à 6 (1 pour une page dédiée, plus pour une zone intégrée). */
  readonly headingLevel = input<GestioErrorPageHeadingLevel, unknown>(1, {
    transform: (value: unknown) => numberAttribute(value, 1) as GestioErrorPageHeadingLevel,
  });
  /** Plein écran centré ou intégré dans une zone de contenu. */
  readonly variant = input<GestioErrorPageVariant>('fullscreen');
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioErrorPageLabels>>({});

  protected readonly text = computed<GestioErrorPageLabels>(() => ({
    ...GESTIO_ERROR_PAGE_LABELS,
    ...this.labels(),
  }));

  protected readonly kind = computed<ErrorKind>(() => KINDS[String(this.code())] ?? 'not-found');

  /** Niveau borné à 1–6, quelle que soit la valeur reçue. */
  protected readonly level = computed(() => {
    const level = Math.trunc(this.headingLevel());
    return Number.isFinite(level) ? Math.min(6, Math.max(1, level)) : 1;
  });

  protected readonly eyebrow = computed(() => {
    const text = this.text();
    switch (this.kind()) {
      case 'maintenance':
        return text.maintenanceEyebrow;
      case 'offline':
        return text.offlineEyebrow;
      default:
        return interpolate(text.codeEyebrow, { code: this.code() });
    }
  });

  protected readonly resolvedHeading = computed(() => {
    const custom = this.heading();
    if (custom) return custom;
    const text = this.text();
    switch (this.kind()) {
      case 'forbidden':
        return text.forbiddenHeading;
      case 'server-error':
        return text.serverErrorHeading;
      case 'maintenance':
        return text.maintenanceHeading;
      case 'offline':
        return text.offlineHeading;
      default:
        return text.notFoundHeading;
    }
  });

  protected readonly resolvedMessage = computed(() => {
    const custom = this.message();
    if (custom !== undefined) return custom;
    const text = this.text();
    switch (this.kind()) {
      case 'forbidden':
        return text.forbiddenMessage;
      case 'server-error':
        return text.serverErrorMessage;
      case 'maintenance':
        return text.maintenanceMessage;
      case 'offline':
        return text.offlineMessage;
      default:
        return text.notFoundMessage;
    }
  });

  protected readonly modifierClasses = computed(
    () => `gestio-error-page--${this.kind()} gestio-error-page--${this.variant()}`,
  );
}

/** Zone d'actions centrée d'une page d'erreur : `<div gestioErrorPageActions>…</div>`. */
@Component({
  selector: '[gestioErrorPageActions]',
  template: '<ng-content />',
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gestio-space-3);
      align-items: center;
      justify-content: center;
    }
  `,
  host: { class: 'gestio-error-page-actions' },
})
export class GestioErrorPageActions {}

/** Page d'erreur et sa zone d'actions. */
export const GESTIO_ERROR_PAGE_IMPORTS = [GestioErrorPage, GestioErrorPageActions] as const;
