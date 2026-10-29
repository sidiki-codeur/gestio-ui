import { Component, booleanAttribute, computed, input } from '@angular/core';
import { ChartLegendItem, ChartPoint, GestioCartesianChart } from './chart-base';
import { GestioChartTable } from './chart-table';
import { chartDash, markerHollow, markerPath, textWidth } from './chart-utils';

/** Courbe dessinée (usage interne). */
interface LineShape {
  readonly index: number;
  readonly color: string;
  readonly dash: string | null;
  readonly path: string;
  readonly area: string;
  readonly hollow: boolean;
  readonly markers: readonly { readonly key: string; readonly d: string }[];
}

/**
 * Graphique en courbes (avec aire optionnelle), en SVG sans dépendance.
 *
 * ```html
 * <gestio-line-chart
 *   heading="Trésorerie"
 *   [categories]="['Janv.', 'Févr.', 'Mars', 'Avr.']"
 *   [series]="[{ name: 'Solde', data: [12400, 15800, 14100, 18900] }]"
 *   [valueFormat]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
 *   area
 * />
 * ```
 *
 * Chaque série a son trait (continu, tirets, pointillés…) et sa forme de
 * marqueur en plus de sa couleur. Une valeur `null` interrompt la courbe.
 * Chaque point est atteignable au clavier (Tab puis flèches ; haut/bas changent
 * de série) et affiche une info-bulle.
 */
@Component({
  selector: 'gestio-line-chart',
  templateUrl: './line-chart.html',
  styleUrl: './chart.scss',
  imports: [GestioChartTable],
  host: { class: 'gestio-chart gestio-line-chart' },
})
export class GestioLineChart extends GestioCartesianChart {
  /** Remplit l'aire sous chaque courbe. */
  readonly area = input(false, { transform: booleanAttribute });
  /** Affiche un marqueur sur chaque point. */
  readonly markers = input(true, { transform: booleanAttribute });
  /** L'axe vertical part de zéro (sinon il s'ajuste aux valeurs). */
  readonly beginAtZero = input(true, { transform: booleanAttribute });

  protected readonly summaryKey = 'lineSummary';

  protected readonly extent = computed<readonly [number, number]>(() => {
    const all = this.values()
      .flat()
      .filter((v): v is number => v !== null);
    if (!all.length) return [0, 1];
    let min = Math.min(...all);
    let max = Math.max(...all);
    if (this.beginAtZero()) {
      min = Math.min(0, min);
      max = Math.max(0, max);
    }
    return [min, max];
  });

  /** Retrait horizontal pour que les libellés extrêmes restent lisibles. */
  private readonly inset = computed(() => {
    const widest = Math.max(0, ...this.categories().map(textWidth));
    return Math.min(40, Math.max(8, widest / 2));
  });

  protected categoryX(index: number): number {
    const { left, right } = this.plot();
    const count = this.categories().length;
    if (count <= 1) return (left + right) / 2;
    const inset = this.inset();
    return left + inset + (index * (right - left - inset * 2)) / (count - 1);
  }

  protected readonly lines = computed<LineShape[]>(() => {
    const base = this.baselineY();
    return this.values().map((row, s) => {
      const segments: { x: number; y: number }[][] = [];
      let current: { x: number; y: number }[] = [];
      const markers: { key: string; d: string }[] = [];
      row.forEach((value, i) => {
        if (value === null) {
          if (current.length) segments.push(current);
          current = [];
          return;
        }
        const point = { x: this.categoryX(i), y: this.scaleY(value) };
        current.push(point);
        markers.push({ key: `${s}-${i}`, d: markerPath(s, point.x, point.y) });
      });
      if (current.length) segments.push(current);
      const coords = (seg: { x: number; y: number }[]) =>
        seg.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join('L');
      return {
        index: s,
        color: this.colors()[s],
        dash: chartDash(s),
        hollow: markerHollow(s),
        path: segments.map((seg) => `M${coords(seg)}`).join(''),
        area: segments
          .filter((seg) => seg.length > 1)
          .map(
            (seg) =>
              `M${seg[0].x.toFixed(2)} ${base.toFixed(2)}L${coords(seg)}L${seg[seg.length - 1].x.toFixed(2)} ${base.toFixed(2)}Z`,
          )
          .join(''),
        markers,
      };
    });
  });

  protected readonly points = computed<ChartPoint[]>(() => {
    const categories = this.categories();
    const series = this.series();
    const points: ChartPoint[] = [];
    this.values().forEach((row, s) =>
      row.forEach((value, i) => {
        if (value === null) return;
        points.push({
          key: `${s}-${i}`,
          series: s,
          index: i,
          x: this.categoryX(i),
          y: this.scaleY(value),
          category: categories[i],
          seriesName: series[s].name,
          value: this.format(value),
          fill: this.colors()[s],
          ariaLabel: this.pointLabel(categories[i], series[s].name, value),
        });
      }),
    );
    return points;
  });

  /** Légende : trait et marqueur de chaque série. */
  protected readonly lineLegend = computed(() =>
    this.legendItems().map((item: ChartLegendItem) => ({
      ...item,
      dash: chartDash(item.index),
      hollow: markerHollow(item.index),
      marker: markerPath(item.index, 14, 6, 3.5),
    })),
  );
}
