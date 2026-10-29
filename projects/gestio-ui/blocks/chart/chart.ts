/** Série de données d'un graphique en barres ou en courbes. */
export interface GestioChartSeries {
  /** Nom de la série (légende, info-bulle, en-tête du tableau). */
  readonly name: string;
  /** Une valeur par catégorie, dans l'ordre de `categories` ; `null` = valeur absente. */
  readonly data: readonly (number | null)[];
  /**
   * Couleur CSS facultative (de préférence un jeton : `var(--gestio-color-success)`).
   * Par défaut, la palette `--gestio-chart-1` … `--gestio-chart-8`.
   */
  readonly color?: string;
}

/** Libellés des graphiques (internationalisation). */
export interface GestioChartLabels {
  /** Bouton d'affichage du tableau de données. */
  showTable: string;
  /** Bouton de masquage du tableau de données. */
  hideTable: string;
  /** En-tête de la colonne des catégories du tableau. */
  category: string;
  /** En-tête de la colonne des valeurs (graphique en anneau). */
  value: string;
  /** En-tête de la colonne des parts (graphique en anneau). */
  share: string;
  /** Total (centre de l'anneau, pied du tableau). */
  total: string;
  /** Résumé d'un graphique en barres ; `{series}`, `{count}`, `{min}`, `{max}` sont remplacés. */
  barSummary: string;
  /** Résumé d'un graphique en courbes ; `{series}`, `{count}`, `{min}`, `{max}` sont remplacés. */
  lineSummary: string;
  /** Résumé d'un graphique en anneau ; `{count}`, `{total}` sont remplacés. */
  donutSummary: string;
  /** Nom d'un point ou d'une barre ; `{category}`, `{series}`, `{value}` sont remplacés. */
  point: string;
  /** Nom d'une part de l'anneau ; `{category}`, `{value}`, `{percent}` sont remplacés. */
  slice: string;
  /** Nom du groupe des points navigables au clavier. */
  points: string;
  /** Aucune donnée à afficher. */
  noData: string;
  /** Valeur absente dans le tableau. */
  missing: string;
}

export const GESTIO_CHART_LABELS: GestioChartLabels = {
  showTable: 'Afficher le tableau',
  hideTable: 'Masquer le tableau',
  category: 'Catégorie',
  value: 'Valeur',
  share: 'Part',
  total: 'Total',
  barSummary: 'Graphique en barres : {series} série(s) sur {count} catégories, de {min} à {max}.',
  lineSummary: 'Graphique en courbes : {series} série(s) sur {count} points, de {min} à {max}.',
  donutSummary: 'Graphique en anneau : {count} parts, total {total}.',
  point: '{category}, {series} : {value}',
  slice: '{category} : {value} ({percent})',
  points: 'Valeurs du graphique (flèches pour parcourir)',
  noData: 'Aucune donnée à afficher',
  missing: 'Non renseigné',
};
