import { Component, booleanAttribute, computed, input } from '@angular/core';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioSkeleton } from '@gestiolabs336/ui/skeleton';

/** Lecture de la variation : `positive` (bonne nouvelle), `negative` ou `neutral`. */
export type GestioStatCardTone = 'positive' | 'negative' | 'neutral';

/** Libellés de la carte statistique (internationalisation). */
export interface GestioStatCardLabels {
  /** Variation à la hausse ; `{value}` est remplacé (ex. « +12,5 % »). */
  increase: string;
  /** Variation à la baisse ; `{value}` est remplacé. */
  decrease: string;
  /** Variation nulle. */
  stable: string;
  /** Description de la courbe ; `{count}`, `{first}`, `{last}`, `{min}`, `{max}` sont remplacés. */
  trend: string;
  /** Annoncé pendant le chargement. */
  loading: string;
}

export const GESTIO_STAT_CARD_LABELS: GestioStatCardLabels = {
  increase: 'En hausse de {value}',
  decrease: 'En baisse de {value}',
  stable: 'Stable',
  trend: 'Évolution sur {count} points : de {first} à {last} (min. {min}, max. {max})',
  loading: 'Chargement de l’indicateur',
};

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/** Dimensions du repère SVG de la courbe (étirée en largeur). */
const SPARK_WIDTH = 100;
const SPARK_HEIGHT = 32;
const SPARK_PADDING = 3;

/**
 * Indicateur clé (KPI) : libellé, valeur, variation et courbe de tendance.
 *
 * ```html
 * <gestio-stat-card
 *   label="Chiffre d'affaires"
 *   [value]="48250"
 *   [valueFormat]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
 *   [delta]="12.5"
 *   comparison="vs mois dernier"
 *   [trend]="[32, 35, 31, 40, 44, 48]"
 * >
 *   <svg gestioStatCardIcon aria-hidden="true">…</svg>
 * </gestio-stat-card>
 * ```
 *
 * La couleur de la variation n'est jamais seule porteuse d'information : le
 * sens est donné par une flèche et un texte destiné aux lecteurs d'écran.
 */
@Component({
  selector: 'gestio-stat-card',
  imports: [GestioSkeleton],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
  host: {
    class: 'gestio-stat-card',
    role: 'group',
    '[attr.aria-labelledby]': 'labelId',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
})
export class GestioStatCard {
  /** Intitulé de l'indicateur. */
  readonly label = input.required<string>();
  /** Valeur : un nombre est formaté avec `Intl.NumberFormat`, une chaîne est affichée telle quelle. */
  readonly value = input<number | string | null>(null);
  /** Options de formatage d'une valeur numérique (devise, pourcentage, unité…). */
  readonly valueFormat = input<Intl.NumberFormatOptions>({});
  /** Variation en pourcentage (ex. `12.5` pour +12,5 %). */
  readonly delta = input<number | null>(null);
  /** Une baisse est une bonne nouvelle (délai de paiement, taux d'attrition…). */
  readonly invertDelta = input(false, { transform: booleanAttribute });
  /** Texte de comparaison affiché après la variation (ex. « vs mois dernier »). */
  readonly comparison = input<string>();
  /** Série de valeurs pour la mini-courbe (au moins 2 points). */
  readonly trend = input<readonly number[]>([]);
  /** Remplace la valeur par un squelette de chargement. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Langue de formatage des nombres. */
  readonly locale = input('fr-FR');
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioStatCardLabels>>({});

  protected readonly labelId = gestioUniqueId('gestio-stat-card-label');

  protected readonly text = computed<GestioStatCardLabels>(() => ({
    ...GESTIO_STAT_CARD_LABELS,
    ...this.labels(),
  }));

  private readonly numberFormat = computed(
    () => new Intl.NumberFormat(this.locale(), this.valueFormat()),
  );

  protected readonly formattedValue = computed(() => {
    const value = this.value();
    if (value === null) return '—';
    return typeof value === 'number' ? this.numberFormat().format(value) : value;
  });

  protected readonly hasDelta = computed(() => {
    const delta = this.delta();
    return delta !== null && Number.isFinite(delta);
  });

  protected readonly direction = computed<'up' | 'down' | 'flat'>(() => {
    const delta = this.delta() ?? 0;
    return delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  });

  protected readonly tone = computed<GestioStatCardTone>(() => {
    const direction = this.direction();
    if (direction === 'flat') return 'neutral';
    const good = direction === 'up' ? !this.invertDelta() : this.invertDelta();
    return good ? 'positive' : 'negative';
  });

  protected readonly formattedDelta = computed(() =>
    new Intl.NumberFormat(this.locale(), {
      style: 'percent',
      signDisplay: 'exceptZero',
      maximumFractionDigits: 1,
    }).format((this.delta() ?? 0) / 100),
  );

  protected readonly deltaDescription = computed(() => {
    const text = this.text();
    const value = new Intl.NumberFormat(this.locale(), {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(Math.abs(this.delta() ?? 0) / 100);
    switch (this.direction()) {
      case 'up':
        return interpolate(text.increase, { value });
      case 'down':
        return interpolate(text.decrease, { value });
      default:
        return text.stable;
    }
  });

  private readonly trendValues = computed(() => this.trend().filter((v) => Number.isFinite(v)));

  /** Points de la polyligne dans le repère SVG. */
  protected readonly sparkPoints = computed(() => {
    const values = this.trendValues();
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const range = Math.max(...values) - min || 1;
    const usable = SPARK_HEIGHT - SPARK_PADDING * 2;
    return values.map((v, i) => ({
      x: (i / (values.length - 1)) * SPARK_WIDTH,
      // Série constante : ligne centrée.
      y:
        Math.max(...values) === min
          ? SPARK_HEIGHT / 2
          : SPARK_PADDING + (1 - (v - min) / range) * usable,
    }));
  });

  protected readonly sparkPath = computed(
    () =>
      this.sparkPoints()
        ?.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
        .join(' ') ?? '',
  );

  protected readonly sparkViewBox = `0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`;

  protected readonly trendDescription = computed(() => {
    const values = this.trendValues();
    if (values.length < 2) return '';
    const format = (v: number) => this.numberFormat().format(v);
    return interpolate(this.text().trend, {
      count: values.length,
      first: format(values[0]),
      last: format(values[values.length - 1]),
      min: format(Math.min(...values)),
      max: format(Math.max(...values)),
    });
  });
}
