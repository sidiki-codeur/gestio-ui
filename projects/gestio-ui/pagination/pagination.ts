import {
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioSelect, GestioSelectOption } from '@gestiolabs336/ui/select';

/** `pages` : numéros de page ; `compact` : « 3 / 12 » entre précédent et suivant. */
export type GestioPaginationMode = 'pages' | 'compact';

/** Libellés de la pagination (internationalisation). */
export interface GestioPaginationLabels {
  /** Nom de la zone de navigation. */
  navigation: string;
  rowsPerPage: string;
  previousPage: string;
  nextPage: string;
  /** Nom d'un bouton de page ; `{page}` est remplacé. */
  page: string;
  /** `{from}`, `{to}`, `{total}` sont remplacés. */
  range: string;
  /** Annonce après un changement de page ; `{page}`, `{pages}` sont remplacés. */
  pageStatus: string;
}

export const GESTIO_PAGINATION_LABELS: GestioPaginationLabels = {
  navigation: 'Pagination',
  rowsPerPage: 'Lignes par page',
  previousPage: 'Page précédente',
  nextPage: 'Page suivante',
  page: 'Page {page}',
  range: '{from}–{to} sur {total}',
  pageStatus: 'Page {page} sur {pages}',
};

/** Élément de la liste des pages : numéro (à partir de 0) ou ellipse. */
type PageItem = { kind: 'page'; index: number } | { kind: 'gap'; key: string };

const numberFormat = new Intl.NumberFormat('fr-FR');

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/**
 * Pagination autonome pour une liste, une grille de cartes ou un tableau
 * paginé côté serveur.
 *
 * ```html
 * <gestio-pagination [total]="totalClients()" [(page)]="page" [(pageSize)]="pageSize" />
 * ```
 *
 * `page` commence à 0. Changer `pageSize` ramène à la première page.
 * Chaque changement de page est annoncé aux lecteurs d'écran.
 */
@Component({
  selector: 'gestio-pagination',
  imports: [FormsModule, GestioSelect],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
  host: { class: 'gestio-pagination' },
})
export class GestioPagination {
  /** Nombre total d'éléments. */
  readonly total = input.required({ transform: numberAttribute });
  /** Page courante, à partir de 0. */
  readonly page = model(0);
  /** Éléments par page. */
  readonly pageSize = model(10);
  /** Choix proposés pour `pageSize`. */
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50]);
  /** Affiche le sélecteur « Lignes par page ». */
  readonly showPageSize = input(true, { transform: booleanAttribute });
  /** Affiche « 1–10 sur 230 ». */
  readonly showRange = input(true, { transform: booleanAttribute });
  readonly mode = input<GestioPaginationMode>('pages');
  /** Pages affichées de part et d'autre de la page courante (mode `pages`). */
  readonly siblingCount = input(1, { transform: numberAttribute });
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioPaginationLabels>>({});
  /** Nom de la navigation ; à rendre unique s'il y a plusieurs paginations dans la page. */
  readonly ariaLabel = input<string>();

  protected readonly id = gestioUniqueId('gestio-pagination');
  protected readonly announcement = signal('');

  protected readonly text = computed<GestioPaginationLabels>(() => ({
    ...GESTIO_PAGINATION_LABELS,
    ...this.labels(),
  }));

  private readonly size = computed(() => Math.max(1, this.pageSize()));
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(Math.max(0, this.total()) / this.size())),
  );
  /** Page effective, bornée au nombre de pages. */
  protected readonly current = computed(() =>
    Math.min(Math.max(0, this.page()), this.pageCount() - 1),
  );

  protected readonly rangeText = computed(() => {
    const total = Math.max(0, this.total());
    const from = total ? this.current() * this.size() + 1 : 0;
    const to = Math.min(total, this.current() * this.size() + this.size());
    return interpolate(this.text().range, {
      from: numberFormat.format(from),
      to: numberFormat.format(to),
      total: numberFormat.format(total),
    });
  });

  protected readonly pageSizeChoices = computed<GestioSelectOption<number>[]>(() => {
    const sizes = new Set(this.pageSizeOptions());
    sizes.add(this.pageSize());
    return [...sizes].sort((a, b) => a - b).map((size) => ({ label: String(size), value: size }));
  });

  protected readonly items = computed<PageItem[]>(() => {
    const count = this.pageCount();
    const current = this.current();
    const siblings = Math.max(0, this.siblingCount());
    // Première et dernière pages, page courante ± voisines ; une ellipse ne remplace
    // jamais une seule page. Nombre d'éléments constant (calcul en base 1).
    if (count <= siblings * 2 + 5) {
      return Array.from({ length: count }, (_, index) => ({ kind: 'page', index }));
    }
    const page = current + 1;
    const start = Math.max(Math.min(page - siblings, count - siblings * 2 - 2), 3);
    const end = Math.min(Math.max(page + siblings, siblings * 2 + 3), count - 2);
    const items: PageItem[] = [{ kind: 'page', index: 0 }];
    items.push(start > 3 ? { kind: 'gap', key: 'start' } : { kind: 'page', index: 1 });
    for (let p = start; p <= end; p++) items.push({ kind: 'page', index: p - 1 });
    items.push(end < count - 2 ? { kind: 'gap', key: 'end' } : { kind: 'page', index: count - 2 });
    items.push({ kind: 'page', index: count - 1 });
    return items;
  });

  protected pageLabel(index: number): string {
    return interpolate(this.text().page, { page: index + 1 });
  }

  protected formatPage(index: number): string {
    return numberFormat.format(index + 1);
  }

  protected goTo(index: number): void {
    const target = Math.min(Math.max(0, index), this.pageCount() - 1);
    if (target === this.current()) return;
    this.page.set(target);
    this.announce(
      interpolate(this.text().pageStatus, { page: target + 1, pages: this.pageCount() }),
    );
  }

  protected onPageSize(size: unknown): void {
    if (typeof size !== 'number' || size === this.pageSize()) return;
    this.pageSize.set(size);
    this.page.set(0);
  }

  private announce(message: string): void {
    // Réinitialise pour que deux messages identiques soient annoncés.
    this.announcement.set('');
    queueMicrotask(() => this.announcement.set(message));
  }
}
