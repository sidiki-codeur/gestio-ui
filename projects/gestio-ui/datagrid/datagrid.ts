import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  booleanAttribute,
  computed,
  contentChildren,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GestioCheckbox } from '@gestiolabs336/ui/checkbox';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioInput } from '@gestiolabs336/ui/input';
import { GestioPagination, GestioPaginationLabels } from '@gestiolabs336/ui/pagination';
import { GestioTable, GestioTableDensity } from '@gestiolabs336/ui/table';
import { GestioDataGridCell } from './datagrid-cell';
import {
  GESTIO_DATAGRID_LABELS,
  GestioCellValue,
  GestioDataGridColumn,
  GestioDataGridLabels,
  GestioSort,
} from './datagrid.types';

interface GridRow<T> {
  readonly row: T;
  readonly key: unknown;
}

const collator = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' });
const numberFormat = new Intl.NumberFormat('fr-FR');
const dateFormat = new Intl.DateTimeFormat('fr-FR');

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function compareValues(a: GestioCellValue, b: GestioCellValue): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return collator.compare(String(a), String(b));
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/**
 * Grille de données pilotée par les données : tri, filtre, pagination,
 * sélection et gabarits de cellule, côté client.
 *
 * ```html
 * <gestio-datagrid caption="Factures" [columns]="columns" [rows]="factures" filterable selectable
 *   [(selection)]="selection" />
 * ```
 *
 * Sémantique : `<table>` natif (pas de rôle ARIA grid) ; les contrôles
 * (tri, cases, pagination) sont des éléments natifs atteignables au Tab.
 */
@Component({
  selector: 'gestio-datagrid',
  imports: [
    NgTemplateOutlet,
    FormsModule,
    GestioTable,
    GestioCheckbox,
    GestioInput,
    GestioPagination,
  ],
  templateUrl: './datagrid.html',
  styleUrl: './datagrid.scss',
  host: { class: 'gestio-datagrid' },
})
export class GestioDataGrid<T> {
  /** Définition des colonnes. */
  readonly columns = input.required<readonly GestioDataGridColumn<T>[]>();
  /** Lignes à afficher. */
  readonly rows = input.required<readonly T[]>();
  /** Identifiant stable d'une ligne (sélection, rendu). Par défaut `row.id`, sinon l'index. */
  readonly rowKey = input<(row: T) => unknown>((row) => (row as { id?: unknown }).id);
  /** Titre du tableau (caption, nom de la zone défilante). Recommandé. */
  readonly caption = input<string>();
  /** Affiche la caption visuellement (sinon réservée aux technologies d'assistance). */
  readonly showCaption = input(false, { transform: booleanAttribute });

  /** Tri courant ; `null` = ordre d'origine. */
  readonly sort = model<GestioSort | null>(null);

  /** Affiche le champ de recherche. */
  readonly filterable = input(false, { transform: booleanAttribute });
  /** Texte de recherche (insensible à la casse et aux accents). */
  readonly filter = model('');

  /** Active la pagination. */
  readonly paginated = input(true, { transform: booleanAttribute });
  /** Index de page (à partir de 0). */
  readonly page = model(0);
  readonly pageSize = model(10);
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50]);

  /** Colonne de cases à cocher. */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** Clés (`rowKey`) des lignes sélectionnées. */
  readonly selection = model<readonly unknown[]>([]);
  /** Libellé d'une ligne pour sa case (« Sélectionner … »). Par défaut : 1re colonne. */
  readonly rowLabel = input<(row: T) => string>();

  readonly loading = input(false, { transform: booleanAttribute });
  readonly density = input<GestioTableDensity>('comfortable');
  readonly striped = input(false, { transform: booleanAttribute });
  /** Traits verticaux entre les colonnes. */
  readonly columnDividers = input(false, { transform: booleanAttribute });
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioDataGridLabels>>({});

  private readonly cellTemplates = contentChildren(GestioDataGridCell);

  protected readonly id = gestioUniqueId('gestio-datagrid');
  protected readonly announcement = signal('');

  protected readonly text = computed<GestioDataGridLabels>(() => ({
    ...GESTIO_DATAGRID_LABELS,
    ...this.labels(),
  }));

  protected readonly templates = computed(() => {
    const map = new Map<string, GestioDataGridCell>();
    for (const cell of this.cellTemplates()) map.set(cell.column(), cell);
    return map;
  });

  private readonly keyed = computed<GridRow<T>[]>(() => {
    const rowKey = this.rowKey();
    return this.rows().map((row, index) => ({ row, key: rowKey(row) ?? index }));
  });

  private readonly filtered = computed(() => {
    const query = normalize(this.filter().trim());
    if (!query) return this.keyed();
    const columns = this.columns();
    return this.keyed().filter(({ row }) =>
      columns.some((column) => normalize(this.display(column, row)).includes(query)),
    );
  });

  private readonly sorted = computed(() => {
    const sort = this.sort();
    const column = sort && this.columns().find((c) => c.key === sort.key);
    if (!sort || !column) return this.filtered();
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...this.filtered()].sort((a, b) => {
      const va = this.value(column, a.row);
      const vb = this.value(column, b.row);
      // Valeurs vides toujours en fin de liste.
      if (va == null || va === '') return vb == null || vb === '' ? 0 : 1;
      if (vb == null || vb === '') return -1;
      return compareValues(va, vb) * factor;
    });
  });

  protected readonly total = computed(() => this.sorted().length);
  protected readonly pageCount = computed(() =>
    this.paginated() ? Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))) : 1,
  );
  /** Page effective, bornée au nombre de pages. */
  protected readonly currentPage = computed(() =>
    Math.min(Math.max(0, this.page()), this.pageCount() - 1),
  );

  protected readonly visible = computed(() => {
    if (!this.paginated()) return this.sorted();
    const size = Math.max(1, this.pageSize());
    const start = this.currentPage() * size;
    return this.sorted().slice(start, start + size);
  });

  protected readonly paginationLabels = computed<Partial<GestioPaginationLabels>>(() => {
    const { rowsPerPage, previousPage, nextPage, range, pageStatus } = this.text();
    // Nom unique de la navigation lorsque plusieurs grilles partagent la page.
    const caption = this.caption();
    const navigation = caption ? `Pagination — ${caption}` : undefined;
    return {
      rowsPerPage,
      previousPage,
      nextPage,
      range,
      pageStatus,
      ...(navigation && { navigation }),
    };
  });

  private readonly selectedKeys = computed(() => new Set(this.selection()));
  protected readonly pageSelection = computed(() => {
    const keys = this.selectedKeys();
    const visible = this.visible();
    const count = visible.filter((item) => keys.has(item.key)).length;
    return {
      all: count > 0 && count === visible.length,
      some: count > 0 && count < visible.length,
    };
  });

  protected readonly columnCount = computed(
    () => this.columns().length + (this.selectable() ? 1 : 0),
  );

  // ---- Valeurs -------------------------------------------------------------

  protected value(column: GestioDataGridColumn<T>, row: T): GestioCellValue {
    if (column.value) return column.value(row);
    return (row as Record<string, GestioCellValue>)[column.key];
  }

  protected display(column: GestioDataGridColumn<T>, row: T): string {
    if (column.format) return column.format(row);
    const value = this.value(column, row);
    if (value == null) return '';
    if (value instanceof Date) return dateFormat.format(value);
    if (typeof value === 'number') return numberFormat.format(value);
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    return value;
  }

  protected isSelected(item: GridRow<T>): boolean {
    return this.selectedKeys().has(item.key);
  }

  protected rowSelectLabel(row: T): string {
    const label = this.rowLabel();
    const first = this.columns()[0];
    const name = label ? label(row) : first ? this.display(first, row) : '';
    return `${this.text().selectRow} ${name}`.trim();
  }

  protected ariaSort(column: GestioDataGridColumn<T>): string | null {
    const sort = this.sort();
    if (!column.sortable) return null;
    if (sort?.key !== column.key) return 'none';
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  // ---- Actions ---------------------------------------------------------------

  protected toggleSort(column: GestioDataGridColumn<T>): void {
    const current = this.sort();
    let next: GestioSort | null;
    if (current?.key !== column.key) next = { key: column.key, direction: 'asc' };
    else if (current.direction === 'asc') next = { key: column.key, direction: 'desc' };
    else next = null;

    this.sort.set(next);
    this.page.set(0);
    const labels = this.text();
    this.announce(
      next
        ? `${column.header}, ${next.direction === 'asc' ? labels.ascending : labels.descending}`
        : labels.sortCleared,
    );
  }

  protected onFilter(value: unknown): void {
    this.filter.set(typeof value === 'string' ? value : '');
    this.page.set(0);
    this.announce(interpolate(this.text().results, { count: this.total() }));
  }

  protected toggleRow(item: GridRow<T>, checked: boolean): void {
    const keys = new Set(this.selection());
    if (checked) keys.add(item.key);
    else keys.delete(item.key);
    this.selection.set([...keys]);
  }

  protected togglePage(checked: boolean): void {
    const keys = new Set(this.selection());
    for (const item of this.visible()) {
      if (checked) keys.add(item.key);
      else keys.delete(item.key);
    }
    this.selection.set([...keys]);
    this.announce(interpolate(this.text().selected, { count: keys.size }));
  }

  private announce(message: string): void {
    // Réinitialise pour que deux messages identiques soient annoncés.
    this.announcement.set('');
    queueMicrotask(() => this.announcement.set(message));
  }
}
