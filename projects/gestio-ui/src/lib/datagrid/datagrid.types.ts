/** Valeur d'une cellule utilisée pour le tri et, à défaut de `format`, l'affichage. */
export type GestioCellValue = string | number | boolean | Date | null | undefined;

export interface GestioDataGridColumn<T> {
  /** Identifiant unique ; par défaut, nom de la propriété lue sur la ligne. */
  key: string;
  /** Libellé de l'en-tête. */
  header: string;
  /** Valeur de la cellule (tri, filtre). Par défaut : `row[key]`. */
  value?: (row: T) => GestioCellValue;
  /** Texte affiché. Par défaut : valeur formatée (nombres et dates en fr-FR). */
  format?: (row: T) => string;
  /** Autorise le tri sur cette colonne. */
  sortable?: boolean;
  /** Alignement ; `end` pour les montants (chiffres tabulaires). */
  align?: 'start' | 'center' | 'end';
  /** Largeur CSS de la colonne (ex. `'8rem'`). */
  width?: string;
}

export type GestioSortDirection = 'asc' | 'desc';

export interface GestioSort {
  key: string;
  direction: GestioSortDirection;
}

/** Libellés de la grille (internationalisation). */
export interface GestioDataGridLabels {
  filter: string;
  filterPlaceholder: string;
  empty: string;
  noResults: string;
  loading: string;
  rowsPerPage: string;
  previousPage: string;
  nextPage: string;
  selectPage: string;
  selectRow: string;
  /** `{from}`, `{to}`, `{total}` sont remplacés. */
  range: string;
  /** `{page}`, `{pages}` sont remplacés. */
  pageStatus: string;
  ascending: string;
  descending: string;
  sortCleared: string;
  /** `{count}` est remplacé. */
  results: string;
  /** `{count}` est remplacé. */
  selected: string;
}

export const GESTIO_DATAGRID_LABELS: GestioDataGridLabels = {
  filter: 'Filtrer les lignes',
  filterPlaceholder: 'Rechercher…',
  empty: 'Aucune donnée à afficher.',
  noResults: 'Aucun résultat ne correspond à la recherche.',
  loading: 'Chargement des données…',
  rowsPerPage: 'Lignes par page',
  previousPage: 'Page précédente',
  nextPage: 'Page suivante',
  selectPage: 'Sélectionner les lignes de la page',
  selectRow: 'Sélectionner',
  range: '{from}–{to} sur {total}',
  pageStatus: 'Page {page} sur {pages}',
  ascending: 'croissant',
  descending: 'décroissant',
  sortCleared: 'Tri annulé',
  results: '{count} résultat(s)',
  selected: '{count} sélectionnée(s)',
};
