import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Directive,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GESTIO_MENU_IMPORTS } from '@gestiolabs336/ui/menu';

/** Colonne du tableau Kanban. */
export interface GestioKanbanColumn<T> {
  /** Identifiant stable (renvoyé dans `moved`). */
  readonly id: string;
  /** Intitulé affiché en tête de colonne. */
  readonly title: string;
  /** Cartes de la colonne, dans l'ordre d'affichage. */
  readonly items: readonly T[];
  /** Limite de travail en cours (WIP) : au-delà, la colonne est signalée. */
  readonly wipLimit?: number;
}

/** Déplacement d'une carte (souris, toucher ou clavier). */
export interface GestioKanbanMoveEvent<T> {
  readonly item: T;
  /** Identifiant de la colonne de départ. */
  readonly from: string;
  /** Identifiant de la colonne d'arrivée. */
  readonly to: string;
  readonly previousIndex: number;
  readonly currentIndex: number;
}

/** Contexte du gabarit de carte (`let-item`, `let-column="column"`, `let-index="index"`). */
export interface GestioKanbanCardContext<T> {
  $implicit: T;
  item: T;
  column: GestioKanbanColumn<T>;
  index: number;
}

/** Libellés du tableau Kanban (internationalisation). */
export interface GestioKanbanLabels {
  /** Nom du tableau. */
  board: string;
  /** Mode d'emploi clavier, associé à chaque carte. */
  instructions: string;
  /** Nom du bouton de déplacement ; `{item}` est remplacé. */
  moveMenu: string;
  moveUp: string;
  moveDown: string;
  /** Déplacement vers une autre colonne ; `{column}` est remplacé. */
  moveTo: string;
  /** Annonce après un déplacement ; `{item}`, `{column}`, `{position}`, `{count}` sont remplacés. */
  moved: string;
  /** Annonce d'un déplacement refusé ; `{column}`, `{limit}` sont remplacés. */
  blocked: string;
  /** Compteur ; `{count}` est remplacé. */
  count: string;
  /** Compteur avec limite ; `{count}`, `{limit}` sont remplacés. */
  countWithLimit: string;
  /** Raccourcis affichés dans le menu « Déplacer ». */
  shortcutUp: string;
  shortcutDown: string;
  shortcutLeft: string;
  shortcutRight: string;
  /** Badge de dépassement de la limite WIP. */
  overLimit: string;
  /** Colonne vide. */
  empty: string;
}

export const GESTIO_KANBAN_LABELS: GestioKanbanLabels = {
  board: 'Tableau Kanban',
  instructions:
    'Flèches pour parcourir les cartes. Maj + flèches pour déplacer la carte, ou bouton « Déplacer ».',
  moveMenu: 'Déplacer « {item} »',
  moveUp: 'Monter',
  moveDown: 'Descendre',
  moveTo: 'Vers « {column} »',
  moved: 'Carte « {item} » déplacée vers {column}, position {position} sur {count}.',
  blocked: 'Déplacement impossible : {column} a atteint sa limite de {limit} cartes.',
  count: '{count} cartes',
  countWithLimit: '{count} cartes sur une limite de {limit}',
  shortcutUp: 'Maj+↑',
  shortcutDown: 'Maj+↓',
  shortcutLeft: 'Maj+←',
  shortcutRight: 'Maj+→',
  overLimit: 'Limite dépassée',
  empty: 'Aucune carte',
};

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/** Libellé par défaut : `title`, `name` ou `label` de l'élément, sinon sa conversion en texte. */
function defaultItemLabel(item: unknown): string {
  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    for (const key of ['title', 'name', 'label']) {
      if (typeof record[key] === 'string') return record[key];
    }
  }
  return String(item);
}

/**
 * Gabarit de carte du tableau Kanban.
 *
 * ```html
 * <ng-template gestioKanbanCard [gestioKanbanCardOf]="columns()" let-ticket>
 *   <strong>{{ ticket.title }}</strong>
 * </ng-template>
 * ```
 *
 * `[gestioKanbanCardOf]` (facultatif) type la variable de la carte d'après les colonnes.
 */
@Directive({ selector: 'ng-template[gestioKanbanCard]' })
// `any` par défaut : sans [gestioKanbanCardOf], la carte reste exploitable dans le gabarit.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GestioKanbanCard<T = any> {
  readonly template = inject<TemplateRef<GestioKanbanCardContext<T>>>(TemplateRef);

  /** Colonnes du tableau, pour typer le contexte du gabarit. */
  readonly columns = input<readonly GestioKanbanColumn<T>[]>(undefined, {
    alias: 'gestioKanbanCardOf',
  });

  static ngTemplateContextGuard<T>(
    _directive: GestioKanbanCard<T>,
    context: unknown,
  ): context is GestioKanbanCardContext<T> {
    return true;
  }
}

/**
 * Tableau Kanban : colonnes de cartes déplaçables à la souris, au toucher
 * (`@angular/cdk/drag-drop`) et au clavier.
 *
 * ```html
 * <gestio-kanban [(columns)]="columns" (moved)="save($event)">
 *   <ng-template gestioKanbanCard [gestioKanbanCardOf]="columns()" let-ticket>
 *     <strong>{{ ticket.title }}</strong>
 *     <span>{{ ticket.assignee }}</span>
 *   </ng-template>
 * </gestio-kanban>
 * ```
 *
 * Alternative au glisser-déposer (WCAG 2.5.7) : chaque carte est focalisable
 * (une seule tabulation pour le tableau, puis flèches), Maj + flèches la
 * déplace, et un bouton « Déplacer » ouvre un menu d'actions. Chaque
 * déplacement est annoncé aux lecteurs d'écran. Les colonnes sont remplacées
 * de façon immuable (`columns` est un `model`).
 */
@Component({
  selector: 'gestio-kanban',
  imports: [
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    NgTemplateOutlet,
    GestioButton,
    GESTIO_MENU_IMPORTS,
  ],
  templateUrl: './kanban.html',
  styleUrl: './kanban.scss',
  host: { class: 'gestio-kanban' },
})
export class GestioKanban<T> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Colonnes et cartes (liaison bidirectionnelle `[(columns)]`). */
  readonly columns = model.required<readonly GestioKanbanColumn<T>[]>();
  /** Nom d'une carte pour les annonces et le bouton « Déplacer ». */
  readonly itemLabel = input<(item: T) => string>(defaultItemLabel);
  /** Identité d'une carte pour le suivi du DOM (par défaut, la référence). */
  readonly trackBy = input<(item: T) => unknown>((item) => item);
  /** Refuse l'entrée d'une carte dans une colonne qui a atteint sa limite WIP. */
  readonly enforceWip = input(false, { transform: booleanAttribute });
  /** Niveau de titre des colonnes (2 à 6). */
  readonly headingLevel = input(3, { transform: numberAttribute });
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioKanbanLabels>>({});

  /** Carte déplacée (les colonnes sont déjà mises à jour). */
  readonly moved = output<GestioKanbanMoveEvent<T>>();

  protected readonly cardTemplate = contentChild(GestioKanbanCard);

  protected readonly id = gestioUniqueId('gestio-kanban');
  protected readonly announcement = signal('');

  protected readonly text = computed<GestioKanbanLabels>(() => ({
    ...GESTIO_KANBAN_LABELS,
    ...this.labels(),
  }));

  /** Carte qui porte `tabindex="0"` (tabulation itinérante), sous la forme `[colonne, index]`. */
  protected readonly activeCard = linkedSignal<
    readonly GestioKanbanColumn<T>[],
    readonly [number, number] | null
  >({
    source: () => this.columns(),
    computation: (columns, previous) => {
      const prev = previous?.value;
      if (prev && columns[prev[0]]?.items.length) {
        return [prev[0], Math.min(prev[1], columns[prev[0]].items.length - 1)];
      }
      const first = columns.findIndex((column) => column.items.length > 0);
      return first >= 0 ? [first, 0] : null;
    },
  });

  /** Autorise ou non l'entrée d'une carte glissée dans chaque colonne. */
  protected readonly enterPredicates = computed(() =>
    this.columns().map(
      (_, c) => (drag: CdkDrag, drop: CdkDropList) =>
        drag.dropContainer === drop || !this.isFull(c),
    ),
  );

  protected trackItem(item: T): unknown {
    return this.trackBy()(item);
  }

  protected isActive(c: number, i: number): boolean {
    const active = this.activeCard();
    return !!active && active[0] === c && active[1] === i;
  }

  protected isOver(column: GestioKanbanColumn<T>): boolean {
    return column.wipLimit != null && column.items.length > column.wipLimit;
  }

  protected isFull(c: number): boolean {
    const column = this.columns()[c];
    return (
      this.enforceWip() &&
      !!column &&
      column.wipLimit != null &&
      column.items.length >= column.wipLimit
    );
  }

  protected countLabel(column: GestioKanbanColumn<T>): string {
    const text = this.text();
    return column.wipLimit != null
      ? interpolate(text.countWithLimit, { count: column.items.length, limit: column.wipLimit })
      : interpolate(text.count, { count: column.items.length });
  }

  protected moveMenuLabel(item: T): string {
    return interpolate(this.text().moveMenu, { item: this.itemLabel()(item) });
  }

  protected moveToLabel(column: GestioKanbanColumn<T>): string {
    return interpolate(this.text().moveTo, { column: column.title });
  }

  protected headingId(c: number): string {
    return `${this.id}-column-${c}`;
  }

  protected onDrop(event: CdkDragDrop<number>): void {
    this.move(
      event.previousContainer.data,
      event.previousIndex,
      event.container.data,
      event.currentIndex,
      false,
    );
  }

  /** Déplace dans la même colonne (menu « Déplacer »). */
  protected moveWithin(c: number, i: number, to: number): void {
    this.move(c, i, c, to, true);
  }

  /** Déplace vers une autre colonne en conservant la position autant que possible. */
  protected moveToColumn(c: number, i: number, target: number): void {
    const column = this.columns()[target];
    if (!column) return;
    this.move(c, i, target, Math.min(i, column.items.length), true);
  }

  protected onCardFocus(c: number, i: number): void {
    this.activeCard.set([c, i]);
  }

  protected onCardKeydown(event: KeyboardEvent, c: number, i: number): void {
    // Les touches saisies dans le contenu de la carte (lien, bouton…) ne sont pas interceptées.
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const columns = this.columns();
    const count = columns[c].items.length;

    if (event.shiftKey) {
      switch (event.key) {
        case 'ArrowUp':
          if (i > 0) this.move(c, i, c, i - 1, true);
          break;
        case 'ArrowDown':
          if (i < count - 1) this.move(c, i, c, i + 1, true);
          break;
        case 'ArrowLeft':
          if (c > 0) this.moveToColumn(c, i, c - 1);
          break;
        case 'ArrowRight':
          if (c < columns.length - 1) this.moveToColumn(c, i, c + 1);
          break;
        default:
          return;
      }
      event.preventDefault();
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        this.focusCard(c, Math.max(0, i - 1));
        break;
      case 'ArrowDown':
        this.focusCard(c, Math.min(count - 1, i + 1));
        break;
      case 'Home':
        this.focusCard(c, 0);
        break;
      case 'End':
        this.focusCard(c, count - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowRight': {
        const step = event.key === 'ArrowLeft' ? -1 : 1;
        // Colonne non vide la plus proche dans cette direction.
        for (let t = c + step; t >= 0 && t < columns.length; t += step) {
          if (columns[t].items.length) {
            this.focusCard(t, Math.min(i, columns[t].items.length - 1));
            break;
          }
        }
        break;
      }
      default:
        return;
    }
    event.preventDefault();
  }

  /**
   * Déplace la carte `fromIndex` de la colonne `fromColumn` vers la position
   * `toIndex` de la colonne `toColumn`. Renvoie `false` si rien n'a bougé.
   */
  private move(
    fromColumn: number,
    fromIndex: number,
    toColumn: number,
    toIndex: number,
    restoreFocus: boolean,
  ): boolean {
    const columns = this.columns();
    const source = columns[fromColumn];
    const target = columns[toColumn];
    if (!source || !target || fromIndex < 0 || fromIndex >= source.items.length) return false;
    const item = source.items[fromIndex];
    const text = this.text();
    let next: GestioKanbanColumn<T>[];
    let index: number;

    if (fromColumn === toColumn) {
      index = Math.min(Math.max(0, toIndex), source.items.length - 1);
      if (index === fromIndex) return false;
      const items = [...source.items];
      items.splice(fromIndex, 1);
      items.splice(index, 0, item);
      next = columns.map((column, c) => (c === fromColumn ? { ...column, items } : column));
    } else {
      if (this.isFull(toColumn)) {
        this.announce(
          interpolate(text.blocked, { column: target.title, limit: target.wipLimit ?? 0 }),
        );
        return false;
      }
      index = Math.min(Math.max(0, toIndex), target.items.length);
      const sourceItems = source.items.filter((_, i) => i !== fromIndex);
      const targetItems = [...target.items];
      targetItems.splice(index, 0, item);
      next = columns.map((column, c) =>
        c === fromColumn
          ? { ...column, items: sourceItems }
          : c === toColumn
            ? { ...column, items: targetItems }
            : column,
      );
    }

    this.columns.set(next);
    this.activeCard.set([toColumn, index]);
    this.moved.emit({
      item,
      from: source.id,
      to: target.id,
      previousIndex: fromIndex,
      currentIndex: index,
    });
    this.announce(
      interpolate(text.moved, {
        item: this.itemLabel()(item),
        column: target.title,
        position: index + 1,
        count: next[toColumn].items.length,
      }),
    );
    if (restoreFocus) {
      afterNextRender(() => this.focusCard(toColumn, index), { injector: this.injector });
    }
    return true;
  }

  private focusCard(c: number, i: number): void {
    this.activeCard.set([c, i]);
    this.host.nativeElement.querySelector<HTMLElement>(`[data-card="${c}-${i}"]`)?.focus();
  }

  private announce(message: string): void {
    // Une espace insécable alternée force la relecture d'un message identique.
    this.announcement.update((previous) => (previous === message ? `${message} ` : message));
  }
}
