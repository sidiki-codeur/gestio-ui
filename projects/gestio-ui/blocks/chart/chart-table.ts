import { Component, booleanAttribute, input, model } from '@angular/core';
import { GestioButton } from '@gestiolabs336/ui/button';

/** Ligne du tableau de données équivalent (usage interne). */
export interface ChartTableRow {
  readonly header: string;
  readonly cells: readonly string[];
}

/**
 * Tableau de données équivalent au graphique (usage interne) : masqué
 * visuellement par défaut mais toujours lu par les lecteurs d'écran, et
 * affichable par un bouton.
 */
@Component({
  selector: 'gestio-chart-table',
  imports: [GestioButton],
  template: `
    @if (toggle()) {
      <button
        gestioButton
        variant="ghost"
        size="sm"
        class="gestio-chart-table__toggle"
        [attr.aria-expanded]="visible()"
        [attr.aria-controls]="tableId()"
        (click)="visible.set(!visible())"
      >
        {{ visible() ? hideLabel() : showLabel() }}
      </button>
    }
    <div
      class="gestio-chart-table__wrap"
      [class.gestio-chart-table__wrap--hidden]="!visible()"
      [attr.id]="tableId()"
      [attr.role]="visible() ? 'region' : null"
      [attr.aria-label]="visible() ? caption() : null"
      [attr.tabindex]="visible() ? 0 : null"
    >
      <table class="gestio-chart-table__table">
        <caption>
          {{
            caption()
          }}
        </caption>
        <thead>
          <tr>
            @for (column of columns(); track $index) {
              <th scope="col">{{ column }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track $index) {
            <tr>
              <th scope="row">{{ row.header }}</th>
              @for (cell of row.cells; track $index) {
                <td>{{ cell }}</td>
              }
            </tr>
          }
        </tbody>
        @if (footer(); as footer) {
          <tfoot>
            <tr>
              <th scope="row">{{ footer.header }}</th>
              @for (cell of footer.cells; track $index) {
                <td>{{ cell }}</td>
              }
            </tr>
          </tfoot>
        }
      </table>
    </div>
  `,
  styleUrl: './chart-table.scss',
  host: { class: 'gestio-chart-table' },
})
export class GestioChartTable {
  readonly caption = input.required<string>();
  readonly columns = input.required<readonly string[]>();
  readonly rows = input.required<readonly ChartTableRow[]>();
  readonly footer = input<ChartTableRow | null>(null);
  readonly tableId = input.required<string>();
  readonly toggle = input(true, { transform: booleanAttribute });
  readonly showLabel = input.required<string>();
  readonly hideLabel = input.required<string>();
  readonly visible = model(false);
}
