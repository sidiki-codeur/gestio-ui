import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioDataGrid } from './datagrid';
import { GestioDataGridCell } from './datagrid-cell';
import { GestioDataGridColumn, GestioSort } from './datagrid.types';

interface Invoice {
  id: number;
  number: string;
  client: string;
  amount: number;
  paid: boolean;
}

const INVOICES: Invoice[] = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  number: `F-${String(i + 1).padStart(3, '0')}`,
  client: ['Atelier Moreau', 'Électricité Durand', 'Boulangerie Petit'][i % 3],
  amount: ((i * 37) % 100) * 10,
  paid: i % 2 === 0,
}));

@Component({
  imports: [GestioDataGrid, GestioDataGridCell],
  template: `
    <gestio-datagrid
      caption="Factures"
      [columns]="columns"
      [rows]="rows()"
      [loading]="loading()"
      filterable
      selectable
      columnDividers
      [(sort)]="sort"
      [(page)]="page"
      [(selection)]="selection"
    >
      <ng-template gestioCell="paid" [gestioCellOf]="rows()" let-row>
        <span class="status">{{ row.paid ? 'Payée' : 'En attente' }}</span>
      </ng-template>
    </gestio-datagrid>
  `,
})
class Host {
  readonly columns: GestioDataGridColumn<Invoice>[] = [
    { key: 'number', header: 'Numéro', sortable: true },
    { key: 'client', header: 'Client', sortable: true },
    { key: 'amount', header: 'Montant', sortable: true, align: 'end' },
    { key: 'paid', header: 'Statut' },
  ];
  readonly rows = signal<Invoice[]>(INVOICES);
  readonly loading = signal(false);
  readonly sort = signal<GestioSort | null>(null);
  readonly page = signal(0);
  readonly selection = signal<readonly unknown[]>([]);
}

describe('GestioDataGrid', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const settle = () => fixture.whenStable();
    const bodyRows = () => Array.from(el.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
    const column = (index: number) => bodyRows().map((row) => row.cells[index].textContent!.trim());
    const header = (text: string) =>
      Array.from(el.querySelectorAll('th')).find((th) => th.textContent!.includes(text))!;
    return { fixture, host: fixture.componentInstance, el, settle, bodyRows, column, header };
  }

  it('affiche la première page avec caption, en-têtes et gabarit de cellule', async () => {
    const { el, bodyRows, column } = await setup();
    expect(el.querySelector('caption')?.textContent).toContain('Factures');
    expect(el.querySelector('table')?.classList).toContain('gestio-table--column-dividers');
    expect(el.querySelectorAll('thead th[scope="col"]')).toHaveLength(5);
    expect(bodyRows()).toHaveLength(10);
    expect(column(1)[0]).toBe('F-001');
    expect(el.querySelector('.status')?.textContent).toBe('Payée');
    expect(el.querySelector('.gestio-datagrid__range')?.textContent).toContain('1–10 sur 23');
  });

  it('trie croissant, décroissant puis revient à l’ordre initial (aria-sort)', async () => {
    const { host, settle, header, column } = await setup();
    const amount = header('Montant');
    expect(amount.getAttribute('aria-sort')).toBe('none');

    amount.querySelector('button')!.click();
    await settle();
    expect(host.sort()).toEqual({ key: 'amount', direction: 'asc' });
    expect(amount.getAttribute('aria-sort')).toBe('ascending');
    const asc = column(3).map((v) => Number(v.replace(/\s/g, '')));
    expect(asc).toEqual([...asc].sort((a, b) => a - b));

    amount.querySelector('button')!.click();
    await settle();
    expect(amount.getAttribute('aria-sort')).toBe('descending');
    const desc = column(3).map((v) => Number(v.replace(/\s/g, '')));
    expect(desc).toEqual([...desc].sort((a, b) => b - a));

    amount.querySelector('button')!.click();
    await settle();
    expect(host.sort()).toBeNull();
    expect(column(1)[0]).toBe('F-001');
  });

  it('filtre sans tenir compte des accents ni de la casse', async () => {
    const { el, settle, bodyRows, column } = await setup();
    const input = el.querySelector('.gestio-datagrid__toolbar input') as HTMLInputElement;
    input.value = 'electricite';
    input.dispatchEvent(new Event('input'));
    await settle();
    expect(bodyRows()).toHaveLength(8);
    expect(column(2).every((c) => c === 'Électricité Durand')).toBe(true);

    input.value = 'zzz';
    input.dispatchEvent(new Event('input'));
    await settle();
    expect(bodyRows()[0].textContent).toContain('Aucun résultat');
    expect(el.querySelector('.gestio-datagrid__footer')).toBeNull();
  });

  it('pagine avec boutons précédent / suivant bornés', async () => {
    const { host, el, settle, column } = await setup();
    const [prev, next] = Array.from(
      el.querySelectorAll('.gestio-datagrid__pager button'),
    ) as HTMLButtonElement[];
    expect(prev.disabled).toBe(true);
    expect(prev.getAttribute('aria-label')).toBe('Page précédente');

    next.click();
    next.click();
    await settle();
    expect(host.page()).toBe(2);
    expect(column(1)).toEqual(['F-021', 'F-022', 'F-023']);
    expect(next.disabled).toBe(true);
    expect(el.querySelector('.gestio-datagrid__range')?.textContent).toContain('21–23 sur 23');
  });

  it('change le nombre de lignes par page', async () => {
    const { el, settle, bodyRows } = await setup();
    const select = el.querySelector('.gestio-datagrid__page-size select') as HTMLSelectElement;
    const label = el.querySelector('.gestio-datagrid__page-size label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(select.id);
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    await settle();
    expect(bodyRows()).toHaveLength(23);
  });

  it('sélectionne une ligne et toute la page (état indéterminé)', async () => {
    const { host, el, settle } = await setup();
    const boxes = () =>
      Array.from(el.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
    expect(boxes()[1].getAttribute('aria-label')).toBe('Sélectionner F-001');

    boxes()[2].click();
    await settle();
    expect(host.selection()).toEqual([2]);
    expect(boxes()[0].indeterminate).toBe(true);
    expect(el.querySelector('tbody tr.is-selected')).not.toBeNull();

    boxes()[0].click();
    await settle();
    expect(host.selection()).toHaveLength(10);
    expect(boxes()[0].checked).toBe(true);

    boxes()[0].click();
    await settle();
    expect(host.selection()).toEqual([]);
  });

  it('affiche les états chargement et vide', async () => {
    const { host, el, settle, bodyRows } = await setup();
    host.rows.set([]);
    host.loading.set(true);
    await settle();
    expect(el.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
    expect(bodyRows()[0].textContent).toContain('Chargement');

    host.loading.set(false);
    await settle();
    expect(bodyRows()[0].textContent).toContain('Aucune donnée');
    expect(bodyRows()[0].cells[0].getAttribute('colspan')).toBe('5');
  });

  it('annonce le tri dans une région live', async () => {
    const { el, settle, header } = await setup();
    header('Client').querySelector('button')!.click();
    await settle();
    await Promise.resolve();
    await settle();
    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('Client, croissant');
  });
});
