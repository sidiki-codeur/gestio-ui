import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GestioSize, ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioFormField } from '@gestiolabs336/ui/form-field';
import { GestioChip, GestioChipVariant } from './chip';

/** Libellés de la saisie de mots-clés (internationalisation). */
export interface GestioChipInputLabels {
  /** Consigne lue avec le champ (aria-describedby). */
  instructions: string;
  /** Nom de la liste des valeurs saisies. */
  list: string;
  /** Nom du bouton de suppression ; `{label}` est remplacé. */
  remove: string;
  /** Annonce après un ajout ; `{label}` est remplacé. */
  added: string;
  /** Annonce après une suppression ; `{label}` est remplacé. */
  removed: string;
  /** Annonce d'un doublon refusé ; `{label}` est remplacé. */
  duplicate: string;
  /** Annonce quand `maxChips` est atteint ; `{max}` est remplacé. */
  limit: string;
}

export const GESTIO_CHIP_INPUT_LABELS: GestioChipInputLabels = {
  instructions: 'Entrée ou virgule pour ajouter, Retour arrière pour retirer le dernier.',
  list: 'Valeurs saisies',
  remove: 'Retirer {label}',
  added: '{label} ajouté',
  removed: '{label} retiré',
  duplicate: '{label} est déjà présent',
  limit: 'Limite de {max} atteinte',
};

export type GestioChipInputSize = GestioSize;

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/** Clé de comparaison des doublons : casse et espaces ignorés. */
function key(value: string): string {
  return value.trim().toLocaleLowerCase();
}

/**
 * Saisie de mots-clés sous forme de puces (étiquettes, destinataires, références…).
 *
 * ```html
 * <gestio-chip-input label="Étiquettes" placeholder="Ajouter une étiquette" formControlName="tags" />
 * ```
 *
 * - Entrée ou virgule ajoute le texte saisi (un collage « a, b, c » ajoute trois puces).
 * - Retour arrière dans le champ vide retire la dernière puce.
 * - Les doublons (casse ignorée) sont refusés ; `maxChips` limite le nombre de puces.
 * - Ajouts, suppressions et refus sont annoncés aux lecteurs d'écran.
 *
 * Valeur : `string[]`. Compatible Reactive Forms, `ngModel` et Signal Forms
 * (`[formField]`), et utilisable dans un `gestio-form-field`.
 */
@Component({
  selector: 'gestio-chip-input',
  imports: [GestioChip],
  templateUrl: './chip-input.html',
  styleUrl: './chip-input.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioChipInput), multi: true },
  ],
  host: { class: 'gestio-chip-input' },
})
export class GestioChipInput implements ControlValueAccessor {
  protected readonly formField = inject(GestioFormField, { optional: true });

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
  /** Affiche l'indicateur obligatoire. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Nombre maximal de puces (aucune limite par défaut). */
  readonly maxChips = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null || value === '' ? undefined : numberAttribute(value),
  });
  /** Couleur des puces. */
  readonly variant = input<GestioChipVariant>('neutral');
  readonly size = input<GestioChipInputSize>('md');
  /** Identifiant du champ natif. Généré automatiquement si absent. */
  readonly inputId = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioChipInputLabels>>({});

  /** Émis quand une puce est ajoutée. */
  readonly added = output<string>();
  /** Émis quand une puce est retirée. */
  readonly removed = output<string>();
  /** Émis quand le focus quitte le composant (marque le champ comme touché). */
  readonly touch = output<void>();

  private readonly generatedId = gestioUniqueId('gestio-chip-input');
  protected readonly controlId = computed(() => this.inputId() ?? this.generatedId);
  protected readonly labelId = `${this.generatedId}-label`;
  protected readonly hintId = `${this.generatedId}-hint`;
  protected readonly errorId = `${this.generatedId}-error`;
  protected readonly instructionsId = `${this.generatedId}-instructions`;

  protected readonly text = computed<GestioChipInputLabels>(() => ({
    ...GESTIO_CHIP_INPUT_LABELS,
    ...this.labels(),
  }));
  protected readonly chipLabels = computed(() => ({ remove: this.text().remove }));

  protected readonly chips = signal<readonly string[]>([]);
  protected readonly draft = signal('');
  protected readonly announcement = signal('');
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
  protected readonly isFull = computed(() => {
    const max = this.maxChips();
    return max !== undefined && this.chips().length >= max;
  });
  protected readonly describedBy = computed(() => {
    const ids: string[] = [this.instructionsId];
    if (this.hint()) ids.push(this.hintId);
    if (this.error()) ids.push(this.errorId);
    const external = this.formField?.describedBy();
    if (external) ids.push(external);
    return ids.join(' ');
  });

  private readonly control = viewChild<ElementRef<HTMLInputElement>>('control');

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Dans un gestio-form-field, son libellé cible le champ natif.
    effect(() => this.formField?.register({ id: this.controlId(), labelable: true }));
  }

  /** Place le focus dans le champ de saisie. */
  focus(options?: FocusOptions): void {
    this.control()?.nativeElement.focus(options);
  }

  writeValue(value: unknown): void {
    this.chips.set(
      Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [],
    );
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  protected handleInput(element: HTMLInputElement): void {
    const value = element.value;
    if (!value.includes(',')) {
      this.draft.set(value);
      return;
    }
    // Virgule tapée ou texte collé « a, b, c » : chaque segment complet devient une puce.
    const parts = value.split(',');
    const rest = parts.pop() ?? '';
    parts.forEach((part) => this.add(part));
    this.setDraft(rest);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter') {
      // Champ vide : laisse Entrée soumettre le formulaire.
      if (!this.draft().trim()) return;
      event.preventDefault();
      if (this.add(this.draft())) this.setDraft('');
      return;
    }
    if (event.key === 'Backspace' && this.draft() === '' && this.chips().length) {
      event.preventDefault();
      this.removeAt(this.chips().length - 1);
    }
  }

  protected handleFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement | null;
    if (host?.contains(event.relatedTarget as Node | null)) return;
    this.interacted.set(true);
    this.onTouched();
    this.touch.emit();
  }

  /** Un clic dans la zone (hors puces) place le focus dans le champ. */
  protected handleControlClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('button, input')) return;
    this.focus();
  }

  protected removeAt(index: number): void {
    if (this.isDisabled()) return;
    const removed = this.chips()[index];
    if (removed === undefined) return;
    this.publish(this.chips().filter((_, i) => i !== index));
    this.removed.emit(removed);
    this.announce(interpolate(this.text().removed, { label: removed }));
    // Le bouton supprimé disparaît : le focus revient au champ.
    this.focus();
  }

  /** Ajoute une puce ; renvoie `false` si elle est refusée (vide, doublon, limite). */
  private add(raw: string): boolean {
    const value = raw.trim();
    if (!value || this.isDisabled()) return false;
    if (this.chips().some((chip) => key(chip) === key(value))) {
      this.announce(interpolate(this.text().duplicate, { label: value }));
      return false;
    }
    if (this.isFull()) {
      this.announce(interpolate(this.text().limit, { max: this.maxChips() ?? 0 }));
      return false;
    }
    this.publish([...this.chips(), value]);
    this.added.emit(value);
    this.announce(interpolate(this.text().added, { label: value }));
    return true;
  }

  private publish(next: readonly string[]): void {
    this.chips.set(next);
    this.onChange([...next]);
  }

  private setDraft(value: string): void {
    this.draft.set(value);
    // Écriture directe : une liaison inchangée ne réécrit pas le DOM.
    const element = this.control()?.nativeElement;
    if (element) element.value = value;
  }

  private announce(message: string): void {
    // Réinitialise pour que deux messages identiques soient annoncés.
    this.announcement.set('');
    queueMicrotask(() => this.announcement.set(message));
  }
}
