import { Component, booleanAttribute, computed, input, numberAttribute } from '@angular/core';
import { ChartLegendItem, ChartPoint, GestioChartBase } from './chart-base';
import { ChartTableRow, GestioChartTable } from './chart-table';
import { chartColor, interpolate, isFiniteNumber } from './chart-utils';

/** Part dessinée (usage interne). */
interface SliceShape {
  readonly key: string;
  readonly index: number;
  readonly d: string;
  readonly fill: string;
  readonly cx: number;
  readonly cy: number;
}

const f = (n: number) => n.toFixed(2);

/**
 * Graphique en anneau (répartition), en SVG sans dépendance.
 *
 * ```html
 * <gestio-donut-chart
 *   heading="Répartition des dépenses"
 *   [categories]="['Salaires', 'Loyers', 'Logiciels']"
 *   [values]="[18400, 4200, 1350]"
 *   [valueFormat]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
 * />
 * ```
 *
 * La légende indique la valeur et la part de chaque catégorie (l'information
 * ne repose pas sur la couleur), et chaque part porte un motif. Les parts sont
 * atteignables au clavier (Tab puis flèches) avec info-bulle. Les valeurs
 * négatives ou absentes comptent pour zéro.
 */
@Component({
  selector: 'gestio-donut-chart',
  imports: [GestioChartTable],
  templateUrl: './donut-chart.html',
  styleUrl: './chart.scss',
  host: { class: 'gestio-chart gestio-donut-chart' },
})
export class GestioDonutChart extends GestioChartBase {
  /** Nom de chaque part. */
  readonly categories = input.required<readonly string[]>();
  /** Valeur de chaque part, dans l'ordre de `categories`. */
  readonly values = input.required<readonly (number | null)[]>();
  /** Couleurs CSS facultatives par part (sinon la palette `--gestio-chart-N`). */
  readonly colors = input<readonly (string | undefined)[]>([]);
  /** Diamètre maximal en pixels (l'anneau rétrécit avec son conteneur). */
  readonly size = input(240, { transform: numberAttribute });
  /** Épaisseur de l'anneau, en fraction du rayon (0,1 à 1 ; 1 = camembert). */
  readonly thickness = input(0.38, { transform: numberAttribute });
  /** Affiche le total au centre. */
  readonly showTotal = input(true, { transform: booleanAttribute });
  /** Superpose un motif par part pour ne pas reposer sur la seule couleur. */
  readonly patterns = input(true, { transform: booleanAttribute });

  protected override readonly linearNavigation = true;
  protected readonly viewWidth = computed(() => Math.max(80, this.size()));
  protected readonly viewHeight = this.viewWidth;

  protected override patternsEnabled(): boolean {
    return this.patterns();
  }

  private readonly cleanValues = computed(() =>
    this.categories().map((_, i) => {
      const value = this.values()[i];
      return isFiniteNumber(value) && value > 0 ? value : 0;
    }),
  );

  protected readonly total = computed(() => this.cleanValues().reduce((sum, v) => sum + v, 0));
  protected readonly hasData = computed(() => this.total() > 0);

  private readonly sliceColors = computed(() =>
    this.categories().map((_, i) => chartColor(i, this.colors()[i])),
  );

  protected readonly patternDefs = computed(() => this.patternDefsFor(this.sliceColors()));

  private readonly percentFormat = computed(
    () => new Intl.NumberFormat(this.locale(), { style: 'percent', maximumFractionDigits: 1 }),
  );

  private percent(value: number): string {
    const total = this.total();
    return this.percentFormat().format(total ? value / total : 0);
  }

  protected readonly geometry = computed(() => {
    const size = this.viewWidth();
    const outer = size / 2 - 4;
    const ratio = Math.min(1, Math.max(0.1, this.thickness()));
    const inner = outer * (1 - ratio);
    return { center: size / 2, outer, inner };
  });

  protected readonly slices = computed<SliceShape[]>(() => {
    const total = this.total();
    if (!total) return [];
    const { center: c, outer: R, inner: r } = this.geometry();
    const shapes: SliceShape[] = [];
    let angle = -Math.PI / 2;
    this.cleanValues().forEach((value, index) => {
      if (!value) return;
      const sweep = (value / total) * Math.PI * 2;
      const end = angle + sweep;
      const mid = angle + sweep / 2;
      const fill = this.fillFor(index, this.sliceColors()[index]);
      let d: string;
      if (sweep >= Math.PI * 2 - 1e-6) {
        // Part unique : anneau complet en deux demi-cercles.
        d =
          `M${f(c)} ${f(c - R)}A${f(R)} ${f(R)} 0 1 1 ${f(c)} ${f(c + R)}A${f(R)} ${f(R)} 0 1 1 ${f(c)} ${f(c - R)}Z` +
          (r > 0
            ? `M${f(c)} ${f(c - r)}A${f(r)} ${f(r)} 0 1 0 ${f(c)} ${f(c + r)}A${f(r)} ${f(r)} 0 1 0 ${f(c)} ${f(c - r)}Z`
            : '');
      } else {
        const large = sweep > Math.PI ? 1 : 0;
        const p = (radius: number, a: number) =>
          `${f(c + radius * Math.cos(a))} ${f(c + radius * Math.sin(a))}`;
        d =
          `M${p(R, angle)}A${f(R)} ${f(R)} 0 ${large} 1 ${p(R, end)}` +
          (r > 0
            ? `L${p(r, end)}A${f(r)} ${f(r)} 0 ${large} 0 ${p(r, angle)}Z`
            : `L${f(c)} ${f(c)}Z`);
      }
      const labelRadius = r > 0 ? (R + r) / 2 : R * 0.6;
      shapes.push({
        key: `0-${index}`,
        index,
        d,
        fill,
        cx: c + labelRadius * Math.cos(mid),
        cy: c + labelRadius * Math.sin(mid),
      });
      angle = end;
    });
    return shapes;
  });

  protected readonly points = computed<ChartPoint[]>(() => {
    const categories = this.categories();
    const values = this.cleanValues();
    return this.slices().map((slice) => {
      const value = this.format(values[slice.index]);
      const percent = this.percent(values[slice.index]);
      return {
        key: slice.key,
        series: 0,
        index: slice.index,
        x: slice.cx,
        y: slice.cy,
        category: categories[slice.index],
        seriesName: percent,
        value,
        fill: slice.fill,
        ariaLabel: interpolate(this.text().slice, {
          category: categories[slice.index],
          value,
          percent,
        }),
      };
    });
  });

  protected readonly focusedSlice = computed(() => {
    const key = this.focusedKey();
    return key ? (this.slices().find((slice) => slice.key === key) ?? null) : null;
  });

  protected readonly formattedTotal = computed(() => this.format(this.total()));

  protected readonly legendItems = computed<ChartLegendItem[]>(() => {
    const values = this.cleanValues();
    return this.categories().map((name, index) => ({
      index,
      name,
      color: this.sliceColors()[index],
      fill: this.fillFor(index, this.sliceColors()[index]),
      detail: `${this.format(values[index])} (${this.percent(values[index])})`,
    }));
  });

  protected readonly tableColumns = computed(() => [
    this.text().category,
    this.text().value,
    this.text().share,
  ]);

  protected readonly tableRows = computed<ChartTableRow[]>(() => {
    const values = this.cleanValues();
    return this.categories().map((header, i) => ({
      header,
      cells: [this.format(values[i]), this.percent(values[i])],
    }));
  });

  protected readonly tableFooter = computed<ChartTableRow>(() => ({
    header: this.text().total,
    cells: [this.formattedTotal(), this.percentFormat().format(1)],
  }));

  protected readonly summary = computed(() =>
    interpolate(this.text().donutSummary, {
      count: this.slices().length,
      total: this.formattedTotal(),
    }),
  );
}
