import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GestioSize, ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioFormField } from '@gestiolabs336/ui/form-field';

/** Libellés de la liste déroulante avec recherche (internationalisation). */
export interface GestioComboboxLabels {
  /** Ligne affichée quand aucune option ne correspond. */
  noResults: string;
  /** Ligne affichée pendant `loading`. */
  loading: string;
  /** Nom du bouton d'effacement. */
  clear: string;
  /** Nom du bouton qui ouvre la liste. */
  toggle: string;
  /** Nom du bouton qui retire une valeur (mode multiple) ; `{label}` est remplacé. */
  remove: string;
  /** Nom de la liste des valeurs choisies (mode multiple). */
  selectedValues: string;
  /** Annonce du nombre de résultats (plusieurs) ; `{count}` est remplacé. */
  results: string;
  /** Annonce d'un seul résultat. */
  oneResult: string;
  /** Annonce après un ajout (mode multiple) ; `{label}` est remplacé. */
  added: string;
  /** Annonce après un retrait (mode multiple) ; `{label}` est remplacé. */
  removed: string;
}

export const GESTIO_COMBOBOX_LABELS: GestioComboboxLabels = {
  noResults: 'Aucun résultat',
  loading: 'Chargement…',
  clear: 'Effacer la sélection',
  toggle: 'Afficher les suggestions',
  remove: 'Retirer {label}',
  selectedValues: 'Valeurs sélectionnées',
  results: '{count} résultats disponibles',
  oneResult: '1 résultat disponible',
  added: '{label} ajouté',
  removed: '{label} retiré',
};

export type GestioComboboxSize = GestioSize;

/** Option sous forme d'objet (reconnue par les fonctions par défaut). */
export interface GestioComboboxOption<V = unknown> {
  label: string;
  value: V;
  /** Texte secondaire (affiché si `descriptionWith` n'est pas fourni). */
  description?: string;
  disabled?: boolean;
}

/** Retire accents et casse : « Été » et « ete » se correspondent. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .trim();
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

function readProperty(option: unknown, key: string): unknown {
  return typeof option === 'object' && option !== null
    ? (option as Record<string, unknown>)[key]
    : undefined;
}

function defaultDisplay(option: unknown): string {
  const label = readProperty(option, 'label');
  return label !== undefined ? String(label) : String(option ?? '');
}

function defaultDescription(option: unknown): string | null {
  const description = readProperty(option, 'description');
  return typeof description === 'string' ? description : null;
}

function defaultDisabled(option: unknown): boolean {
  return readProperty(option, 'disabled') === true;
}

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

/** Délai avant l'annonce du nombre de résultats (évite une annonce par frappe). */
const ANNOUNCE_DELAY = 600;

interface SelectedItem<T> {
  readonly value: unknown;
  readonly option: T | undefined;
  readonly label: string;
}

/**
 * Liste déroulante avec recherche (motif ARIA « Combobox » avec liste popup).
 *
 * ```html
 * <gestio-combobox label="Client" [options]="clients" [displayWith]="nomClient" valueKey="id"
 *   placeholder="Rechercher un client" formControlName="clientId" />
 * <gestio-combobox label="Étiquettes" multiple [options]="tags" formControlName="tags" />
 * ```
 *
 * - Options passées par `[options]` (comme `gestio-select`) : chaînes, objets
 *   `{ label, value, description?, disabled? }` ou objets métier avec
 *   `displayWith` / `valueKey`.
 * - Filtrage pendant la saisie, insensible à la casse et aux accents ; `filter=false`
 *   et la sortie `search` (temporisée) pour une recherche côté serveur, avec `loading`.
 * - Clavier : flèches, Entrée, Échap, Début/Fin (liste ouverte), Alt+flèche bas.
 *   Le focus reste dans le champ (`aria-activedescendant`).
 * - `multiple` : valeurs affichées en puces retirables ; Retour arrière dans le
 *   champ vide retire la dernière.
 *
 * Valeur : la valeur de l'option (`option[valueKey]`, ou l'option elle-même) ;
 * un tableau en mode `multiple`. Compatible Reactive Forms, `ngModel`,
 * Signal Forms (`[formField]`) et `gestio-form-field`.
 */
@Component({
  selector: 'gestio-combobox',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin],
  templateUrl: './combobox.html',
  styleUrl: './combobox.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioCombobox), multi: true },
  ],
  host: { class: 'gestio-combobox' },
})
export class GestioCombobox<T = unknown> implements ControlValueAccessor {
  protected readonly formField = inject(GestioFormField, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Options proposées. */
  readonly options = input<readonly T[]>([]);
  /** Texte affiché pour une option (défaut : `option.label`, sinon `String(option)`). */
  readonly displayWith = input<(option: T) => string>(defaultDisplay);
  /** Propriété portant la valeur ; `null` (défaut) : la valeur est l'option elle-même. */
  readonly valueKey = input<keyof T | null>(null);
  /** Texte secondaire d'une option (défaut : `option.description`). */
  readonly descriptionWith = input<(option: T) => string | null | undefined>(defaultDescription);
  /** Option non sélectionnable (défaut : `option.disabled === true`). */
  readonly disabledWith = input<(option: T) => boolean>(defaultDisabled);
  /** Sélection multiple : la valeur est un tableau. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Filtre localement pendant la saisie ; `false` pour une recherche serveur. */
  readonly filter = input(true, { transform: booleanAttribute });
  /** Recherche en cours (affiche « Chargement… » dans la liste). */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Délai (ms) avant l'émission de `search`. */
  readonly searchDebounce = input(300, { transform: numberAttribute });
  /** Bouton d'effacement de la sélection. */
  readonly clearable = input(false, { transform: booleanAttribute });

  /** Libellé visible relié au champ. */
  readonly label = input<string>();
  /** Nom accessible si aucun libellé visible n'est fourni. */
  readonly ariaLabel = input<string>();
  readonly placeholder = input<string>();
  /** Texte d'aide affiché sous le champ. */
  readonly hint = input<string>();
  /** Message d'erreur ; active l'état invalide. */
  readonly error = input<string | null>();
  /** État invalide (lié automatiquement par `[formField]`), affiché après interaction. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Champ touché (lié automatiquement par `[formField]`). */
  readonly touched = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Affiche l'indicateur obligatoire (`aria-required`). */
  readonly required = input(false, { transform: booleanAttribute });
  readonly size = input<GestioComboboxSize>('md');
  /** Identifiant du champ natif. Généré automatiquement si absent. */
  readonly inputId = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioComboboxLabels>>({});

  /** Texte recherché, émis après `searchDebounce` ms (recherche serveur). */
  readonly search = output<string>();
  /** Émis quand le focus quitte le composant (marque le champ comme touché). */
  readonly touch = output<void>();

  private readonly generatedId = gestioUniqueId('gestio-combobox');
  protected readonly controlId = computed(() => this.inputId() ?? this.generatedId);
  protected readonly labelId = `${this.generatedId}-label`;
  protected readonly listboxId = `${this.generatedId}-listbox`;
  protected readonly hintId = `${this.generatedId}-hint`;
  protected readonly errorId = `${this.generatedId}-error`;
  protected readonly positions = POSITIONS;

  protected readonly text = computed<GestioComboboxLabels>(() => ({
    ...GESTIO_COMBOBOX_LABELS,
    ...this.labels(),
  }));

  protected readonly open = signal(false);
  /** Texte du champ. */
  protected readonly inputText = signal('');
  /** Texte de filtrage ('' : toutes les options). */
  private readonly query = signal('');
  protected readonly activeIndex = signal(-1);
  protected readonly announcement = signal('');
  private readonly values = signal<readonly unknown[]>([]);
  /** Options choisies par l'utilisateur : leur libellé reste connu si `options` change. */
  private readonly remembered = signal<ReadonlyMap<unknown, T>>(new Map());
  private readonly disabledByForm = signal(false);
  private readonly interacted = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly isRequired = computed(
    () => this.required() || (this.formField?.required() ?? false),
  );
  protected readonly showInvalid = computed(
    () =>
      !!this.error() ||
      (this.formField?.invalid() ?? false) ||
      (this.invalid() && (this.touched() || this.interacted())),
  );
  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.hintId);
    if (this.error()) ids.push(this.errorId);
    const external = this.formField?.describedBy();
    if (external) ids.push(external);
    return ids.length ? ids.join(' ') : null;
  });
  /** Nom de la liste : le libellé visible (propre ou du gestio-form-field), sinon ariaLabel. */
  protected readonly listLabelledBy = computed(() =>
    this.label() ? this.labelId : this.formField?.hasLabel() ? this.formField.labelId : null,
  );

  protected readonly visibleOptions = computed(() => {
    const options = this.options();
    const query = normalize(this.query());
    if (!this.filter() || !query) return options;
    const display = this.displayWith();
    return options.filter((option) => normalize(display(option)).includes(query));
  });

  protected readonly selectedItems = computed<SelectedItem<T>[]>(() => {
    const options = this.options();
    const remembered = this.remembered();
    const display = this.displayWith();
    return this.values().map((value) => {
      const option = options.find((o) => this.valueOf(o) === value) ?? remembered.get(value);
      return { value, option, label: option === undefined ? String(value) : display(option) };
    });
  });

  protected readonly hasValue = computed(() => this.values().length > 0);
  protected readonly activeId = computed(() => {
    const index = this.activeIndex();
    return this.open() && index >= 0 && index < this.visibleOptions().length
      ? this.optionId(index)
      : null;
  });

  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private readonly optionElements = viewChildren<ElementRef<HTMLElement>>('option');

  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private announceTimer: ReturnType<typeof setTimeout> | undefined;
  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Dans un gestio-form-field, son libellé cible le champ natif.
    effect(() => this.formField?.register({ id: this.controlId(), labelable: true }));

    // Mode simple : le champ affiche le libellé de la valeur (quand l'utilisateur ne tape pas).
    effect(() => {
      const items = this.selectedItems();
      if (this.multiple() || untracked(this.open)) return;
      this.inputText.set(items[0]?.label ?? '');
    });

    // Annonce du nombre de résultats, une fois la saisie (ou la réponse serveur) stabilisée.
    effect(() => {
      const open = this.open();
      const loading = this.loading();
      const count = this.visibleOptions().length;
      clearTimeout(this.announceTimer);
      if (!open || loading) return;
      this.announceTimer = setTimeout(() => {
        const text = untracked(this.text);
        this.announce(
          count === 0
            ? text.noResults
            : count === 1
              ? text.oneResult
              : interpolate(text.results, { count }),
        );
      }, ANNOUNCE_DELAY);
    });

    // Garde l'option active visible dans la liste.
    afterRenderEffect(() => {
      const element = this.optionElements()[this.activeIndex()]?.nativeElement;
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ block: 'nearest' });
      }
    });

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.searchTimer);
      clearTimeout(this.announceTimer);
    });
  }

  /** Place le focus dans le champ. */
  focus(options?: FocusOptions): void {
    this.control().nativeElement.focus(options);
  }

  writeValue(value: unknown): void {
    if (this.multiple()) {
      this.values.set(Array.isArray(value) ? [...value] : []);
    } else {
      this.values.set(value === null || value === undefined ? [] : [value]);
    }
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
    if (isDisabled) this.close();
  }

  protected optionId(index: number): string {
    return `${this.generatedId}-option-${index}`;
  }

  protected display(option: T): string {
    return this.displayWith()(option);
  }

  protected describe(option: T): string | null {
    return this.descriptionWith()(option) || null;
  }

  protected isOptionDisabled(option: T): boolean {
    return this.disabledWith()(option);
  }

  protected isSelected(option: T): boolean {
    return this.values().includes(this.valueOf(option));
  }

  protected removeLabel(label: string): string {
    return interpolate(this.text().remove, { label });
  }

  protected handleInput(element: HTMLInputElement): void {
    const value = element.value;
    this.inputText.set(value);
    this.query.set(value);
    this.open.set(true);
    // Première option sélectionnable mise en évidence : Entrée la choisit.
    this.activeIndex.set(value.trim() ? this.firstEnabled(0, 1) : -1);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.search.emit(value), this.searchDebounce());
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || event.isComposing) return;
    const open = this.open();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) {
          this.openList(event.altKey ? 'none' : 'selected');
        } else if (!event.altKey) {
          this.moveActive(1);
        }
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (event.altKey) {
          this.close();
        } else if (!open) {
          this.openList('last');
        } else {
          this.moveActive(-1);
        }
        return;
      case 'Home':
      case 'End':
        // Liste ouverte et option active : Début/Fin parcourent la liste, sinon le curseur.
        if (!open || this.activeIndex() < 0) return;
        event.preventDefault();
        this.activeIndex.set(
          event.key === 'Home'
            ? this.firstEnabled(0, 1)
            : this.firstEnabled(this.visibleOptions().length - 1, -1),
        );
        return;
      case 'Enter': {
        if (!open) return;
        const option = this.visibleOptions()[this.activeIndex()];
        event.preventDefault();
        if (option !== undefined) this.choose(option);
        return;
      }
      case 'Escape':
        if (open) {
          // Ferme la liste sans fermer une modale parente.
          event.preventDefault();
          event.stopPropagation();
          this.close();
          this.restoreText();
        } else if (this.clearable() && this.hasValue()) {
          event.preventDefault();
          event.stopPropagation();
          this.clear();
        }
        return;
      case 'Backspace':
        if (this.multiple() && this.inputText() === '' && this.hasValue()) {
          event.preventDefault();
          this.removeAt(this.values().length - 1);
        }
        return;
      case 'Tab':
        this.close();
        return;
    }
  }

  protected handleInputClick(): void {
    if (this.isDisabled() || this.open()) return;
    this.openList('selected');
  }

  protected toggleList(): void {
    if (this.isDisabled()) return;
    if (this.open()) {
      this.close();
      this.restoreText();
    } else {
      this.openList('selected');
    }
    this.focus();
  }

  protected handleFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement | null;
    if (host?.contains(event.relatedTarget as Node | null)) return;
    this.close();
    this.commitText();
    this.interacted.set(true);
    this.onTouched();
    this.touch.emit();
  }

  protected handleOutsideClick(event: MouseEvent): void {
    if (this.host.contains(event.target as Node | null)) return;
    this.close();
    this.commitText();
  }

  /** Clic sur une option : le focus reste dans le champ. */
  protected handleOptionClick(option: T): void {
    if (this.isOptionDisabled(option)) return;
    this.choose(option);
    this.focus();
  }

  /** Le survol déplace l'option active (comme les flèches). */
  protected hover(index: number, option: T): void {
    if (index !== this.activeIndex() && !this.isOptionDisabled(option)) {
      this.activeIndex.set(index);
    }
  }

  protected clear(): void {
    if (this.isDisabled()) return;
    this.publish([]);
    this.inputText.set('');
    this.query.set('');
    this.setNativeText('');
    this.focus();
  }

  protected removeAt(index: number): void {
    const item = this.selectedItems()[index];
    if (!item || this.isDisabled()) return;
    this.publish(this.values().filter((_, i) => i !== index));
    this.announce(interpolate(this.text().removed, { label: item.label }));
    this.focus();
  }

  private choose(option: T): void {
    if (this.isOptionDisabled(option)) return;
    const value = this.valueOf(option);
    this.remembered.update((map) => new Map(map).set(value, option));
    if (this.multiple()) {
      const selected = this.values().includes(value);
      this.publish(selected ? this.values().filter((v) => v !== value) : [...this.values(), value]);
      this.announce(
        interpolate(selected ? this.text().removed : this.text().added, {
          label: this.display(option),
        }),
      );
      // La liste reste ouverte pour enchaîner les choix ; la recherche repart de zéro.
      if (this.inputText()) {
        this.inputText.set('');
        this.query.set('');
        this.setNativeText('');
        this.activeIndex.set(this.firstEnabled(0, 1));
      }
      return;
    }
    this.publish([value]);
    this.close();
    this.inputText.set(this.display(option));
    this.setNativeText(this.display(option));
  }

  private openList(focus: 'selected' | 'last' | 'none'): void {
    this.query.set('');
    this.open.set(true);
    const options = this.visibleOptions();
    let index = -1;
    if (focus === 'selected') {
      index = options.findIndex((option) => this.isSelected(option));
      if (index === -1) index = this.firstEnabled(0, 1);
    } else if (focus === 'last') {
      index = this.firstEnabled(options.length - 1, -1);
    }
    this.activeIndex.set(index);
  }

  private close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
    this.query.set('');
  }

  /** Déplace l'option active en sautant les options désactivées (sans boucler). */
  private moveActive(step: 1 | -1): void {
    const current = this.activeIndex();
    const start =
      current < 0 ? (step === 1 ? 0 : this.visibleOptions().length - 1) : current + step;
    const next = this.firstEnabled(start, step);
    if (next !== -1) this.activeIndex.set(next);
  }

  private firstEnabled(start: number, step: 1 | -1): number {
    const options = this.visibleOptions();
    for (let index = start; index >= 0 && index < options.length; index += step) {
      if (!this.isOptionDisabled(options[index])) return index;
    }
    return -1;
  }

  /** Fin d'édition (mode simple) : champ vidé ⇒ valeur effacée, sinon libellé de la valeur. */
  private commitText(): void {
    if (this.multiple()) {
      this.inputText.set('');
      this.setNativeText('');
      return;
    }
    if (this.inputText().trim() === '' && this.hasValue()) {
      this.publish([]);
      return;
    }
    this.restoreText();
  }

  private restoreText(): void {
    const text = this.multiple() ? this.inputText() : (this.selectedItems()[0]?.label ?? '');
    this.inputText.set(text);
    this.setNativeText(text);
  }

  private publish(values: readonly unknown[]): void {
    this.values.set(values);
    this.onChange(this.multiple() ? [...values] : (values[0] ?? null));
  }

  private valueOf(option: T): unknown {
    const key = this.valueKey();
    return key === null ? option : (option as Record<PropertyKey, unknown>)[key as PropertyKey];
  }

  /** Écriture directe : une liaison inchangée ne réécrit pas le DOM. */
  private setNativeText(text: string): void {
    this.control().nativeElement.value = text;
  }

  private announce(message: string): void {
    // Réinitialise pour que deux messages identiques soient annoncés.
    this.announcement.set('');
    queueMicrotask(() => this.announcement.set(message));
  }
}
