import { Component, booleanAttribute, computed, input } from '@angular/core';

export type GestioBadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type GestioBadgeAppearance = 'soft' | 'solid' | 'outline';
export type GestioBadgeSize = 'sm' | 'md';

/**
 * Badge d'état ou de catégorie, non interactif.
 *
 * ```html
 * <gestio-badge variant="success" dot>Payée</gestio-badge>
 * ```
 *
 * La couleur seule ne doit pas porter l'information : le libellé reste explicite.
 */
@Component({
  selector: 'gestio-badge',
  template: `
    @if (dot()) {
      <span class="gestio-badge__dot" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  styleUrl: './badge.scss',
  host: {
    class: 'gestio-badge',
    '[class]': 'modifierClasses()',
  },
})
export class GestioBadge {
  /** Couleur sémantique. */
  readonly variant = input<GestioBadgeVariant>('neutral');
  /** Style visuel. */
  readonly appearance = input<GestioBadgeAppearance>('soft');
  readonly size = input<GestioBadgeSize>('md');
  /** Affiche une pastille avant le libellé. */
  readonly dot = input(false, { transform: booleanAttribute });

  protected readonly modifierClasses = computed(
    () =>
      `gestio-badge--${this.variant()} gestio-badge--${this.appearance()} gestio-badge--${this.size()}`,
  );
}
