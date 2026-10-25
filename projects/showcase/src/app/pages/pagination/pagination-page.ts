import { Component, computed, signal } from '@angular/core';
import { GESTIO_CARD_IMPORTS } from '@gestiolabs336/ui/card';
import { GestioGrid } from '@gestiolabs336/ui/layout';
import { GestioPagination } from '@gestiolabs336/ui/pagination';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

interface Client {
  readonly id: number;
  readonly name: string;
  readonly city: string;
}

const CITIES = ['Lyon', 'Dakar', 'Abidjan', 'Nantes', 'Lomé', 'Bordeaux'];
const CLIENTS: readonly Client[] = Array.from({ length: 87 }, (_, i) => ({
  id: i + 1,
  name: `Client ${String(i + 1).padStart(3, '0')}`,
  city: CITIES[i % CITIES.length],
}));

@Component({
  selector: 'sc-pagination-page',
  imports: [GestioPagination, GESTIO_CARD_IMPORTS, GestioGrid, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Pagination" eyebrow="Composants">
      Pour une liste, une grille de cartes ou un tableau paginé côté serveur. Les pages sont des
      boutons dans un <code>&lt;nav&gt;</code> ; la page courante porte
      <code>aria-current="page"</code> et chaque changement est annoncé.
    </sc-page-header>

    <sc-example
      heading="Grille de cartes"
      description="page commence à 0 ; changer la taille ramène à la première page."
      [code]="cardsCode"
      stacked
    >
      <gestio-grid minItemWidth="11rem" [gap]="3">
        @for (client of visible(); track client.id) {
          <gestio-card padding="sm">
            <p class="sc-card-title">{{ client.name }}</p>
            <p class="sc-muted">{{ client.city }}</p>
          </gestio-card>
        }
      </gestio-grid>
      <gestio-pagination
        ariaLabel="Pages des clients"
        [total]="clients.length"
        [(page)]="page"
        [(pageSize)]="pageSize"
        [pageSizeOptions]="[6, 12, 24]"
      />
    </sc-example>

    <sc-example
      heading="Mode compact, sans sélecteur"
      description="Utilisé par la datagrid ; adapté aux espaces étroits."
      [code]="compactCode"
      stacked
    >
      <gestio-pagination
        mode="compact"
        [total]="230"
        [showPageSize]="false"
        [(page)]="compactPage"
      />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de la pagination" [rows]="api" />
    </section>
  `,
})
export class PaginationPage {
  protected readonly clients = CLIENTS;
  protected readonly page = signal(0);
  protected readonly pageSize = signal(6);
  protected readonly compactPage = signal(4);

  protected readonly visible = computed(() => {
    const start = this.page() * this.pageSize();
    return this.clients.slice(start, start + this.pageSize());
  });

  protected readonly cardsCode = `<gestio-pagination [total]="clients.length" [(page)]="page" [(pageSize)]="pageSize"
  [pageSizeOptions]="[6, 12, 24]" />

visible = computed(() => {
  const start = this.page() * this.pageSize();
  return this.clients.slice(start, start + this.pageSize());
});

// imports: [GestioPagination]`;

  protected readonly compactCode = `<gestio-pagination ariaLabel="Pages des écritures" mode="compact" [total]="230" [showPageSize]="false" [(page)]="page" />`;

  protected readonly api: ApiRow[] = [
    { name: 'total', type: 'number', description: 'Nombre total d’éléments (requis).' },
    { name: 'page', type: 'model<number>', default: '0', description: 'Page courante, base 0.' },
    { name: 'pageSize', type: 'model<number>', default: '10', description: 'Éléments par page.' },
    {
      name: 'pageSizeOptions',
      type: 'readonly number[]',
      default: '[10, 25, 50]',
      description: 'Choix de taille.',
    },
    {
      name: 'showPageSize, showRange',
      type: 'boolean',
      default: 'true',
      description: 'Sélecteur de taille et plage « 1–10 sur 230 ».',
    },
    {
      name: 'mode',
      type: "'pages' | 'compact'",
      default: "'pages'",
      description: 'Numéros de page ou « 3 / 12 ».',
    },
    {
      name: 'siblingCount',
      type: 'number',
      default: '1',
      description: 'Pages autour de la page courante.',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "'Pagination'",
      description: 'Nom de la navigation, unique dans la page.',
    },
    {
      name: 'labels',
      type: 'Partial<GestioPaginationLabels>',
      default: '{}',
      description: 'Libellés (internationalisation).',
    },
  ];
}
