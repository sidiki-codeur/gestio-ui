import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  GestioBadge,
  GestioButton,
  GestioCheckbox,
  GestioDataGrid,
  GestioDataGridCell,
  GestioDataGridColumn,
  GestioSort,
  GestioToastService,
} from '@gestiolabs/ui';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

type InvoiceStatus = 'paid' | 'pending' | 'late' | 'draft';

interface Invoice {
  id: number;
  number: string;
  client: string;
  date: Date;
  amount: number;
  status: InvoiceStatus;
}

const CLIENTS = [
  'Atelier Moreau SARL',
  'Électricité Durand',
  'Boulangerie Petit',
  'Cabinet Haddad',
  'Garage Leroy & Fils',
  'Imprimerie Benali',
  'Ébénisterie Rousseau',
];
const STATUSES: InvoiceStatus[] = ['paid', 'paid', 'pending', 'late', 'paid', 'draft', 'pending'];

/** Jeu de données déterministe (aucun aléa : rendu identique à chaque visite). */
function buildInvoices(): Invoice[] {
  return Array.from({ length: 47 }, (_, i) => ({
    id: i + 1,
    number: `F-2024-${String(118 - i).padStart(3, '0')}`,
    client: CLIENTS[(i * 3) % CLIENTS.length],
    date: new Date(2024, 9, 28 - (i % 28), 9),
    amount: Math.round(((i * 7919) % 4800) + 120) + ((i * 37) % 100) / 100,
    status: STATUSES[i % STATUSES.length],
  }));
}

@Component({
  selector: 'sc-datagrid-page',
  imports: [
    GestioDataGrid,
    GestioDataGridCell,
    GestioBadge,
    GestioButton,
    GestioCheckbox,
    Example,
    ApiTable,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="Datagrid" eyebrow="Composants">
      <code>gestio-datagrid</code> affiche des données à partir d’une définition de colonnes : tri,
      recherche, pagination, sélection et gabarits de cellule, côté client. Le rendu reste un
      <code>&lt;table&gt;</code> natif.
    </sc-page-header>

    <sc-example
      heading="Suivi des factures"
      description="Triez les colonnes, filtrez (insensible aux accents), sélectionnez des lignes puis exportez."
      [code]="mainCode"
      stacked
    >
      <gestio-checkbox label="Séparateurs de colonnes" [(checked)]="dividers" />
      <gestio-datagrid
        caption="Factures"
        [columns]="columns"
        [rows]="invoices()"
        [rowLabel]="rowLabel"
        [loading]="loading()"
        filterable
        selectable
        [columnDividers]="dividers()"
        [(sort)]="sort"
        [(selection)]="selection"
      >
        <div gestioDataGridActions class="sc-row">
          <button gestioButton variant="outline" size="sm" (click)="reload()">Recharger</button>
          <button
            gestioButton
            size="sm"
            [disabled]="!selection().length"
            (click)="exportSelection()"
          >
            Exporter ({{ selection().length }})
          </button>
        </div>
        <ng-template gestioCell="status" [gestioCellOf]="invoices()" let-row>
          <gestio-badge [variant]="statusVariant[row.status]" size="sm" dot>
            {{ statusLabel[row.status] }}
          </gestio-badge>
        </ng-template>
        <ng-template gestioCell="number" [gestioCellOf]="invoices()" let-row>
          <a class="sc-grid-link" [href]="'#' + row.number" (click)="open($event, row)">{{
            row.number
          }}</a>
        </ng-template>
      </gestio-datagrid>
      <p class="sc-result" aria-live="polite">
        Tri :
        <strong>{{ sort() ? sort()!.key + ' (' + sort()!.direction + ')' : 'aucun' }}</strong> ·
        Sélection : <strong>{{ selection().length }}</strong> facture(s)
      </p>
    </sc-example>

    <sc-example heading="Compacte, sans pagination, état vide" [code]="compactCode" stacked>
      <gestio-datagrid
        caption="Relances prévues"
        [columns]="reminderColumns"
        [rows]="[]"
        [paginated]="false"
        density="compact"
        [labels]="{ empty: 'Aucune relance prévue cette semaine.' }"
      />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-datagrid" [rows]="api" />
      <h3>Colonne <code>GestioDataGridColumn&lt;T&gt;</code></h3>
      <sc-api-table caption="Propriétés d’une colonne" [rows]="columnApi" />
      <div class="sc-note sc-note--warning" role="note">
        <strong>Limites</strong>
        <p>
          Traitements côté client uniquement (pour une pagination serveur :
          <code>[paginated]="false"</code>
          et pagination gérée par l’application). Pas de navigation cellule par cellule (motif ARIA
          grid), d’édition en ligne, de colonnes redimensionnables ni de défilement virtuel.
        </p>
      </div>
    </section>
  `,
  styles: `
    .sc-grid-link {
      font-weight: 500;
    }
  `,
})
export class DataGridPage {
  private readonly toast = inject(GestioToastService);
  private readonly euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly invoices = signal<Invoice[]>(buildInvoices());
  protected readonly loading = signal(false);
  protected readonly sort = signal<GestioSort | null>({ key: 'date', direction: 'desc' });
  protected readonly selection = signal<readonly unknown[]>([]);
  protected readonly dividers = signal(false);

  protected readonly statusLabel: Record<InvoiceStatus, string> = {
    paid: 'Payée',
    pending: 'En attente',
    late: 'En retard',
    draft: 'Brouillon',
  };
  protected readonly statusVariant = {
    paid: 'success',
    pending: 'info',
    late: 'danger',
    draft: 'neutral',
  } as const;

  protected readonly columns: GestioDataGridColumn<Invoice>[] = [
    { key: 'number', header: 'Numéro', sortable: true, width: '9rem' },
    { key: 'client', header: 'Client', sortable: true },
    { key: 'date', header: 'Date', sortable: true, width: '8rem' },
    {
      key: 'amount',
      header: 'Montant TTC',
      sortable: true,
      align: 'end',
      format: (row) => this.euros.format(row.amount),
    },
    {
      key: 'status',
      header: 'Statut',
      sortable: true,
      value: (row) => this.statusLabel[row.status],
    },
  ];

  protected readonly reminderColumns: GestioDataGridColumn<{ id: number; client: string }>[] = [
    { key: 'client', header: 'Client' },
    { key: 'due', header: 'Échéance' },
  ];

  protected readonly rowLabel = (row: Invoice) => `la facture ${row.number}`;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected reload(): void {
    this.loading.set(true);
    this.invoices.set([]);
    this.timer = setTimeout(() => {
      this.invoices.set(buildInvoices());
      this.loading.set(false);
    }, 1200);
  }

  protected exportSelection(): void {
    this.toast.success(`${this.selection().length} facture(s) exportée(s) au format CSV.`, {
      title: 'Export terminé',
    });
  }

  protected open(event: Event, row: Invoice): void {
    event.preventDefault();
    this.toast.info(`${row.client} — ${this.euros.format(row.amount)}`, {
      title: `Facture ${row.number}`,
    });
  }

  protected readonly mainCode = `// imports: [GestioDataGrid, GestioDataGridCell, GestioBadge, GestioButton]
columns: GestioDataGridColumn<Invoice>[] = [
  { key: 'number', header: 'Numéro', sortable: true, width: '9rem' },
  { key: 'client', header: 'Client', sortable: true },
  { key: 'date', header: 'Date', sortable: true },          // Date → formatée en fr-FR
  { key: 'amount', header: 'Montant TTC', sortable: true, align: 'end',
    format: (row) => this.euros.format(row.amount) },     // tri sur le nombre, affichage en €
  { key: 'status', header: 'Statut', sortable: true,
    value: (row) => this.statusLabel[row.status] },      // tri et recherche sur le libellé
];
sort = signal<GestioSort | null>({ key: 'date', direction: 'desc' });
selection = signal<readonly unknown[]>([]);               // clés row.id

<gestio-datagrid caption="Factures" [columns]="columns" [rows]="invoices()"
  [columnDividers]="dividers()"
  [rowLabel]="rowLabel" [loading]="loading()" filterable selectable
  [(sort)]="sort" [(selection)]="selection">
  <div gestioDataGridActions>
    <button gestioButton size="sm" [disabled]="!selection().length" (click)="exportSelection()">
      Exporter ({{ selection().length }})
    </button>
  </div>
  <ng-template gestioCell="status" [gestioCellOf]="invoices()" let-row>
    <gestio-badge [variant]="statusVariant[row.status]" size="sm" dot>
      {{ statusLabel[row.status] }}
    </gestio-badge>
  </ng-template>
</gestio-datagrid>`;

  protected readonly compactCode = `<gestio-datagrid
  caption="Relances prévues"
  [columns]="reminderColumns"
  [rows]="reminders()"
  [paginated]="false"
  density="compact"
  [labels]="{ empty: 'Aucune relance prévue cette semaine.' }"
/>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'columns',
      type: 'readonly GestioDataGridColumn<T>[]',
      description: 'Colonnes (requis).',
    },
    { name: 'rows', type: 'readonly T[]', description: 'Données (requis).' },
    {
      name: 'rowKey',
      type: '(row: T) => unknown',
      default: 'row.id',
      description: 'Clé stable ; index si absente.',
    },
    { name: 'caption', type: 'string', description: 'Titre du tableau et de la zone défilante.' },
    { name: 'showCaption', type: 'boolean', default: 'false', description: 'Affiche la caption.' },
    {
      name: 'sort',
      type: 'model<GestioSort | null>',
      default: 'null',
      description: 'Tri ; [(sort)].',
    },
    { name: 'filterable', type: 'boolean', default: 'false', description: 'Champ de recherche.' },
    {
      name: 'filter',
      type: 'model<string>',
      default: `''`,
      description: 'Recherche ; [(filter)].',
    },
    { name: 'paginated', type: 'boolean', default: 'true', description: 'Pagination.' },
    {
      name: 'page, pageSize',
      type: 'model<number>',
      default: '0, 10',
      description: 'Page et taille ; [(page)], [(pageSize)].',
    },
    {
      name: 'pageSizeOptions',
      type: 'readonly number[]',
      default: '[10, 25, 50]',
      description: 'Tailles proposées.',
    },
    {
      name: 'selectable',
      type: 'boolean',
      default: 'false',
      description: 'Colonne de cases à cocher.',
    },
    {
      name: 'selection',
      type: 'model<readonly unknown[]>',
      default: '[]',
      description: 'Clés sélectionnées ; [(selection)].',
    },
    {
      name: 'rowLabel',
      type: '(row: T) => string',
      description: 'Nom accessible de la case d’une ligne.',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'État de chargement (aria-busy).',
    },
    {
      name: 'density',
      type: `'compact' | 'comfortable'`,
      default: `'comfortable'`,
      description: 'Hauteur des lignes.',
    },
    { name: 'striped', type: 'boolean', default: 'false', description: 'Lignes alternées.' },
    {
      name: 'columnDividers',
      type: 'boolean',
      default: 'false',
      description: 'Traits verticaux entre les colonnes.',
    },
    {
      name: 'labels',
      type: 'Partial<GestioDataGridLabels>',
      default: '{}',
      description: 'Libellés (i18n).',
    },
    {
      name: 'ng-template[gestioCell]',
      type: 'gestioCell, gestioCellOf',
      description: 'Gabarit de colonne ; let-row, let-value="value".',
    },
    { name: '[gestioDataGridActions]', type: 'zone', description: 'Actions de la barre d’outils.' },
  ];

  protected readonly columnApi: ApiRow[] = [
    { name: 'key', type: 'string', description: 'Identifiant ; valeur lue par défaut : row[key].' },
    { name: 'header', type: 'string', description: 'Libellé de l’en-tête.' },
    {
      name: 'value',
      type: '(row) => GestioCellValue',
      description: 'Valeur de tri et de recherche.',
    },
    { name: 'format', type: '(row) => string', description: 'Texte affiché.' },
    {
      name: 'sortable',
      type: 'boolean',
      default: 'false',
      description: 'Tri au clic sur l’en-tête.',
    },
    {
      name: 'align',
      type: `'start' | 'center' | 'end'`,
      default: `'start'`,
      description: 'Alignement.',
    },
    { name: 'width', type: 'string', description: 'Largeur CSS.' },
  ];
}
