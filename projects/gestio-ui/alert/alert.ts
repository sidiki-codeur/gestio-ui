import { Component, booleanAttribute, computed, input, output } from '@angular/core';

export type GestioAlertVariant = 'info' | 'success' | 'warning' | 'danger';
/** `polite` : role="status" ; `assertive` : role="alert" ; `off` : contenu statique. */
export type GestioAlertLive = 'off' | 'polite' | 'assertive';

const VARIANT_LABELS: Record<GestioAlertVariant, string> = {
  info: 'Information',
  success: 'Succès',
  warning: 'Avertissement',
  danger: 'Erreur',
};

/**
 * Message contextuel affiché dans la page (bannière) : information, succès,
 * avertissement ou erreur. Contrairement au toast, il reste en place.
 *
 * ```html
 * <gestio-alert variant="warning" title="Période d'essai">
 *   Il vous reste 3 jours. <a href="/abonnement">Choisir une offre</a>
 *   <div gestioAlertActions><button gestioButton size="sm">Mettre à niveau</button></div>
 * </gestio-alert>
 * ```
 *
 * `dismissible` affiche un bouton de fermeture qui émet `dismissed` :
 * c'est à l'application de retirer l'alerte (`@if`).
 */
@Component({
  selector: 'gestio-alert',
  template: `
    <div class="gestio-alert" [attr.role]="role()">
      <span class="gestio-alert__icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" focusable="false">
          @switch (variant()) {
            @case ('success') {
              <circle cx="10" cy="10" r="7.5" />
              <path d="M6.75 10.25l2.25 2.25 4.25-4.75" />
            }
            @case ('warning') {
              <path d="M10 3.25l7.25 13H2.75z" />
              <path d="M10 8.25v3.5M10 14v.25" />
            }
            @case ('danger') {
              <circle cx="10" cy="10" r="7.5" />
              <path d="M10 6.25v4.5M10 13.5v.25" />
            }
            @default {
              <circle cx="10" cy="10" r="7.5" />
              <path d="M10 9.25v4.5M10 6.5v.25" />
            }
          }
        </svg>
      </span>
      <div class="gestio-alert__body">
        <span class="gestio-alert__sr-only">{{ variantText() }} :</span>
        @if (title()) {
          <p class="gestio-alert__title">{{ title() }}</p>
        }
        <div class="gestio-alert__content"><ng-content /></div>
        <div class="gestio-alert__actions"><ng-content select="[gestioAlertActions]" /></div>
      </div>
      @if (dismissible()) {
        <button
          type="button"
          class="gestio-alert__close"
          [attr.aria-label]="dismissLabel()"
          (click)="dismissed.emit()"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      }
    </div>
  `,
  styleUrl: './alert.scss',
  host: {
    '[class]': "'gestio-alert-host gestio-alert--' + variant()",
  },
})
export class GestioAlert {
  /** Couleur et icône. */
  readonly variant = input<GestioAlertVariant>('info');
  /** Titre en gras au-dessus du message. */
  readonly title = input<string>();
  /**
   * Annonce aux lecteurs d'écran. `off` (défaut) pour une alerte présente au
   * chargement ; `polite` ou `assertive` pour une alerte insérée après une action.
   */
  readonly live = input<GestioAlertLive>('off');
  /** Affiche le bouton de fermeture. */
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissLabel = input('Fermer le message');
  /** Préfixe lu par les lecteurs d'écran (par défaut selon la variante : « Erreur », « Succès »…). */
  readonly variantLabel = input<string>();

  /** Clic sur le bouton de fermeture. */
  readonly dismissed = output<void>();

  protected readonly variantText = computed(
    () => this.variantLabel() ?? VARIANT_LABELS[this.variant()],
  );
  protected readonly role = computed(() => {
    const live = this.live();
    return live === 'assertive' ? 'alert' : live === 'polite' ? 'status' : null;
  });
}
