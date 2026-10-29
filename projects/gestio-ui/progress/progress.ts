import { Component, booleanAttribute, computed, input, numberAttribute } from '@angular/core';
import { GestioSize, ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

export type GestioProgressVariant = 'primary' | 'success' | 'warning' | 'danger';
export type GestioProgressSize = GestioSize;

/** Libellés des indicateurs de progression (internationalisation). */
export interface GestioProgressLabels {
  /** Texte annoncé en mode indéterminé (`aria-valuetext`). */
  indeterminate: string;
}

export const GESTIO_PROGRESS_LABELS: GestioProgressLabels = {
  indeterminate: 'En cours',
};

/** Signaux lus par le calcul d'état commun aux deux indicateurs. */
interface ProgressSource {
  readonly value: () => number;
  readonly max: () => number;
  readonly indeterminate: () => boolean;
  readonly valueText: () => string | undefined;
  readonly locale: () => string;
  readonly labels: () => Partial<GestioProgressLabels>;
}

/** État dérivé commun à `gestio-progress-bar` et `gestio-progress-circle`. */
function progressState(source: ProgressSource) {
  const text = computed<GestioProgressLabels>(() => ({
    ...GESTIO_PROGRESS_LABELS,
    ...source.labels(),
  }));
  const max = computed(() => (source.max() > 0 ? source.max() : 100));
  const value = computed(() => Math.min(Math.max(source.value(), 0), max()));
  /** Avancement en pourcentage (0 à 100). */
  const percent = computed(() => (value() / max()) * 100);
  const percentFormat = computed(
    () => new Intl.NumberFormat(source.locale(), { style: 'percent', maximumFractionDigits: 0 }),
  );
  /** Valeur affichée et annoncée. */
  const display = computed(() => source.valueText() ?? percentFormat().format(percent() / 100));
  const ariaValueText = computed(() => (source.indeterminate() ? text().indeterminate : display()));
  return { max, value, percent, display, ariaValueText } as const;
}

/**
 * Barre de progression (`role="progressbar"`).
 *
 * ```html
 * <gestio-progress-bar label="Import des factures" [value]="imported()" [max]="total()" showValue />
 * <gestio-progress-bar ariaLabel="Synchronisation" indeterminate />
 * ```
 *
 * Un nom accessible est requis : `label` (visible) ou `ariaLabel`.
 * Le mode indéterminé n'expose pas `aria-valuenow`.
 */
@Component({
  selector: 'gestio-progress-bar',
  template: `
    @if (label() || showValue()) {
      <div class="gestio-progress-bar__header">
        @if (label()) {
          <span class="gestio-progress-bar__label" [id]="labelId">{{ label() }}</span>
        }
        @if (showValue() && !indeterminate()) {
          <span class="gestio-progress-bar__value" aria-hidden="true">{{ state.display() }}</span>
        }
      </div>
    }
    <div
      class="gestio-progress-bar__track"
      role="progressbar"
      [attr.aria-labelledby]="label() ? labelId : null"
      [attr.aria-label]="label() ? null : (ariaLabel() ?? null)"
      aria-valuemin="0"
      [attr.aria-valuemax]="state.max()"
      [attr.aria-valuenow]="indeterminate() ? null : state.value()"
      [attr.aria-valuetext]="state.ariaValueText()"
    >
      <div
        class="gestio-progress-bar__fill"
        [style.inline-size.%]="indeterminate() ? null : state.percent()"
      ></div>
    </div>
  `,
  styleUrl: './progress-bar.scss',
  host: {
    '[class]':
      '"gestio-progress-bar gestio-progress-bar--" + variant() + " gestio-progress-bar--" + size()',
    '[class.gestio-progress-bar--indeterminate]': 'indeterminate()',
  },
})
export class GestioProgressBar {
  /** Avancement, entre 0 et `max`. Ignoré en mode indéterminé. */
  readonly value = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  /** Valeur correspondant à 100 %. */
  readonly max = input(100, { transform: (v: unknown) => numberAttribute(v, 100) });
  /** Durée inconnue : animation continue, sans `aria-valuenow`. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /** Libellé visible, qui sert aussi de nom accessible. */
  readonly label = input<string>();
  /** Nom accessible si aucun libellé visible n'est fourni. */
  readonly ariaLabel = input<string>();
  readonly variant = input<GestioProgressVariant>('primary');
  readonly size = input<GestioProgressSize>('md');
  /** Affiche le pourcentage (ou `valueText`). */
  readonly showValue = input(false, { transform: booleanAttribute });
  /** Texte de la valeur à la place du pourcentage, ex. « 12 factures sur 40 ». */
  readonly valueText = input<string>();
  /** Locale de formatage du pourcentage. */
  readonly locale = input('fr-FR');
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioProgressLabels>>({});

  protected readonly labelId = gestioUniqueId('gestio-progress-label');
  protected readonly state = progressState(this);
}

/** Rayon du cercle dans une boîte 44×44 (trait de 4). */
const CIRCLE_RADIUS = 20;

/**
 * Indicateur de progression circulaire (`role="progressbar"`).
 *
 * ```html
 * <gestio-progress-circle ariaLabel="Objectif mensuel" [value]="72" showValue />
 * <gestio-progress-circle label="Sauvegarde" indeterminate size="sm" />
 * ```
 *
 * Un nom accessible est requis : `label` (visible sous le cercle) ou `ariaLabel`.
 */
@Component({
  selector: 'gestio-progress-circle',
  template: `
    <div
      class="gestio-progress-circle__indicator"
      role="progressbar"
      [attr.aria-labelledby]="label() ? labelId : null"
      [attr.aria-label]="label() ? null : (ariaLabel() ?? null)"
      aria-valuemin="0"
      [attr.aria-valuemax]="state.max()"
      [attr.aria-valuenow]="indeterminate() ? null : state.value()"
      [attr.aria-valuetext]="state.ariaValueText()"
    >
      <svg
        class="gestio-progress-circle__svg"
        viewBox="0 0 44 44"
        aria-hidden="true"
        focusable="false"
      >
        <circle class="gestio-progress-circle__track" cx="22" cy="22" [attr.r]="radius" />
        <circle
          class="gestio-progress-circle__fill"
          cx="22"
          cy="22"
          [attr.r]="radius"
          pathLength="100"
          [attr.stroke-dasharray]="dashArray()"
        />
      </svg>
      @if (showValue() && !indeterminate()) {
        <span class="gestio-progress-circle__value" aria-hidden="true">{{ state.display() }}</span>
      }
    </div>
    @if (label()) {
      <span class="gestio-progress-circle__label" [id]="labelId">{{ label() }}</span>
    }
  `,
  styleUrl: './progress-circle.scss',
  host: {
    '[class]':
      '"gestio-progress-circle gestio-progress-circle--" + variant() + " gestio-progress-circle--" + size()',
    '[class.gestio-progress-circle--indeterminate]': 'indeterminate()',
  },
})
export class GestioProgressCircle {
  /** Avancement, entre 0 et `max`. Ignoré en mode indéterminé. */
  readonly value = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  /** Valeur correspondant à 100 %. */
  readonly max = input(100, { transform: (v: unknown) => numberAttribute(v, 100) });
  /** Durée inconnue : animation continue, sans `aria-valuenow`. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /** Libellé visible, qui sert aussi de nom accessible. */
  readonly label = input<string>();
  /** Nom accessible si aucun libellé visible n'est fourni. */
  readonly ariaLabel = input<string>();
  readonly variant = input<GestioProgressVariant>('primary');
  readonly size = input<GestioProgressSize>('md');
  /** Affiche le pourcentage (ou `valueText`). */
  readonly showValue = input(false, { transform: booleanAttribute });
  /** Texte de la valeur à la place du pourcentage, ex. « 12 factures sur 40 ». */
  readonly valueText = input<string>();
  /** Locale de formatage du pourcentage. */
  readonly locale = input('fr-FR');
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioProgressLabels>>({});

  protected readonly labelId = gestioUniqueId('gestio-progress-label');
  protected readonly state = progressState(this);

  protected readonly radius = CIRCLE_RADIUS;

  /** Longueur du trait (sur 100) : arc fixe d'un quart en mode indéterminé. */
  protected readonly dashArray = computed(() =>
    this.indeterminate() ? '25 100' : `${this.state.percent()} 100`,
  );
}
