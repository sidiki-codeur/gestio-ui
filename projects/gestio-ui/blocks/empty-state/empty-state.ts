import { Component, booleanAttribute, computed, input, numberAttribute } from '@angular/core';
import { GestioSize } from '@gestiolabs336/ui/core';

/** Icône par défaut : liste vide, recherche sans résultat, erreur ou succès. */
export type GestioEmptyStateVariant = 'empty' | 'search' | 'error' | 'success';
export type GestioEmptyStateSize = GestioSize;
/** Niveau du titre (`h2` à `h6`), à choisir selon la hiérarchie de la page. */
export type GestioEmptyStateHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * État vide : liste sans élément, recherche sans résultat, chargement en
 * échec ou action terminée. Affiche une icône, un titre, une description et
 * des actions.
 *
 * ```html
 * <gestio-empty-state
 *   variant="search"
 *   heading="Aucun client trouvé"
 *   description="Vérifiez l'orthographe ou retirez des filtres."
 * >
 *   <div gestioEmptyStateActions>
 *     <button gestioButton variant="outline">Effacer les filtres</button>
 *   </div>
 * </gestio-empty-state>
 * ```
 *
 * Zones de projection : `[gestioEmptyStateIcon]` (remplace l'icône par
 * défaut), contenu par défaut (sous la description) et
 * `[gestioEmptyStateActions]` (composant `GestioEmptyStateActions`, ou
 * `GESTIO_EMPTY_STATE_IMPORTS`).
 */
@Component({
  selector: 'gestio-empty-state',
  template: `
    <div class="gestio-empty-state__media">
      <ng-content select="[gestioEmptyStateIcon]">
        <svg
          class="gestio-empty-state__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          @switch (variant()) {
            @case ('search') {
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            }
            @case ('error') {
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5v5.5" />
              <path d="M12 16.5h.01" />
            }
            @case ('success') {
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12.5 2.75 2.75L16.5 9.5" />
            }
            @default {
              <path d="M3 13h5l1.5 2.5h5L16 13h5" />
              <path
                d="M5.5 5.5h13L21 13v5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-5l2.5-7.5Z"
              />
            }
          }
        </svg>
      </ng-content>
    </div>

    @switch (level()) {
      @case (3) {
        <h3 class="gestio-empty-state__heading">{{ heading() }}</h3>
      }
      @case (4) {
        <h4 class="gestio-empty-state__heading">{{ heading() }}</h4>
      }
      @case (5) {
        <h5 class="gestio-empty-state__heading">{{ heading() }}</h5>
      }
      @case (6) {
        <h6 class="gestio-empty-state__heading">{{ heading() }}</h6>
      }
      @default {
        <h2 class="gestio-empty-state__heading">{{ heading() }}</h2>
      }
    }

    @if (description()) {
      <p class="gestio-empty-state__description">{{ description() }}</p>
    }
    <div class="gestio-empty-state__body"><ng-content /></div>
    <div class="gestio-empty-state__actions"><ng-content select="[gestioEmptyStateActions]" /></div>
  `,
  styleUrl: './empty-state.scss',
  host: {
    class: 'gestio-empty-state',
    '[class]': 'modifierClasses()',
  },
})
export class GestioEmptyState {
  /** Titre (obligatoire). */
  readonly heading = input.required<string>();
  /** Niveau du titre, de 2 à 6. */
  readonly headingLevel = input<GestioEmptyStateHeadingLevel, unknown>(2, {
    transform: (value: unknown) => numberAttribute(value, 2) as GestioEmptyStateHeadingLevel,
  });
  /** Texte explicatif sous le titre ; du contenu riche peut aussi être projeté. */
  readonly description = input<string>();
  /** Icône par défaut et couleur associée. */
  readonly variant = input<GestioEmptyStateVariant>('empty');
  /** Taille de l'icône, du titre et des espacements. */
  readonly size = input<GestioEmptyStateSize>('md');
  /** Encadre le bloc d'une bordure en pointillés (zone à remplir). */
  readonly bordered = input(false, { transform: booleanAttribute });

  /** Niveau borné à 2–6, quelle que soit la valeur reçue. */
  protected readonly level = computed(() => {
    const level = Math.trunc(this.headingLevel());
    return Number.isFinite(level) ? Math.min(6, Math.max(2, level)) : 2;
  });

  protected readonly modifierClasses = computed(() => {
    const classes = [`gestio-empty-state--${this.variant()}`, `gestio-empty-state--${this.size()}`];
    if (this.bordered()) classes.push('gestio-empty-state--bordered');
    return classes.join(' ');
  });
}

/** Zone d'actions centrée d'un état vide : `<div gestioEmptyStateActions>…</div>`. */
@Component({
  selector: '[gestioEmptyStateActions]',
  template: '<ng-content />',
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gestio-space-2);
      align-items: center;
      justify-content: center;
    }
  `,
  host: { class: 'gestio-empty-state-actions' },
})
export class GestioEmptyStateActions {}

/** État vide et sa zone d'actions. */
export const GESTIO_EMPTY_STATE_IMPORTS = [GestioEmptyState, GestioEmptyStateActions] as const;
