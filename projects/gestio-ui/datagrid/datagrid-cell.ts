import { Directive, TemplateRef, inject, input } from '@angular/core';
import { GestioCellValue } from './datagrid.types';

/** Contexte d'un gabarit de cellule. */
export interface GestioDataGridCellContext<T> {
  /** Ligne (`let-row`). */
  $implicit: T;
  row: T;
  /** Valeur brute de la colonne (`let-value="value"`). */
  value: GestioCellValue;
  /** Index de la ligne dans la page. */
  index: number;
}

/**
 * Gabarit personnalisé pour les cellules d'une colonne.
 *
 * ```html
 * <ng-template gestioCell="statut" [gestioCellOf]="factures" let-row>
 *   <gestio-badge [variant]="row.paid ? 'success' : 'warning'">…</gestio-badge>
 * </ng-template>
 * ```
 *
 * `[gestioCellOf]` (facultatif) type la variable `row` d'après les lignes.
 */
@Directive({ selector: 'ng-template[gestioCell]' })
// `any` par défaut : sans [gestioCellOf], la ligne reste exploitable dans le gabarit.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GestioDataGridCell<T = any> {
  readonly template = inject<TemplateRef<GestioDataGridCellContext<T>>>(TemplateRef);

  /** Clé de la colonne concernée. */
  readonly column = input.required<string>({ alias: 'gestioCell' });
  /** Lignes de la grille, pour typer le contexte du gabarit. */
  readonly rows = input<readonly T[]>(undefined, { alias: 'gestioCellOf' });

  static ngTemplateContextGuard<T>(
    _directive: GestioDataGridCell<T>,
    context: unknown,
  ): context is GestioDataGridCellContext<T> {
    return true;
  }
}
