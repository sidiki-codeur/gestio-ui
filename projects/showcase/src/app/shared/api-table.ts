import { Component, input } from '@angular/core';

export interface ApiRow {
  readonly name: string;
  readonly type: string;
  readonly default?: string;
  readonly description: string;
}

/** Tableau des paramètres publics d'un composant. */
@Component({
  selector: 'sc-api-table',
  template: `
    <div class="sc-table-wrap" tabindex="0" role="region" [attr.aria-label]="caption()">
      <table class="sc-table">
        <caption class="sc-sr-only">
          {{
            caption()
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">Nom</th>
            <th scope="col">Type</th>
            <th scope="col">Défaut</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.name) {
            <tr>
              <th scope="row">
                <code>{{ row.name }}</code>
              </th>
              <td>
                <code class="sc-table__type">{{ row.type }}</code>
              </td>
              <td>
                @if (row.default) {
                  <code>{{ row.default }}</code>
                } @else {
                  <span aria-hidden="true">—</span><span class="sc-sr-only">Aucun</span>
                }
              </td>
              <td>{{ row.description }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ApiTable {
  readonly caption = input.required<string>();
  readonly rows = input.required<readonly ApiRow[]>();
}
