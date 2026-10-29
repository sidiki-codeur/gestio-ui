import { Component, signal } from '@angular/core';
import {
  GestioBarChart,
  GestioChartSeries,
  GestioDonutChart,
  GestioLineChart,
} from '@gestiolabs336/ui/blocks/chart';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioCard } from '@gestiolabs336/ui/card';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-chart-page',
  imports: [
    GestioBarChart,
    GestioLineChart,
    GestioDonutChart,
    GestioCard,
    GestioButton,
    Example,
    ApiTable,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="Graphiques" eyebrow="Blocs">
      <code>gestio-bar-chart</code>, <code>gestio-line-chart</code> et
      <code>gestio-donut-chart</code> dessinent des graphiques SVG sans dépendance pour vos tableaux
      de bord : graduations arrondies, valeurs formatées avec Intl, info-bulle au survol comme au
      clavier, motifs et marqueurs en plus des couleurs, et tableau de données équivalent.
    </sc-page-header>

    <sc-example
      heading="Chiffre d’affaires mensuel"
      description="Barres groupées : comparaison de deux exercices. Tab puis flèches pour parcourir les barres."
      [code]="barCode"
      stacked
    >
      <gestio-card>
        <h3 gestioCardHeader class="sc-chart-title">Chiffre d’affaires mensuel</h3>
        <gestio-bar-chart
          heading="Chiffre d’affaires mensuel, 2025 et 2026"
          [categories]="months"
          [series]="revenue()"
          [valueFormat]="euros"
          [axisFormat]="compactEuros"
        />
      </gestio-card>
      <div class="sc-row">
        <button gestioButton variant="outline" size="sm" (click)="shuffle()">
          Simuler une mise à jour
        </button>
      </div>
    </sc-example>

    <sc-example
      heading="Charges par poste (empilées)"
      description="Avec stacked, les séries s’empilent ; chaque série porte un motif distinct."
      [code]="stackedCode"
    >
      <gestio-card>
        <h3 gestioCardHeader class="sc-chart-title">Charges par trimestre</h3>
        <gestio-bar-chart
          heading="Charges par trimestre et par poste"
          [categories]="['T1', 'T2', 'T3', 'T4']"
          [series]="charges"
          [valueFormat]="euros"
          [axisFormat]="compactEuros"
          stacked
          [height]="240"
        />
      </gestio-card>
    </sc-example>

    <sc-example
      heading="Trésorerie"
      description="Courbes avec aire : réel (trait continu, ronds) et prévision (tirets, carrés). Une valeur null interrompt la courbe."
      [code]="lineCode"
    >
      <gestio-card>
        <h3 gestioCardHeader class="sc-chart-title">Solde de trésorerie</h3>
        <gestio-line-chart
          heading="Solde de trésorerie, réel et prévisionnel"
          [categories]="months"
          [series]="cash"
          [valueFormat]="euros"
          [axisFormat]="compactEuros"
          area
        />
      </gestio-card>
    </sc-example>

    <sc-example
      heading="Répartition des dépenses"
      description="Anneau avec total au centre ; la légende donne valeurs et parts."
      [code]="donutCode"
    >
      <gestio-card>
        <h3 gestioCardHeader class="sc-chart-title">Dépenses d’octobre</h3>
        <gestio-donut-chart
          heading="Répartition des dépenses d’octobre"
          [categories]="['Salaires', 'Loyers', 'Logiciels', 'Déplacements', 'Divers']"
          [values]="[18400, 4200, 1350, 980, 610]"
          [valueFormat]="euros"
        />
      </gestio-card>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées communes" [rows]="commonApi" />
      <sc-api-table
        caption="Entrées de gestio-bar-chart et gestio-line-chart"
        [rows]="cartesianApi"
      />
      <sc-api-table caption="Entrées de gestio-donut-chart" [rows]="donutApi" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Le dessin est une image (<code>role="img"</code>) nommée par <code>heading</code> et
          décrite par un résumé. Les points forment un groupe à tabulation unique : flèches gauche
          et droite entre catégories, haut et bas entre séries, Échap masque l’info-bulle. Un
          tableau équivalent est lu par les lecteurs d’écran et s’affiche avec « Afficher le tableau
          ». Les couleurs proviennent des jetons <code>--gestio-chart-1</code> à
          <code>--gestio-chart-8</code> (repli sur les couleurs sémantiques).
        </p>
      </div>
    </section>
  `,
  styles: `
    .sc-chart-title {
      margin: 0;
      font-size: var(--gestio-font-size-lg);
    }
  `,
})
export class ChartPage {
  protected readonly months = [
    'Janv.',
    'Févr.',
    'Mars',
    'Avr.',
    'Mai',
    'Juin',
    'Juil.',
    'Août',
    'Sept.',
    'Oct.',
    'Nov.',
    'Déc.',
  ];
  protected readonly euros: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  };
  protected readonly compactEuros: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
  };

  protected readonly revenue = signal<GestioChartSeries[]>([
    {
      name: '2025',
      data: [32100, 35400, 31800, 40200, 44900, 41800, 38200, 29400, 43100, 46800, 48900, 52300],
    },
    {
      name: '2026',
      data: [35800, 38900, 41200, 43800, 47500, 49100, 45200, 33900, 48700, 51400, null, null],
    },
  ]);

  protected readonly charges: GestioChartSeries[] = [
    { name: 'Salaires', data: [54000, 55200, 56100, 58300] },
    { name: 'Locaux', data: [12600, 12600, 12900, 12900] },
    { name: 'Marketing', data: [6400, 9800, 4200, 11500] },
  ];

  protected readonly cash: GestioChartSeries[] = [
    {
      name: 'Réel',
      data: [84000, 91500, 88200, 97400, 104800, 99100, 95300, 89800, 102600, 110400, null, null],
    },
    {
      name: 'Prévision',
      data: [
        82000, 88000, 92000, 95000, 100000, 101000, 97000, 92000, 100000, 106000, 112000, 118000,
      ],
    },
  ];

  protected shuffle(): void {
    this.revenue.update((series) =>
      series.map((s) => ({
        ...s,
        data: s.data.map((v) => (v === null ? null : Math.round(v * (0.85 + Math.random() * 0.3)))),
      })),
    );
  }

  protected readonly barCode = `<gestio-bar-chart
  heading="Chiffre d’affaires mensuel, 2025 et 2026"
  [categories]="['Janv.', 'Févr.', 'Mars', …]"
  [series]="[
    { name: '2025', data: [32100, 35400, 31800, …] },
    { name: '2026', data: [35800, 38900, 41200, …] },
  ]"
  [valueFormat]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
  [axisFormat]="{ style: 'currency', currency: 'EUR', notation: 'compact' }"
/>`;

  protected readonly stackedCode = `<gestio-bar-chart heading="Charges par trimestre" [categories]="trimestres" [series]="postes" stacked [height]="240" />`;

  protected readonly lineCode = `<gestio-line-chart
  heading="Solde de trésorerie"
  [categories]="mois"
  [series]="[{ name: 'Réel', data: reel }, { name: 'Prévision', data: prevision }]"
  [valueFormat]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
  area
/>`;

  protected readonly donutCode = `<gestio-donut-chart
  heading="Répartition des dépenses"
  [categories]="['Salaires', 'Loyers', 'Logiciels', 'Déplacements', 'Divers']"
  [values]="[18400, 4200, 1350, 980, 610]"
  [valueFormat]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
/>`;

  protected readonly commonApi: ApiRow[] = [
    {
      name: 'heading',
      type: 'string',
      description: 'Titre (obligatoire) : nom de l’image et légende du tableau.',
    },
    { name: 'description', type: 'string', description: 'Texte lu avant le résumé automatique.' },
    {
      name: 'valueFormat',
      type: 'Intl.NumberFormatOptions',
      default: '{}',
      description: 'Format des valeurs.',
    },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Langue de formatage.' },
    { name: 'legend', type: 'boolean', default: 'true', description: 'Affiche la légende.' },
    {
      name: 'tableToggle',
      type: 'boolean',
      default: 'true',
      description: 'Bouton « Afficher le tableau ».',
    },
    {
      name: 'labels',
      type: 'Partial<GestioChartLabels>',
      default: '{}',
      description: 'Textes (résumés, info-bulles, tableau).',
    },
  ];

  protected readonly cartesianApi: ApiRow[] = [
    { name: 'categories', type: 'readonly string[]', description: 'Libellés de l’axe horizontal.' },
    {
      name: 'series',
      type: 'readonly GestioChartSeries[]',
      description: '{ name, data, color? } ; null = valeur absente.',
    },
    {
      name: 'height',
      type: 'number',
      default: '280',
      description: 'Hauteur en px ; la largeur suit le conteneur.',
    },
    { name: 'grid', type: 'boolean', default: 'true', description: 'Lignes de repère.' },
    {
      name: 'axisFormat',
      type: 'Intl.NumberFormatOptions | null',
      default: 'null',
      description: 'Format des graduations (sinon valueFormat).',
    },
    {
      name: 'stacked',
      type: 'boolean',
      default: 'false',
      description: 'Barres : empile les séries.',
    },
    {
      name: 'patterns',
      type: 'boolean',
      default: 'true',
      description: 'Barres : motif par série.',
    },
    { name: 'area', type: 'boolean', default: 'false', description: 'Courbes : remplit l’aire.' },
    {
      name: 'markers',
      type: 'boolean',
      default: 'true',
      description: 'Courbes : marqueur sur chaque point.',
    },
    {
      name: 'beginAtZero',
      type: 'boolean',
      default: 'true',
      description: 'Courbes : axe à partir de zéro.',
    },
  ];

  protected readonly donutApi: ApiRow[] = [
    { name: 'categories', type: 'readonly string[]', description: 'Nom de chaque part.' },
    {
      name: 'values',
      type: 'readonly (number | null)[]',
      description: 'Valeurs (négatives et null comptent pour zéro).',
    },
    {
      name: 'colors',
      type: 'readonly (string | undefined)[]',
      default: '[]',
      description: 'Couleurs CSS par part.',
    },
    { name: 'size', type: 'number', default: '240', description: 'Diamètre maximal en px.' },
    {
      name: 'thickness',
      type: 'number',
      default: '0.38',
      description: 'Épaisseur (fraction du rayon ; 1 = camembert).',
    },
    { name: 'showTotal', type: 'boolean', default: 'true', description: 'Total au centre.' },
    { name: 'patterns', type: 'boolean', default: 'true', description: 'Motif par part.' },
  ];
}
