import { Component, computed } from '@angular/core';
import { GestioBadge, GestioTable, GestioTableContainer } from '@gestiolabs336/ui';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

interface Line {
  ref: string;
  label: string;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'sc-table-page',
  imports: [GestioTable, GestioTableContainer, GestioBadge, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Tableau" eyebrow="Composants">
      <code>table[gestioTable]</code> met en forme un <code>&lt;table&gt;</code> natif écrit à la
      main : caption, <code>th scope</code>, <code>thead</code>, <code>tbody</code> et
      <code>tfoot</code> gardent leur sémantique. Pour trier, filtrer ou paginer, voir la datagrid.
    </sc-page-header>

    <sc-example heading="Lignes de facture" [code]="basicCode" stacked>
      <gestio-table-container label="Lignes de la facture F-2024-118">
        <table gestioTable>
          <caption>
            Facture F-2024-118 — Atelier Moreau SARL
          </caption>
          <thead>
            <tr>
              <th scope="col">Référence</th>
              <th scope="col">Désignation</th>
              <th scope="col" class="gestio-table-numeric">Qté</th>
              <th scope="col" class="gestio-table-numeric">Prix unitaire HT</th>
              <th scope="col" class="gestio-table-numeric">Total HT</th>
            </tr>
          </thead>
          <tbody>
            @for (line of lines; track line.ref) {
              <tr>
                <th scope="row">{{ line.ref }}</th>
                <td>{{ line.label }}</td>
                <td class="gestio-table-numeric">{{ line.quantity }}</td>
                <td class="gestio-table-numeric">{{ euros(line.unitPrice) }}</td>
                <td class="gestio-table-numeric">{{ euros(line.quantity * line.unitPrice) }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colspan="4">Total HT</th>
              <td class="gestio-table-numeric">{{ euros(total()) }}</td>
            </tr>
          </tfoot>
        </table>
      </gestio-table-container>
    </sc-example>

    <sc-example heading="Compact, rayé et défilement" [code]="compactCode" stacked>
      <gestio-table-container label="Équipe" maxHeight="15rem">
        <table gestioTable density="compact" striped>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Rôle</th>
              <th scope="col">Statut</th>
            </tr>
          </thead>
          <tbody>
            @for (member of team; track member.name) {
              <tr>
                <th scope="row">{{ member.name }}</th>
                <td>{{ member.role }}</td>
                <td>
                  <gestio-badge [variant]="member.active ? 'success' : 'neutral'" size="sm" dot>
                    {{ member.active ? 'Actif' : 'Invité' }}
                  </gestio-badge>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </gestio-table-container>
    </sc-example>

    <sc-example
      heading="Séparateurs de colonnes"
      description="Utile pour les tableaux denses ou très chiffrés (budgets, plannings)."
      [code]="dividersCode"
      stacked
    >
      <gestio-table-container label="Budget prévisionnel par trimestre">
        <table gestioTable columnDividers>
          <caption>
            Budget prévisionnel 2025 (k€)
          </caption>
          <thead>
            <tr>
              <th scope="col">Poste</th>
              @for (quarter of quarters; track quarter) {
                <th scope="col" class="gestio-table-numeric">{{ quarter }}</th>
              }
              <th scope="col" class="gestio-table-numeric">Total</th>
            </tr>
          </thead>
          <tbody>
            @for (row of budget; track row.label) {
              <tr>
                <th scope="row">{{ row.label }}</th>
                @for (value of row.values; track $index) {
                  <td class="gestio-table-numeric">{{ value }}</td>
                }
                <td class="gestio-table-numeric">{{ sum(row.values) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </gestio-table-container>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <p>
        Classe utilitaire <code>gestio-table-numeric</code> : alignement à droite et chiffres
        tabulaires. Les styles sont limités à <code>table.gestio-table</code> avec une spécificité
        minimale, faciles à surcharger.
      </p>
      <sc-api-table caption="Entrées du tableau et de son conteneur" [rows]="api" />
    </section>
  `,
})
export class TablePage {
  private readonly currency = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });

  protected readonly lines: Line[] = [
    { ref: 'PRS-01', label: 'Audit de la comptabilité', quantity: 1, unitPrice: 850 },
    { ref: 'PRS-04', label: 'Paramétrage du logiciel', quantity: 3, unitPrice: 420 },
    {
      ref: 'FRM-02',
      label: 'Formation des utilisateurs (demi-journée)',
      quantity: 2,
      unitPrice: 360,
    },
    { ref: 'LIC-12', label: 'Licence annuelle — 5 postes', quantity: 5, unitPrice: 96 },
  ];
  protected readonly total = computed(() =>
    this.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
  );

  protected readonly team = [
    { name: 'Claire Moreau', role: 'Administratrice', active: true },
    { name: 'Julien Fabre', role: 'Comptable', active: true },
    { name: 'Inès Haddad', role: 'Commerciale', active: true },
    { name: 'Thomas Leroy', role: 'Support', active: false },
    { name: 'Sarah Benali', role: 'Comptable', active: true },
    { name: 'Hugo Martin', role: 'Lecture seule', active: false },
    { name: 'Léa Rousseau', role: 'Commerciale', active: true },
    { name: 'Nicolas Girard', role: 'Direction', active: true },
  ];

  protected readonly quarters = ['T1', 'T2', 'T3', 'T4'];
  protected readonly budget = [
    { label: 'Salaires', values: [182, 184, 190, 196] },
    { label: 'Loyer et charges', values: [24, 24, 24, 25] },
    { label: 'Logiciels', values: [9, 9, 11, 11] },
    { label: 'Marketing', values: [15, 22, 12, 30] },
    { label: 'Déplacements', values: [6, 8, 4, 9] },
  ];

  protected sum(values: number[]): number {
    return values.reduce((total, value) => total + value, 0);
  }

  protected euros(value: number): string {
    return this.currency.format(value);
  }

  protected readonly basicCode = `// imports: [GestioTable, GestioTableContainer]
<gestio-table-container label="Lignes de la facture F-2024-118">
  <table gestioTable>
    <caption>Facture F-2024-118 — Atelier Moreau SARL</caption>
    <thead>
      <tr>
        <th scope="col">Référence</th>
        <th scope="col">Désignation</th>
        <th scope="col" class="gestio-table-numeric">Total HT</th>
      </tr>
    </thead>
    <tbody>
      @for (line of lines; track line.ref) {
        <tr>
          <th scope="row">{{ line.ref }}</th>
          <td>{{ line.label }}</td>
          <td class="gestio-table-numeric">{{ euros(line.quantity * line.unitPrice) }}</td>
        </tr>
      }
    </tbody>
    <tfoot>
      <tr><th scope="row" colspan="2">Total HT</th><td class="gestio-table-numeric">…</td></tr>
    </tfoot>
  </table>
</gestio-table-container>`;

  protected readonly compactCode = `<gestio-table-container label="Équipe" maxHeight="15rem">
  <table gestioTable density="compact" striped>
    …
  </table>
</gestio-table-container>`;

  protected readonly dividersCode = `<table gestioTable columnDividers>
  …
</table>

<!-- Également disponible sur la datagrid -->
<gestio-datagrid columnDividers … />`;

  protected readonly api: ApiRow[] = [
    {
      name: 'density',
      type: `'compact' | 'comfortable'`,
      default: `'comfortable'`,
      description: 'table[gestioTable] : hauteur des lignes.',
    },
    {
      name: 'striped',
      type: 'boolean',
      default: 'false',
      description: 'table[gestioTable] : lignes alternées.',
    },
    {
      name: 'hover',
      type: 'boolean',
      default: 'true',
      description: 'table[gestioTable] : surlignage au survol.',
    },
    {
      name: 'columnDividers',
      type: 'boolean',
      default: 'false',
      description: 'table[gestioTable] : traits verticaux entre les colonnes.',
    },
    {
      name: 'label',
      type: 'string',
      description: 'gestio-table-container : nom de la zone défilante (focalisable au clavier).',
    },
    {
      name: 'maxHeight',
      type: 'string',
      description: 'gestio-table-container : hauteur maximale, en-tête collant.',
    },
  ];
}
