import { Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GESTIO_SEGMENTED_CONTROL_IMPORTS } from '@gestiolabs336/ui/segmented-control';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

type Period = 'day' | 'week' | 'month' | 'year';
type InvoiceStatus = 'all' | 'draft' | 'sent' | 'paid' | 'late';

const REVENUE: Record<Period, string> = {
  day: '1 240 €',
  week: '9 870 €',
  month: '48 250 €',
  year: '512 400 €',
};

@Component({
  selector: 'sc-segmented-control-page',
  imports: [GESTIO_SEGMENTED_CONTROL_IMPORTS, ReactiveFormsModule, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Contrôle segmenté" eyebrow="Composants">
      <code>gestio-segmented-control</code> propose un choix unique parmi quelques options affichées
      côte à côte. Il suit le motif ARIA « Radio Group » : un seul arrêt de tabulation, les flèches
      déplacent le focus et sélectionnent, <kbd>Début</kbd> et <kbd>Fin</kbd> vont aux extrémités.
    </sc-page-header>

    <sc-example
      heading="Période d’un tableau de bord"
      description="Liaison bidirectionnelle [(value)]."
      [code]="periodCode"
      stacked
    >
      <gestio-segmented-control ariaLabel="Période" [(value)]="period">
        <gestio-segment value="day" label="Jour" />
        <gestio-segment value="week" label="Semaine" />
        <gestio-segment value="month" label="Mois" />
        <gestio-segment value="year" label="Année" />
      </gestio-segmented-control>
      <p class="sc-result" aria-live="polite">
        Chiffre d’affaires : <strong>{{ revenue() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Icônes et tailles"
      description="Un segment sans texte visible reçoit ariaLabel."
      [code]="iconsCode"
      stacked
    >
      <div class="sc-row">
        <gestio-segmented-control ariaLabel="Affichage des clients" size="sm" [(value)]="layout">
          <gestio-segment value="list" ariaLabel="Liste">
            <svg gestioSegmentIcon viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path
                d="M2 4h12M2 8h12M2 12h12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </gestio-segment>
          <gestio-segment value="grid" ariaLabel="Grille">
            <svg gestioSegmentIcon viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path
                d="M2.5 2.5h4v4h-4zM9.5 2.5h4v4h-4zM2.5 9.5h4v4h-4zM9.5 9.5h4v4h-4z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
          </gestio-segment>
        </gestio-segmented-control>

        <gestio-segmented-control ariaLabel="Devise" size="lg" [(value)]="currency">
          <gestio-segment value="EUR">
            <span gestioSegmentIcon aria-hidden="true">€</span>
            Euro
          </gestio-segment>
          <gestio-segment value="USD">
            <span gestioSegmentIcon aria-hidden="true">$</span>
            Dollar
          </gestio-segment>
        </gestio-segmented-control>
      </div>
      <p class="sc-result" aria-live="polite">
        Affichage : <strong>{{ layout() === 'list' ? 'liste' : 'grille' }}</strong> · Devise :
        <strong>{{ currency() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Pleine largeur avec Reactive Forms"
      description="Les segments se partagent la largeur ; « En retard » est désactivé et ignoré au clavier."
      [code]="formCode"
      stacked
    >
      <p id="status-filter-label" class="sc-muted" style="margin: 0">Statut des factures</p>
      <gestio-segmented-control
        ariaLabelledby="status-filter-label"
        fullWidth
        [formControl]="status"
      >
        <gestio-segment value="all" label="Toutes" />
        <gestio-segment value="draft" label="Brouillons" />
        <gestio-segment value="sent" label="Envoyées" />
        <gestio-segment value="paid" label="Payées" />
        <gestio-segment value="late" label="En retard" disabled />
      </gestio-segmented-control>
      <p class="sc-result" aria-live="polite">
        Valeur du contrôle : <strong>{{ statusValue() }}</strong>
      </p>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table
        caption="Entrées et sorties de gestio-segmented-control et gestio-segment"
        [rows]="api"
      />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Pour plus de cinq options ou des libellés longs, préférez un groupe de boutons radio ou
          une liste déroulante. Pour afficher des panneaux différents, utilisez des onglets.
        </p>
      </div>
    </section>
  `,
})
export class SegmentedControlPage {
  protected readonly period = signal<Period | null>('month');
  protected readonly revenue = computed(() => {
    const period = this.period();
    return period ? REVENUE[period] : '—';
  });

  protected readonly layout = signal<'list' | 'grid' | null>('list');
  protected readonly currency = signal<string | null>('EUR');

  protected readonly status = new FormControl<InvoiceStatus>('all', { nonNullable: true });
  protected readonly statusValue = signal<InvoiceStatus>(this.status.value);

  constructor() {
    this.status.valueChanges.subscribe((value) => this.statusValue.set(value));
  }

  protected readonly periodCode = `<gestio-segmented-control ariaLabel="Période" [(value)]="period">
  <gestio-segment value="day" label="Jour" />
  <gestio-segment value="week" label="Semaine" />
  <gestio-segment value="month" label="Mois" />
  <gestio-segment value="year" label="Année" />
</gestio-segmented-control>`;

  protected readonly iconsCode = `<gestio-segmented-control ariaLabel="Affichage des clients" size="sm" [(value)]="layout">
  <gestio-segment value="list" ariaLabel="Liste">
    <svg gestioSegmentIcon aria-hidden="true">…</svg>
  </gestio-segment>
  <gestio-segment value="grid" ariaLabel="Grille">
    <svg gestioSegmentIcon aria-hidden="true">…</svg>
  </gestio-segment>
</gestio-segmented-control>

<gestio-segmented-control ariaLabel="Devise" size="lg" [(value)]="currency">
  <gestio-segment value="EUR"><span gestioSegmentIcon aria-hidden="true">€</span> Euro</gestio-segment>
  <gestio-segment value="USD"><span gestioSegmentIcon aria-hidden="true">$</span> Dollar</gestio-segment>
</gestio-segmented-control>`;

  protected readonly formCode = `<p id="status-filter-label">Statut des factures</p>
<gestio-segmented-control ariaLabelledby="status-filter-label" fullWidth [formControl]="status">
  <gestio-segment value="all" label="Toutes" />
  <gestio-segment value="draft" label="Brouillons" />
  <gestio-segment value="sent" label="Envoyées" />
  <gestio-segment value="paid" label="Payées" />
  <gestio-segment value="late" label="En retard" disabled />
</gestio-segmented-control>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'value',
      type: 'model<T | null>',
      default: 'null',
      description: 'Valeur sélectionnée ; [(value)] ou (valueChange) hors formulaire.',
    },
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible du groupe.' },
    {
      name: 'ariaLabelledby',
      type: 'string',
      description: 'Identifiant d’un libellé visible externe.',
    },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Taille.' },
    {
      name: 'fullWidth',
      type: 'boolean',
      default: 'false',
      description: 'Toute la largeur, segments de largeur égale.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Désactive tout le groupe.',
    },
    {
      name: 'gestio-segment · value',
      type: 'unknown',
      description: 'Valeur transmise au groupe (comparaison Object.is).',
    },
    {
      name: 'gestio-segment · label',
      type: 'string',
      description: 'Libellé (sinon contenu projeté).',
    },
    {
      name: 'gestio-segment · ariaLabel',
      type: 'string',
      description: 'Nom accessible d’un segment à icône seule.',
    },
    {
      name: 'gestio-segment · disabled',
      type: 'boolean',
      default: 'false',
      description: 'Segment non sélectionnable, ignoré par les flèches.',
    },
  ];
}
