import { Component, booleanAttribute, computed, input } from '@angular/core';
import { ChartPoint, GestioCartesianChart } from './chart-base';
import { GestioChartTable } from './chart-table';

/** Barre dessinée (usage interne). */
interface BarShape {
  readonly key: string;
  readonly series: number;
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fill: string;
  readonly value: number;
  /** Zone de survol et de focus (au moins 8 px de haut). */
  readonly hit: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

/** Écart entre deux barres d'un même groupe (px). */
const GAP = 2;

/**
 * Graphique en barres verticales, groupées ou empilées, en SVG sans dépendance.
 *
 * ```html
 * <gestio-bar-chart
 *   heading="Chiffre d'affaires mensuel"
 *   [categories]="['Janv.', 'Févr.', 'Mars']"
 *   [series]="[
 *     { name: '2025', data: [32100, 35400, 31800] },
 *     { name: '2026', data: [35800, 38900, 41200] },
 *   ]"
 *   [valueFormat]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
 * />
 * ```
 *
 * Le dessin est une image (`role="img"`) nommée par `heading` et résumée en
 * texte ; chaque barre est atteignable au clavier (Tab puis flèches) et affiche
 * une info-bulle au survol comme au focus. Un tableau de données équivalent est
 * lu par les lecteurs d'écran et peut être affiché. Chaque série porte un motif
 * en plus de sa couleur.
 */
@Component({
  selector: 'gestio-bar-chart',
  imports: [GestioChartTable],
  templateUrl: './bar-chart.html',
  styleUrl: './chart.scss',
  host: { class: 'gestio-chart gestio-bar-chart' },
})
export class GestioBarChart extends GestioCartesianChart {
  /** Empile les séries au lieu de les juxtaposer. */
  readonly stacked = input(false, { transform: booleanAttribute });
  /** Superpose un motif par série pour ne pas reposer sur la seule couleur. */
  readonly patterns = input(true, { transform: booleanAttribute });

  protected override patternsEnabled(): boolean {
    return this.patterns();
  }

  protected readonly summaryKey = 'barSummary';

  protected readonly extent = computed<readonly [number, number]>(() => {
    const values = this.values();
    let min = 0;
    let max = 0;
    this.categories().forEach((_, i) => {
      if (this.stacked()) {
        let positive = 0;
        let negative = 0;
        for (const row of values) {
          const v = row[i] ?? 0;
          if (v >= 0) positive += v;
          else negative += v;
        }
        max = Math.max(max, positive);
        min = Math.min(min, negative);
      } else {
        for (const row of values) {
          const v = row[i];
          if (v === null) continue;
          max = Math.max(max, v);
          min = Math.min(min, v);
        }
      }
    });
    return [min, max];
  });

  private readonly band = computed(() => {
    const { left, right } = this.plot();
    return (right - left) / Math.max(1, this.categories().length);
  });

  protected categoryX(index: number): number {
    return this.plot().left + this.band() * (index + 0.5);
  }

  protected readonly bars = computed<BarShape[]>(() => {
    const values = this.values();
    const count = values.length;
    if (!count) return [];
    const band = this.band();
    const inner = band * 0.72;
    const { top, bottom } = this.plot();
    const zero = this.baselineY();
    const stacked = this.stacked();
    const barWidth = stacked
      ? Math.min(inner, 56)
      : Math.max(1, Math.min((inner - GAP * (count - 1)) / count, 48));
    const groupWidth = stacked ? barWidth : barWidth * count + GAP * (count - 1);
    const positive = new Array<number>(this.categories().length).fill(0);
    const negative = new Array<number>(this.categories().length).fill(0);
    const shapes: BarShape[] = [];

    values.forEach((row, s) => {
      row.forEach((value, i) => {
        if (value === null) return;
        const start = this.categoryX(i) - groupWidth / 2;
        const x = stacked ? start : start + s * (barWidth + GAP);
        let y1 = zero;
        let y2 = this.scaleY(value);
        if (stacked) {
          const base = value >= 0 ? positive[i] : negative[i];
          y1 = this.scaleY(base);
          y2 = this.scaleY(base + value);
          if (value >= 0) positive[i] += value;
          else negative[i] += value;
        }
        const y = Math.min(y1, y2);
        const height = Math.abs(y2 - y1);
        const hitHeight = Math.max(8, height);
        shapes.push({
          key: `${s}-${i}`,
          series: s,
          index: i,
          x,
          y,
          width: barWidth,
          height,
          fill: this.fillFor(s, this.colors()[s]),
          value,
          hit: stacked
            ? { x, y: y + height / 2 - hitHeight / 2, width: barWidth, height: hitHeight }
            : { x, y: top, width: barWidth, height: bottom - top },
        });
      });
    });
    return shapes;
  });

  protected readonly points = computed<ChartPoint[]>(() => {
    const categories = this.categories();
    const series = this.series();
    return this.bars().map((bar) => ({
      key: bar.key,
      series: bar.series,
      index: bar.index,
      x: bar.x + bar.width / 2,
      y: bar.y,
      category: categories[bar.index],
      seriesName: series[bar.series].name,
      value: this.format(bar.value),
      fill: bar.fill,
      ariaLabel: this.pointLabel(categories[bar.index], series[bar.series].name, bar.value),
    }));
  });

  protected readonly focusedBar = computed(() => {
    const key = this.focusedKey();
    return key ? (this.bars().find((bar) => bar.key === key) ?? null) : null;
  });
}
