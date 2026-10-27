import { Component, signal } from '@angular/core';
import { GestioStatCard } from '@gestiolabs336/ui/blocks/stat-card';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-stat-card-page',
  imports: [GestioStatCard, GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Carte statistique" eyebrow="Blocs">
      <code>gestio-stat-card</code> présente un indicateur clé : valeur formatée, variation avec
      flèche et texte lu par les lecteurs d’écran, comparaison et mini-courbe de tendance.
    </sc-page-header>

    <sc-example
      heading="Tableau de bord commercial"
      description="Valeurs monétaires, nombres et pourcentages formatés avec Intl."
      [code]="dashboardCode"
    >
      <div class="sc-grid">
        <gestio-stat-card
          label="Chiffre d’affaires"
          [value]="48250"
          [valueFormat]="euros"
          [delta]="12.5"
          comparison="vs mois dernier"
          [trend]="[32100, 35400, 31800, 40200, 44900, 48250]"
        >
          <svg gestioStatCardIcon viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
            <path
              d="M3 15.5 8 10l3 3 6-7"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </gestio-stat-card>
        <gestio-stat-card
          label="Nouveaux clients"
          [value]="128"
          [delta]="-3.2"
          comparison="vs mois dernier"
          [trend]="[140, 152, 133, 139, 132, 128]"
        />
        <gestio-stat-card
          label="Taux de conversion"
          [value]="0.043"
          [valueFormat]="percent"
          [delta]="0"
          comparison="vs mois dernier"
        />
      </div>
    </sc-example>

    <sc-example
      heading="Baisse favorable"
      description="Avec invertDelta, une baisse s’affiche en vert : utile pour un délai, un coût ou un taux d’attrition."
      [code]="invertCode"
    >
      <div class="sc-grid">
        <gestio-stat-card
          label="Délai moyen de paiement"
          value="32 j"
          [delta]="-8"
          invertDelta
          comparison="vs trimestre précédent"
          [trend]="[41, 39, 37, 35, 34, 32]"
        />
        <gestio-stat-card
          label="Factures impayées"
          [value]="7"
          [delta]="16.7"
          invertDelta
          comparison="vs semaine dernière"
        />
      </div>
    </sc-example>

    <sc-example heading="Chargement" [code]="loadingCode" stacked>
      <div class="sc-grid">
        <gestio-stat-card
          label="Panier moyen"
          [loading]="loading()"
          [value]="86.4"
          [valueFormat]="euros"
          [delta]="4.1"
          comparison="vs mois dernier"
        />
      </div>
      <div class="sc-row">
        <button gestioButton variant="outline" size="sm" (click)="loading.set(!loading())">
          {{ loading() ? 'Afficher la valeur' : 'Simuler un chargement' }}
        </button>
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-stat-card" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          La carte est un groupe nommé par son libellé. La couleur de la variation n’est jamais
          seule porteuse d’information : une flèche et un texte (« En hausse de 12,5 % »)
          l’accompagnent. La courbe est décorative et résumée par un texte masqué.
        </p>
      </div>
    </section>
  `,
})
export class StatCardPage {
  protected readonly loading = signal(true);
  protected readonly euros: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  };
  protected readonly percent: Intl.NumberFormatOptions = {
    style: 'percent',
    maximumFractionDigits: 1,
  };

  protected readonly dashboardCode = `<gestio-stat-card
  label="Chiffre d’affaires"
  [value]="48250"
  [valueFormat]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
  [delta]="12.5"
  comparison="vs mois dernier"
  [trend]="[32100, 35400, 31800, 40200, 44900, 48250]"
>
  <svg gestioStatCardIcon aria-hidden="true">…</svg>
</gestio-stat-card>

<gestio-stat-card label="Nouveaux clients" [value]="128" [delta]="-3.2" comparison="vs mois dernier" />`;

  protected readonly invertCode = `<gestio-stat-card
  label="Délai moyen de paiement"
  value="32 j"
  [delta]="-8"
  invertDelta
  comparison="vs trimestre précédent"
/>`;

  protected readonly loadingCode = `<gestio-stat-card label="Panier moyen" [loading]="stats.isLoading()" [value]="stats.value()?.average" />`;

  protected readonly api: ApiRow[] = [
    { name: 'label', type: 'string', description: 'Intitulé (obligatoire) ; nomme le groupe.' },
    {
      name: 'value',
      type: 'number | string | null',
      default: 'null',
      description: 'Nombre formaté avec Intl, chaîne affichée telle quelle, null = « — ».',
    },
    {
      name: 'valueFormat',
      type: 'Intl.NumberFormatOptions',
      default: '{}',
      description: 'Devise, pourcentage, unité…',
    },
    {
      name: 'delta',
      type: 'number | null',
      default: 'null',
      description: 'Variation en pourcentage (12.5 = +12,5 %).',
    },
    {
      name: 'invertDelta',
      type: 'boolean',
      default: 'false',
      description: 'Une baisse est une bonne nouvelle.',
    },
    { name: 'comparison', type: 'string', description: 'Texte après la variation.' },
    {
      name: 'trend',
      type: 'readonly number[]',
      default: '[]',
      description: 'Série de la mini-courbe (2 points minimum).',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Squelette à la place de la valeur.',
    },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Langue de formatage.' },
    {
      name: 'labels',
      type: 'Partial<GestioStatCardLabels>',
      default: '{}',
      description: 'Textes annoncés (hausse, baisse, stable, tendance, chargement).',
    },
  ];
}
