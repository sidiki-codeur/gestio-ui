import {
  Component,
  DOCUMENT,
  DestroyRef,
  TemplateRef,
  ViewContainerRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioDialogRef, GestioDialogService } from '@gestiolabs336/ui/dialog';
import { GestioCommand, gestioFilterCommands } from './command-search';

/** Libellés de la palette de commandes (internationalisation). */
export interface GestioCommandPaletteLabels {
  /** Nom accessible de la boîte de dialogue. */
  dialog: string;
  /** Nom accessible du champ de recherche. */
  input: string;
  placeholder: string;
  /** Nom accessible de la liste des commandes. */
  list: string;
  /** État vide ; `{query}` est remplacé. */
  empty: string;
  /** Annonce du nombre de résultats ; `{count}` est remplacé. */
  results: string;
  /** Annonce pour un seul résultat. */
  oneResult: string;
  /** Annonce sans résultat. */
  noResults: string;
  /** Aides du pied de palette. */
  navigateHint: string;
  runHint: string;
  closeHint: string;
  /** Nom de la touche Échap affiché dans le pied. */
  escapeKey: string;
}

export const GESTIO_COMMAND_PALETTE_LABELS: GestioCommandPaletteLabels = {
  dialog: 'Palette de commandes',
  input: 'Rechercher une commande',
  placeholder: 'Rechercher une commande…',
  list: 'Commandes',
  empty: 'Aucune commande ne correspond à « {query} ».',
  results: '{count} commandes trouvées',
  oneResult: '1 commande trouvée',
  noResults: 'Aucune commande trouvée',
  navigateHint: 'naviguer',
  runHint: 'exécuter',
  closeHint: 'fermer',
  escapeKey: 'Échap',
};

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

interface PaletteItem {
  readonly command: GestioCommand;
  /** Position dans la liste à plat (navigation clavier). */
  readonly index: number;
  readonly id: string;
}

interface PaletteSection {
  readonly key: string;
  readonly label: string | null;
  readonly headingId: string;
  readonly items: readonly PaletteItem[];
}

/** Indique si un événement clavier correspond à un raccourci du type `mod+k`. */
function matchesHotkey(event: KeyboardEvent, hotkey: string): boolean {
  const parts = hotkey
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);
  const key = parts.pop();
  if (!key || event.key?.toLowerCase() !== key) return false;
  const mods = new Set(parts);
  if (event.altKey !== mods.has('alt') || event.shiftKey !== mods.has('shift')) return false;
  if (mods.has('mod')) return event.ctrlKey || event.metaKey;
  return (
    event.ctrlKey === mods.has('ctrl') && event.metaKey === (mods.has('meta') || mods.has('cmd'))
  );
}

/**
 * Palette de commandes (Ctrl+K / ⌘K) : recherche floue insensible aux
 * accents, commandes groupées, navigation au clavier.
 *
 * ```html
 * <gestio-command-palette [(open)]="paletteOpen" [commands]="commands" (run)="execute($event)" />
 * ```
 *
 * Boîte de dialogue modale (`@gestiolabs336/ui/dialog`) contenant un champ
 * `combobox` relié à une `listbox` par `aria-activedescendant` : flèches haut
 * et bas, Entrée pour exécuter, Échap pour fermer. Le raccourci global
 * (`hotkey`, `mod+k` par défaut : Ctrl ou ⌘) ouvre et ferme la palette.
 */
@Component({
  selector: 'gestio-command-palette',
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
  host: {
    class: 'gestio-command-palette',
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
})
export class GestioCommandPalette {
  private readonly dialog = inject(GestioDialogService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly document = inject(DOCUMENT);

  /** Ouverture de la palette (liaison bidirectionnelle `[(open)]`). */
  readonly open = model(false);
  /** Commandes proposées. */
  readonly commands = input<readonly GestioCommand[]>([]);
  /**
   * Raccourci global d'ouverture : `mod` (Ctrl ou ⌘), `ctrl`, `meta`, `alt`,
   * `shift` et une touche, séparés par `+`. `null` ou `''` le désactive.
   */
  readonly hotkey = input<string | null>('mod+k');
  /** Ferme la palette après l'exécution d'une commande. */
  readonly closeOnRun = input(true, { transform: booleanAttribute });
  /** Libellés (internationalisation). */
  readonly labels = input<Partial<GestioCommandPaletteLabels>>({});

  /** Commande choisie (clic ou Entrée). Jamais émise pour une commande désactivée. */
  readonly run = output<GestioCommand>();

  protected readonly baseId = gestioUniqueId('gestio-command-palette');
  protected readonly inputId = `${this.baseId}-input`;
  protected readonly listId = `${this.baseId}-list`;

  protected readonly text = computed(() => ({
    ...GESTIO_COMMAND_PALETTE_LABELS,
    ...this.labels(),
  }));

  protected readonly query = signal('');

  /** Résultats filtrés, regroupés (ordre d'apparition des groupes) et indexés. */
  protected readonly sections = computed<readonly PaletteSection[]>(() => {
    const filtered = gestioFilterCommands(this.commands(), this.query());
    const groups = new Map<string, GestioCommand[]>();
    for (const command of filtered) {
      const key = command.group ?? '';
      const list = groups.get(key);
      if (list) list.push(command);
      else groups.set(key, [command]);
    }
    let index = 0;
    return Array.from(groups, ([key, commands], position) => ({
      key,
      label: key || null,
      headingId: `${this.baseId}-group-${position}`,
      items: commands.map((command) => {
        const item = { command, index, id: `${this.baseId}-option-${index}` };
        index++;
        return item;
      }),
    }));
  });

  private readonly items = computed(() => this.sections().flatMap((section) => section.items));
  protected readonly hasResults = computed(() => this.items().length > 0);

  /** Option active (indice à plat), réinitialisée sur la première activable à chaque recherche. */
  protected readonly activeIndex = linkedSignal(() =>
    this.items().findIndex((item) => !item.command.disabled),
  );
  protected readonly activeId = computed(() => this.items()[this.activeIndex()]?.id ?? null);

  protected readonly emptyText = computed(() =>
    interpolate(this.text().empty, { query: this.query().trim() }),
  );

  /** Annonce polie du nombre de résultats (seulement pendant une recherche). */
  protected readonly status = computed(() => {
    if (!this.query().trim()) return '';
    const count = this.items().length;
    const text = this.text();
    if (count === 0) return text.noResults;
    if (count === 1) return text.oneResult;
    return interpolate(text.results, { count });
  });

  private readonly panel = viewChild.required('palette', { read: TemplateRef });
  private ref: GestioDialogRef | null = null;

  constructor() {
    // Rendu navigateur uniquement : rien n'est ouvert pendant le rendu serveur.
    afterRenderEffect(() => {
      const open = this.open();
      untracked(() => (open ? this.show() : this.ref?.close()));
    });
    // Garde l'option active visible dans la liste défilante.
    afterRenderEffect(() => {
      const id = this.activeId();
      if (!id) return;
      const option = this.document.getElementById(id);
      option?.scrollIntoView?.({ block: 'nearest' });
    });
    inject(DestroyRef).onDestroy(() => this.ref?.close());
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    const hotkey = this.hotkey();
    if (!hotkey || event.repeat || !matchesHotkey(event, hotkey)) return;
    event.preventDefault();
    this.open.update((open) => !open);
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Enter': {
        const item = this.items()[this.activeIndex()];
        if (!item) return;
        event.preventDefault();
        this.select(item);
        break;
      }
    }
  }

  protected activate(item: PaletteItem): void {
    if (!item.command.disabled) this.activeIndex.set(item.index);
  }

  protected select(item: PaletteItem): void {
    if (item.command.disabled) return;
    this.run.emit(item.command);
    if (this.closeOnRun()) this.open.set(false);
  }

  /** Déplace l'option active en sautant les commandes désactivées (boucle). */
  private move(step: 1 | -1): void {
    const items = this.items();
    const count = items.length;
    if (!count) return;
    let index = this.activeIndex();
    for (let i = 0; i < count; i++) {
      index = (index + step + count) % count;
      if (!items[index].command.disabled) {
        this.activeIndex.set(index);
        return;
      }
    }
  }

  private show(): void {
    if (this.ref) return;
    this.query.set('');
    const ref = this.dialog.open(this.panel(), {
      size: 'md',
      ariaLabel: this.text().dialog,
      autoFocus: `#${this.inputId}`,
      panelClass: 'gestio-command-palette-pane',
      viewContainerRef: this.viewContainerRef,
    });
    this.ref = ref;
    ref.closed.subscribe(() => {
      if (this.ref === ref) this.ref = null;
      this.open.set(false);
    });
  }
}
