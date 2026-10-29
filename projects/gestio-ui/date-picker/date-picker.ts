import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  linkedSignal,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  GestioCalendar,
  GestioCalendarLabels,
  GestioCalendarMode,
  GestioDateRange,
  GestioWeekday,
  ɵcompareDays as compareDays,
  ɵisSameDay as isSameDay,
  ɵstartOfDay as startOfDay,
} from '@gestiolabs336/ui/blocks/calendar';
import { GestioSize, ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioPopoverTrigger } from '@gestiolabs336/ui/popover';
import { ParsedDate, formatDate, formatPattern, parseDate, splitRange } from './date-format';

export type { GestioDateRange } from '@gestiolabs336/ui/blocks/calendar';

/** `single` : une date (`Date | null`) ; `range` : une plage (`GestioDateRange`). */
export type GestioDatePickerMode = GestioCalendarMode;
export type GestioDatePickerSize = GestioSize;

/** Libellés du sélecteur de date (internationalisation). */
export interface GestioDatePickerLabels {
  /** Nom du bouton qui ouvre le calendrier. */
  openCalendar: string;
  /** Nom du bouton en mode `range`. */
  openRangeCalendar: string;
  /** Ajouté au nom du bouton quand une valeur est choisie ; `{date}` est remplacé. */
  selected: string;
  /** Nom de la fenêtre du calendrier. */
  dialog: string;
  /** Nom de la fenêtre en mode `range`. */
  rangeDialog: string;
  /** Lettres du gabarit affiché en indication (`jj/mm/aaaa`). */
  day: string;
  month: string;
  year: string;
  /** Erreur de saisie ; `{format}` est remplacé par le gabarit. */
  invalidDate: string;
  /** Date saisie hors bornes ou désactivée. */
  unavailableDate: string;
  /** Plage dont la fin précède le début. */
  invalidRange: string;
}

export const GESTIO_DATE_PICKER_LABELS: GestioDatePickerLabels = {
  openCalendar: 'Choisir une date',
  openRangeCalendar: 'Choisir une période',
  selected: 'sélection : {date}',
  dialog: 'Choisir une date',
  rangeDialog: 'Choisir une période',
  day: 'jj',
  month: 'mm',
  year: 'aaaa',
  invalidDate: 'Date non reconnue. Format attendu : {format}.',
  unavailableDate: 'Cette date n’est pas disponible.',
  invalidRange: 'La date de fin précède la date de début.',
};

/** Erreur de saisie exposée aux formulaires sous la clé `gestioDate`. */
export type GestioDatePickerError = 'invalid' | 'unavailable' | 'range';

/** Séparateur affiché entre les deux dates d'une plage. */
const RANGE_SEPARATOR = ' – ';
const EMPTY_RANGE: GestioDateRange = { start: null, end: null };

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Sélecteur de date : champ texte (saisie libre au format de la locale, lecture
 * tolérante) et bouton qui ouvre un calendrier dans une fenêtre surgissante modale
 * (motif ARIA « Date Picker Dialog »).
 *
 * ```html
 * <gestio-date-picker label="Date d'échéance" [min]="aujourdHui" formControlName="echeance" />
 * <gestio-date-picker label="Période" mode="range" [(range)]="periode" />
 * ```
 *
 * - Saisie : `28/10/2026`, `28.10.26`, `28102026`, `2026-10-28`, `28 oct. 2026` ou `28/10`
 *   (année courante). La valeur est validée pendant la frappe dès que l'année est complète,
 *   sinon à la sortie du champ ou avec Entrée, puis le texte est remis au format.
 * - Calendrier : focus sur la date sélectionnée, Échap ferme et rend le focus au bouton,
 *   choisir une date (ou la fin d'une plage) ferme la fenêtre.
 * - Formulaires : compatible Reactive Forms, `ngModel` et Signal Forms (`[formField]`).
 *   Une saisie non reconnue ou indisponible donne la valeur `null` et l'erreur
 *   `{ gestioDate: { reason, text } }`.
 */
@Component({
  selector: 'gestio-date-picker',
  imports: [GestioCalendar, GestioPopoverTrigger],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioDatePicker), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => GestioDatePicker), multi: true },
  ],
  host: { class: 'gestio-date-picker' },
})
export class GestioDatePicker implements ControlValueAccessor, Validator {
  readonly mode = input<GestioDatePickerMode>('single');
  /** Date choisie (mode `single`) ; `[(value)]`. */
  readonly value = model<Date | null>(null);
  /** Plage choisie (mode `range`) ; `[(range)]`. */
  readonly range = model<GestioDateRange>(EMPTY_RANGE);
  /** Première date sélectionnable. */
  readonly min = input<Date | null>();
  /** Dernière date sélectionnable. */
  readonly max = input<Date | null>();
  /** Rend certaines dates non sélectionnables (jours fériés, week-ends…). */
  readonly dateDisabled = input<((date: Date) => boolean) | null>(null);
  /** Locale du format de saisie et du calendrier. */
  readonly locale = input('fr-FR');
  /** Premier jour de la semaine du calendrier : 0 = dimanche, 1 = lundi. */
  readonly firstDayOfWeek = input<GestioWeekday>(1);
  /** Jour courant (mis en évidence, année par défaut de la saisie) ; par défaut la date du jour. */
  readonly today = input<Date>();
  /** Libellé visible associé au champ. */
  readonly label = input<string>();
  /** Nom accessible si aucun libellé visible n'est fourni. */
  readonly ariaLabel = input<string>();
  /** Texte indicatif ; par défaut le gabarit de la locale (`jj/mm/aaaa`). */
  readonly placeholder = input<string>();
  /** Texte d'aide affiché sous le champ. */
  readonly hint = input<string>();
  /** Message d'erreur. Sa présence active l'état invalide. */
  readonly error = input<string | null>();
  /** Force l'état invalide sans message (posé automatiquement par Signal Forms). */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Affiche l'indicateur et pose `aria-required`. */
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly size = input<GestioDatePickerSize>('md');
  /** Identifiant du champ texte. Généré automatiquement si absent. */
  readonly inputId = input<string>();
  readonly name = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioDatePickerLabels>>({});
  /** Surcharge partielle des libellés du calendrier. */
  readonly calendarLabels = input<Partial<GestioCalendarLabels>>({});

  private readonly generatedId = gestioUniqueId('gestio-date-picker');
  protected readonly controlId = computed(() => this.inputId() ?? this.generatedId);
  protected readonly hintId = `${this.generatedId}-hint`;
  protected readonly errorId = `${this.generatedId}-error`;

  private readonly createdToday = startOfDay(new Date());
  protected readonly todayDate = computed(() => this.today() ?? this.createdToday);

  protected readonly text = computed<GestioDatePickerLabels>(() => ({
    ...GESTIO_DATE_PICKER_LABELS,
    ...this.labels(),
  }));

  /** Gabarit de saisie (`jj/mm/aaaa`). */
  protected readonly pattern = computed(() => {
    const { day, month, year } = this.text();
    return formatPattern(this.locale(), { day, month, year });
  });

  protected readonly placeholderText = computed(() => {
    const placeholder = this.placeholder();
    if (placeholder !== undefined) return placeholder || null;
    return this.mode() === 'range'
      ? `${this.pattern()}${RANGE_SEPARATOR}${this.pattern()}`
      : this.pattern();
  });

  /** Texte affiché : mis au format quand la valeur change, sauf s'il désigne déjà cette valeur. */
  protected readonly inputText = linkedSignal<
    { mode: GestioDatePickerMode; value: Date | null; range: GestioDateRange; locale: string },
    string
  >({
    source: () => ({
      mode: this.mode(),
      value: this.value(),
      range: this.range(),
      locale: this.locale(),
    }),
    computation: (source, previous) => {
      if (!previous) return this.format(source.mode, source.value, source.range, source.locale);
      // Saisie non reconnue (valeur vidée) : le texte est conservé pour être corrigé.
      const cleared = source.mode === 'range' ? !source.range.start : source.value === null;
      if (cleared && untracked(this.inputError) !== null) return previous.value;
      if (this.describesCurrentValue(previous.value, source)) return previous.value;
      return this.format(source.mode, source.value, source.range, source.locale);
    },
  });

  /** Erreur de la dernière saisie. */
  protected readonly inputError = signal<GestioDatePickerError | null>(null);

  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly isInvalid = computed(
    () => this.invalid() || !!this.error() || this.inputError() !== null,
  );

  /** Message affiché : celui fourni par `error`, sinon celui de l'erreur de saisie. */
  protected readonly errorMessage = computed(() => {
    const error = this.error();
    if (error) return error;
    const text = this.text();
    switch (this.inputError()) {
      case 'invalid':
        return interpolate(text.invalidDate, { format: this.pattern() });
      case 'unavailable':
        return text.unavailableDate;
      case 'range':
        return text.invalidRange;
      default:
        return null;
    }
  });

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.hintId);
    if (this.errorMessage()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });

  protected readonly dialogLabel = computed(() =>
    this.mode() === 'range' ? this.text().rangeDialog : this.text().dialog,
  );

  protected readonly toggleLabel = computed(() => {
    const text = this.text();
    const base = this.mode() === 'range' ? text.openRangeCalendar : text.openCalendar;
    const long = new Intl.DateTimeFormat(this.locale(), { dateStyle: 'long' });
    let selection = '';
    if (this.mode() === 'range') {
      const { start, end } = this.range();
      if (start && end) selection = `${long.format(start)}${RANGE_SEPARATOR}${long.format(end)}`;
    } else {
      const value = this.value();
      if (value) selection = long.format(value);
    }
    return selection ? `${base}, ${interpolate(text.selected, { date: selection })}` : base;
  });

  /** Plage en cours de sélection dans le calendrier (validée quand la fin est choisie). */
  protected readonly draftRange = linkedSignal(() => this.range());

  private readonly control = viewChild<ElementRef<HTMLInputElement>>('control');
  private readonly popover = viewChild(GestioPopoverTrigger);

  private onChange: (value: Date | null | GestioDateRange) => void = () => {};
  private onTouched: () => void = () => {};

  // --- ControlValueAccessor ---

  writeValue(value: unknown): void {
    this.inputError.set(null);
    if (this.mode() === 'range') {
      const range = value as Partial<GestioDateRange> | null | undefined;
      this.range.set({
        start: isValidDate(range?.start) ? range.start : null,
        end: isValidDate(range?.end) ? range.end : null,
      });
    } else {
      this.value.set(isValidDate(value) ? value : null);
    }
    // Écriture directe : resynchronise le champ même si la valeur n'a pas changé.
    const element = this.control()?.nativeElement;
    if (element) element.value = this.inputText();
  }

  registerOnChange(fn: (value: Date | null | GestioDateRange) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  // --- Validator ---

  validate(): ValidationErrors | null {
    const reason = this.inputError();
    return reason ? { gestioDate: { reason, text: this.inputText() } } : null;
  }

  // --- Interactions ---

  /** Ouvre le calendrier. */
  open(): void {
    this.popover()?.open();
  }

  /** Ferme le calendrier. */
  close(): void {
    this.popover()?.close();
  }

  /** Alt + flèche bas dans le champ : ouvre le calendrier. */
  protected openFromKeyboard(event: Event): void {
    if (this.isDisabled() || this.readonly()) return;
    event.preventDefault();
    this.open();
  }

  protected handleInput(raw: string): void {
    this.inputText.set(raw);
    if (!raw.trim()) {
      this.commit(raw);
      return;
    }
    // Pendant la frappe, on ne valide qu'une saisie complète et correcte.
    if (this.mode() === 'range') {
      const parts = splitRange(raw);
      const start = parts && this.parse(parts[0]);
      const end = parts && this.parse(parts[1]);
      if (start?.kind === 'date' && end?.kind === 'date' && start.complete && end.complete) {
        this.commit(raw);
      }
    } else {
      const parsed = this.parse(raw);
      if (parsed.kind === 'date' && parsed.complete) this.commit(raw);
    }
  }

  protected handleBlur(): void {
    this.commit(this.inputText(), true);
    this.onTouched();
  }

  protected handleEnter(): void {
    this.commit(this.inputText(), true);
  }

  protected pickDate(date: Date | null): void {
    this.inputError.set(null);
    this.value.set(date);
    this.onChange(date);
    this.popover()?.close();
  }

  protected pickRange(range: GestioDateRange): void {
    this.draftRange.set(range);
    if (!range.start || !range.end) return;
    this.inputError.set(null);
    this.range.set(range);
    this.onChange(range);
    this.popover()?.close();
  }

  protected handleClosed(): void {
    this.draftRange.set(this.range());
    this.onTouched();
  }

  // --- Lecture de la saisie ---

  private parse(text: string): ParsedDate {
    return parseDate(text, this.locale(), this.todayDate().getFullYear());
  }

  /**
   * Valide la saisie : met à jour la valeur et l'erreur. `reformat` remet le texte
   * au format de la locale (sortie du champ, Entrée).
   */
  private commit(raw: string, reformat = false): void {
    if (this.mode() === 'range') {
      this.commitRange(raw);
    } else {
      this.commitSingle(raw);
    }
    if (reformat && this.inputError() === null) {
      this.inputText.set(this.format(this.mode(), this.value(), this.range(), this.locale()));
      const element = this.control()?.nativeElement;
      if (element) element.value = this.inputText();
    }
  }

  private commitSingle(raw: string): void {
    const parsed = this.parse(raw);
    let next: Date | null = null;
    let error: GestioDatePickerError | null = null;
    if (parsed.kind === 'invalid') error = 'invalid';
    else if (parsed.kind === 'date') {
      if (this.isSelectable(parsed.date)) next = parsed.date;
      else error = 'unavailable';
    }
    this.inputError.set(error);
    if (!isSameDay(next, this.value())) this.value.set(next);
    this.onChange(this.value());
  }

  private commitRange(raw: string): void {
    let next: GestioDateRange = EMPTY_RANGE;
    let error: GestioDatePickerError | null = null;
    if (raw.trim()) {
      const parts = splitRange(raw);
      const start = parts ? this.parse(parts[0]) : null;
      const end = parts ? this.parse(parts[1]) : null;
      if (start?.kind !== 'date' || end?.kind !== 'date') error = 'invalid';
      else if (compareDays(end.date, start.date) < 0) error = 'range';
      else if (!this.isSelectable(start.date) || !this.isSelectable(end.date)) {
        error = 'unavailable';
      } else next = { start: start.date, end: end.date };
    }
    this.inputError.set(error);
    const current = this.range();
    if (!isSameDay(next.start, current.start) || !isSameDay(next.end, current.end)) {
      this.range.set(next);
      this.draftRange.set(next);
    }
    this.onChange(this.range());
  }

  /** Mêmes règles que le calendrier : bornes et `dateDisabled`. */
  private isSelectable(date: Date): boolean {
    const min = this.min();
    const max = this.max();
    if (min && compareDays(date, min) < 0) return false;
    if (max && compareDays(date, max) > 0) return false;
    return !this.dateDisabled()?.(date);
  }

  private format(
    mode: GestioDatePickerMode,
    value: Date | null,
    range: GestioDateRange,
    locale: string,
  ): string {
    if (mode === 'range') {
      if (!range.start) return '';
      const start = formatDate(range.start, locale);
      return range.end ? `${start}${RANGE_SEPARATOR}${formatDate(range.end, locale)}` : start;
    }
    return value ? formatDate(value, locale) : '';
  }

  /** Le texte saisi désigne-t-il déjà la valeur courante ? (évite de reformater pendant la frappe) */
  private describesCurrentValue(
    text: string,
    source: {
      mode: GestioDatePickerMode;
      value: Date | null;
      range: GestioDateRange;
      locale: string;
    },
  ): boolean {
    const referenceYear = this.todayDate().getFullYear();
    const read = (part: string) => {
      const parsed = parseDate(part, source.locale, referenceYear);
      return parsed.kind === 'date' ? parsed.date : null;
    };
    if (source.mode === 'range') {
      const parts = splitRange(text);
      if (!text.trim()) return !source.range.start && !source.range.end;
      if (!parts) return false;
      return (
        isSameDay(read(parts[0]), source.range.start) && isSameDay(read(parts[1]), source.range.end)
      );
    }
    if (!text.trim()) return source.value === null;
    return isSameDay(read(text), source.value);
  }
}
