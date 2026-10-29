import {
  DestroyRef,
  Directive,
  ElementRef,
  Signal,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  signal,
} from '@angular/core';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GESTIO_CHART_LABELS, GestioChartLabels, GestioChartSeries } from './chart';
import {
  CHART_PATTERNS,
  chartColor,
  interpolate,
  isFiniteNumber,
  niceTicks,
  patternIndex,
  textWidth,
} from './chart-utils';
import { ChartTableRow } from './chart-table';

/** Point de données navigable (barre, point de courbe, part d'anneau). Usage interne. */
export interface ChartPoint {
  readonly key: string;
  readonly series: number;
  readonly index: number;
  /** Ancre de l'info-bulle, dans le repère du `viewBox`. */
  readonly x: number;
  readonly y: number;
  readonly category: string;
  readonly seriesName: string;
  readonly value: string;
  readonly fill: string;
  readonly ariaLabel: string;
}

/** Élément de légende. Usage interne. */
export interface ChartLegendItem {
  readonly index: number;
  readonly name: string;
  readonly color: string;
  readonly fill: string;
  readonly detail?: string;
}

/** Motif défini dans `<defs>`. Usage interne. */
export interface ChartPatternDef {
  readonly id: string;
  readonly color: string;
  readonly d: string;
}

/** Marges du repère cartésien (px). */
const TOP = 12;
const BOTTOM = 28;
const RIGHT = 12;

/** Socle commun des graphiques : libellés, formatage, info-bulle et clavier. */
@Directive()
export abstract class GestioChartBase {
  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Titre du graphique (nom de l'image, légende du tableau de données). */
  readonly heading = input.required<string>();
  /** Description complémentaire lue avant le résumé automatique. */
  readonly description = input<string>();
  /** Options `Intl.NumberFormat` des valeurs (devise, pourcentage, unité…). */
  readonly valueFormat = input<Intl.NumberFormatOptions>({});
  /** Langue de formatage des nombres. */
  readonly locale = input('fr-FR');
  /** Affiche la légende. */
  readonly legend = input(true, { transform: booleanAttribute });
  /** Affiche le bouton « Afficher le tableau » (le tableau reste lu par les lecteurs d'écran). */
  readonly tableToggle = input(true, { transform: booleanAttribute });
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioChartLabels>>({});

  protected readonly uid = gestioUniqueId('gestio-chart');
  protected readonly titleId = `${this.uid}-title`;
  protected readonly descId = `${this.uid}-desc`;
  protected readonly tableId = `${this.uid}-table`;

  protected readonly text = computed<GestioChartLabels>(() => ({
    ...GESTIO_CHART_LABELS,
    ...this.labels(),
  }));

  protected readonly numberFormat = computed(
    () => new Intl.NumberFormat(this.locale(), this.valueFormat()),
  );

  protected format(value: number | null): string {
    return value === null ? this.text().missing : this.numberFormat().format(value);
  }

  /** Points navigables, dans l'ordre de lecture. */
  protected abstract readonly points: Signal<readonly ChartPoint[]>;
  protected abstract readonly viewWidth: Signal<number>;
  protected abstract readonly viewHeight: Signal<number>;
  /** Flèches : `true` = ordre linéaire (anneau), `false` = catégories × séries. */
  protected readonly linearNavigation: boolean = false;

  protected readonly tableVisible = signal(false);
  private readonly hoveredKey = signal<string | null>(null);
  protected readonly focusedKey = signal<string | null>(null);
  private readonly dismissed = signal(false);

  /** Point qui porte `tabindex="0"` (tabulation itinérante). */
  protected readonly rovingKey = linkedSignal<readonly ChartPoint[], string | null>({
    source: () => this.points(),
    computation: (points, previous) =>
      previous?.value && points.some((p) => p.key === previous.value)
        ? previous.value
        : (points[0]?.key ?? null),
  });

  protected readonly activeKey = computed(() => this.hoveredKey() ?? this.focusedKey());

  /** Série du point actif (survolé ou focalisé). */
  protected readonly activeSeries = computed(() => {
    const key = this.activeKey();
    return key ? Number(key.split('-')[0]) : null;
  });

  protected readonly focusedPoint = computed(() => {
    const key = this.focusedKey();
    return key ? (this.points().find((p) => p.key === key) ?? null) : null;
  });

  protected readonly tooltip = computed(() => {
    const key = this.activeKey();
    if (!key || this.dismissed()) return null;
    const point = this.points().find((p) => p.key === key);
    if (!point) return null;
    return {
      point,
      left: (point.x / this.viewWidth()) * 100,
      top: (point.y / this.viewHeight()) * 100,
    };
  });

  /** Motifs superposés aux aplats (barres, parts) ; redéfini par les graphiques concernés. */
  protected patternsEnabled(): boolean {
    return false;
  }

  /** Remplissage d'une série : motif (si activé) ou couleur. */
  protected fillFor(index: number, color: string): string {
    return this.patternsEnabled() && patternIndex(index) > 0
      ? `url(#${this.uid}-p${index})`
      : color;
  }

  protected patternDefsFor(colors: readonly string[]): ChartPatternDef[] {
    if (!this.patternsEnabled()) return [];
    return colors
      .map((color, index) => ({
        id: `${this.uid}-p${index}`,
        color,
        d: CHART_PATTERNS[patternIndex(index)],
      }))
      .filter((def) => def.d);
  }

  protected pointEnter(key: string): void {
    this.hoveredKey.set(key);
    this.dismissed.set(false);
  }

  protected pointLeave(): void {
    this.hoveredKey.set(null);
  }

  protected pointFocus(key: string): void {
    this.focusedKey.set(key);
    this.rovingKey.set(key);
    this.dismissed.set(false);
  }

  protected pointBlur(): void {
    this.focusedKey.set(null);
  }

  protected onPointsKeydown(event: KeyboardEvent): void {
    const points = this.points();
    const position = points.findIndex((p) => p.key === this.rovingKey());
    const current = points[position];
    if (!current) return;
    let next: ChartPoint | undefined;
    const sameSeries = points.filter((p) => p.series === current.series);
    const indexInSeries = sameSeries.indexOf(current);
    const linear = this.linearNavigation;

    switch (event.key) {
      case 'ArrowRight':
        next = linear ? points[position + 1] : sameSeries[indexInSeries + 1];
        break;
      case 'ArrowLeft':
        next = linear ? points[position - 1] : sameSeries[indexInSeries - 1];
        break;
      case 'ArrowUp':
      case 'ArrowDown': {
        const up = event.key === 'ArrowUp';
        if (linear) {
          // Anneau : haut = part précédente, bas = part suivante.
          next = points[position + (up ? -1 : 1)];
          break;
        }
        // Haut = série suivante (segment supérieur d'une pile), bas = série précédente.
        const column = points.filter((p) => p.index === current.index);
        next = column[column.indexOf(current) + (up ? 1 : -1)];
        break;
      }
      case 'Home':
        next = linear ? points[0] : sameSeries[0];
        break;
      case 'End':
        next = linear ? points[points.length - 1] : sameSeries[sameSeries.length - 1];
        break;
      case 'Escape':
        if (!this.tooltip()) return;
        this.dismissed.set(true);
        event.preventDefault();
        return;
      default:
        return;
    }
    event.preventDefault();
    if (!next) return;
    this.rovingKey.set(next.key);
    this.host.nativeElement.querySelector<SVGElement>(`[data-point="${next.key}"]`)?.focus();
  }
}

/** Socle des graphiques à axes (barres, courbes). */
@Directive()
export abstract class GestioCartesianChart extends GestioChartBase {
  /** Séries de valeurs (une valeur par catégorie). */
  readonly series = input.required<readonly GestioChartSeries[]>();
  /** Libellés de l'axe horizontal (mois, produits…). */
  readonly categories = input.required<readonly string[]>();
  /** Hauteur du graphique en pixels (la largeur suit le conteneur). */
  readonly height = input(280, { transform: numberAttribute });
  /** Lignes horizontales de repère. */
  readonly grid = input(true, { transform: booleanAttribute });
  /** Format des graduations (par défaut `valueFormat`). */
  readonly axisFormat = input<Intl.NumberFormatOptions | null>(null);

  /** Largeur mesurée du conteneur (600 avant mesure et côté serveur). */
  protected readonly width = signal(600);
  protected readonly viewWidth = computed(() => Math.max(160, this.width()));
  protected readonly viewHeight = computed(() => Math.max(120, this.height()));

  protected abstract readonly summaryKey: 'barSummary' | 'lineSummary';
  /** Bornes des données à couvrir par l'axe vertical. */
  protected abstract readonly extent: Signal<readonly [number, number]>;
  /** Abscisse du centre de la catégorie `index`. */
  protected abstract categoryX(index: number): number;

  constructor() {
    super();
    // Rendu responsive : le viewBox suit la largeur réelle (navigateur uniquement).
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const element = this.host.nativeElement;
      const measure = (width: number) => {
        if (width > 0) this.width.set(Math.round(width));
      };
      measure(element.clientWidth);
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver((entries) => measure(entries[0]?.contentRect.width ?? 0));
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected readonly values = computed(() => {
    const count = this.categories().length;
    return this.series().map((s) =>
      Array.from({ length: count }, (_, i) => {
        const value = s.data[i];
        return isFiniteNumber(value) ? value : null;
      }),
    );
  });

  protected readonly colors = computed(() =>
    this.series().map((s, index) => chartColor(index, s.color)),
  );

  protected readonly patternDefs = computed(() => this.patternDefsFor(this.colors()));

  protected readonly hasData = computed(() =>
    this.values().some((row) => row.some((v) => v !== null)),
  );

  protected readonly ticks = computed(() => {
    const [min, max] = this.extent();
    const plotHeight = this.viewHeight() - TOP - BOTTOM;
    return niceTicks(min, max, Math.max(2, Math.round(plotHeight / 56)));
  });

  private readonly axisNumberFormat = computed(
    () => new Intl.NumberFormat(this.locale(), this.axisFormat() ?? this.valueFormat()),
  );

  private readonly tickTexts = computed(() =>
    this.ticks().map((tick) => this.axisNumberFormat().format(tick)),
  );

  protected readonly plot = computed(() => {
    const labelWidth = Math.max(0, ...this.tickTexts().map(textWidth));
    return {
      left: Math.max(32, Math.ceil(labelWidth) + 12),
      right: this.viewWidth() - RIGHT,
      top: TOP,
      bottom: this.viewHeight() - BOTTOM,
    };
  });

  protected scaleY(value: number): number {
    const ticks = this.ticks();
    const min = ticks[0];
    const max = ticks[ticks.length - 1];
    const { top, bottom } = this.plot();
    return bottom - ((value - min) / (max - min || 1)) * (bottom - top);
  }

  protected readonly yTicks = computed(() =>
    this.ticks().map((value, i) => ({
      value,
      label: this.tickTexts()[i],
      y: this.scaleY(value),
    })),
  );

  /** Ordonnée de la ligne de base (0, ou la borne la plus proche). */
  protected readonly baselineY = computed(() => {
    const ticks = this.ticks();
    const zero = Math.min(Math.max(0, ticks[0]), ticks[ticks.length - 1]);
    return this.scaleY(zero);
  });

  /** Libellés de l'axe horizontal ; un sur `n` si la place manque. */
  protected readonly xLabels = computed(() => {
    const categories = this.categories();
    const { left, right } = this.plot();
    const widest = Math.max(0, ...categories.map(textWidth)) + 12;
    const available = (right - left) / Math.max(1, categories.length);
    const step = Math.max(1, Math.ceil(widest / available));
    return categories
      .map((label, index) => ({ label, index, x: this.categoryX(index) }))
      .filter((item) => item.index % step === 0);
  });

  protected readonly legendItems = computed<ChartLegendItem[]>(() =>
    this.series().map((s, index) => ({
      index,
      name: s.name,
      color: this.colors()[index],
      fill: this.fillFor(index, this.colors()[index]),
    })),
  );

  protected readonly tableColumns = computed(() => [
    this.text().category,
    ...this.series().map((s) => s.name),
  ]);

  protected readonly tableRows = computed<ChartTableRow[]>(() => {
    const values = this.values();
    return this.categories().map((header, i) => ({
      header,
      cells: values.map((row) => this.format(row[i])),
    }));
  });

  protected readonly summary = computed(() => {
    const all = this.values()
      .flat()
      .filter((v): v is number => v !== null);
    if (!all.length) return this.text().noData;
    return interpolate(this.text()[this.summaryKey], {
      series: this.series().length,
      count: this.categories().length,
      min: this.format(Math.min(...all)),
      max: this.format(Math.max(...all)),
    });
  });

  protected pointLabel(category: string, series: string, value: number): string {
    return interpolate(this.text().point, { category, series, value: this.format(value) });
  }
}
