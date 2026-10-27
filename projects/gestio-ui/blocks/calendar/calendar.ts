import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import {
  GestioWeekday,
  addDays,
  addMonths,
  capitalize,
  compareDays,
  dateKey,
  isSameDay,
  isSameMonth,
  monthWeeks,
  startOfDay,
  startOfMonth,
  startOfWeek,
  weekdayNames,
} from './date-utils';

/** `single` : une date ; `range` : une plage début / fin. */
export type GestioCalendarMode = 'single' | 'range';

/** Plage de dates ; `end` reste `null` tant que la seconde date n'est pas choisie. */
export interface GestioDateRange {
  start: Date | null;
  end: Date | null;
}

/** Libellés du calendrier (internationalisation). */
export interface GestioCalendarLabels {
  previousMonth: string;
  nextMonth: string;
  /** Nom de la grille quand aucun `ariaLabel` n'est fourni ; `{month}` est remplacé. */
  grid: string;
  /** Ajouté au nom d'un jour non sélectionnable. */
  unavailable: string;
  /** Ajouté au nom du jour courant. */
  today: string;
  /** Ajouté au nom des bornes d'une plage. */
  rangeStart: string;
  rangeEnd: string;
}

export const GESTIO_CALENDAR_LABELS: GestioCalendarLabels = {
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  grid: '{month}',
  unavailable: 'indisponible',
  today: 'aujourd’hui',
  rangeStart: 'début de la période',
  rangeEnd: 'fin de la période',
};

const EMPTY_RANGE: GestioDateRange = { start: null, end: null };

interface CalendarDay {
  readonly date: Date;
  readonly key: string;
  readonly inMonth: boolean;
  readonly disabled: boolean;
  readonly today: boolean;
  readonly selected: boolean;
  readonly rangeStart: boolean;
  readonly rangeEnd: boolean;
  readonly inRange: boolean;
  readonly label: string;
}

/**
 * Calendrier mensuel pour choisir une date ou une plage de dates
 * (motif ARIA « Date Picker », partie grille).
 *
 * ```html
 * <gestio-calendar [(value)]="echeance" [min]="aujourdHui" />
 * <gestio-calendar mode="range" [(range)]="periode" />
 * ```
 *
 * Clavier : flèches (jour / semaine), Début/Fin (semaine), Page préc./suiv. (mois),
 * Maj + Page préc./suiv. (année), Entrée ou Espace pour sélectionner.
 * En mode `single`, compatible Reactive Forms, `ngModel` et Signal Forms (`[formField]`).
 */
@Component({
  selector: 'gestio-calendar',
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioCalendar), multi: true },
  ],
  host: {
    class: 'gestio-calendar',
    '[class.is-disabled]': 'isDisabled()',
    '(focusout)': 'handleFocusOut($event)',
  },
})
export class GestioCalendar implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly mode = input<GestioCalendarMode>('single');
  /** Date sélectionnée (mode `single`) ; `[(value)]`. */
  readonly value = model<Date | null>(null);
  /** Plage sélectionnée (mode `range`) ; `[(range)]`. */
  readonly range = model<GestioDateRange>(EMPTY_RANGE);
  /** Mois affiché (n'importe quel jour du mois) ; par défaut celui de la sélection ou du jour courant. */
  readonly month = model<Date | null>(null);
  /** Première date sélectionnable. */
  readonly min = input<Date | null>();
  /** Dernière date sélectionnable. */
  readonly max = input<Date | null>();
  /** Rend certaines dates non sélectionnables (jours fériés, week-ends…). */
  readonly dateDisabled = input<((date: Date) => boolean) | null>(null);
  /** Locale des noms de mois et de jours. */
  readonly locale = input('fr-FR');
  /** Premier jour de la semaine : 0 = dimanche, 1 = lundi. */
  readonly firstDayOfWeek = input<GestioWeekday>(1);
  /** Jour courant (mis en évidence) ; par défaut la date à la création du composant. */
  readonly today = input<Date>(startOfDay(new Date()));
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Nom accessible de la grille ; par défaut le mois affiché. */
  readonly ariaLabel = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioCalendarLabels>>({});

  protected readonly titleId = gestioUniqueId('gestio-calendar-title');
  private readonly disabledByForm = signal(false);
  /** Jour qui porte le focus clavier (tabindex roving). */
  private readonly focusDate = signal<Date | null>(null);

  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly text = computed<GestioCalendarLabels>(() => ({
    ...GESTIO_CALENDAR_LABELS,
    ...this.labels(),
  }));

  /** Premier jour du mois affiché. */
  protected readonly viewMonth = computed(() =>
    startOfMonth(
      this.month() ??
        this.focusDate() ??
        (this.mode() === 'range' ? this.range().start : this.value()) ??
        this.today(),
    ),
  );

  protected readonly title = computed(() =>
    capitalize(
      new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(
        this.viewMonth(),
      ),
      this.locale(),
    ),
  );

  protected readonly gridLabel = computed(
    () => this.ariaLabel() ?? this.text().grid.replace('{month}', this.title()),
  );

  protected readonly weekdays = computed(() => {
    const long = weekdayNames(this.locale(), this.firstDayOfWeek(), 'long');
    const short = weekdayNames(this.locale(), this.firstDayOfWeek(), 'short');
    return long.map((name, index) => ({ long: name, short: short[index] }));
  });

  protected readonly weeks = computed<CalendarDay[][]>(() => {
    const view = this.viewMonth();
    const formatter = new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const range = this.mode() === 'range' ? this.range() : null;
    const value = this.mode() === 'single' ? this.value() : null;
    const text = this.text();

    return monthWeeks(view, this.firstDayOfWeek()).map((week) =>
      week.map((date) => {
        const disabled = !this.isSelectable(date);
        const today = isSameDay(date, this.today());
        const rangeStart = !!range && isSameDay(date, range.start);
        const rangeEnd = !!range && isSameDay(date, range.end);
        const inRange =
          !!range?.start &&
          !!range.end &&
          compareDays(date, range.start) > 0 &&
          compareDays(date, range.end) < 0;
        const extras = [
          today ? text.today : '',
          rangeStart ? text.rangeStart : '',
          rangeEnd ? text.rangeEnd : '',
          disabled ? text.unavailable : '',
        ].filter(Boolean);
        return {
          date,
          key: dateKey(date),
          inMonth: isSameMonth(date, view),
          disabled,
          today,
          selected: isSameDay(date, value) || rangeStart || rangeEnd || inRange,
          rangeStart,
          rangeEnd,
          inRange,
          label: [formatter.format(date), ...extras].join(', '),
        };
      }),
    );
  });

  /** Jour qui reçoit `tabindex="0"` : focus courant, sinon sélection, aujourd'hui ou 1er du mois. */
  protected readonly tabbableKey = computed(() => {
    const view = this.viewMonth();
    const candidates = [
      this.focusDate(),
      this.mode() === 'range' ? this.range().start : this.value(),
      this.today(),
    ];
    const inView = candidates.find((date) => isSameMonth(date, view));
    return dateKey(inView ?? view);
  });

  protected readonly canGoPrevious = computed(() => {
    const min = this.min();
    return !min || compareDays(addDays(this.viewMonth(), -1), min) >= 0;
  });

  protected readonly canGoNext = computed(() => {
    const max = this.max();
    return !max || compareDays(addMonths(this.viewMonth(), 1), max) <= 0;
  });

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.value.set(value instanceof Date && !Number.isNaN(value.getTime()) ? value : null);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  /** Indique si `date` peut être sélectionnée (bornes et `dateDisabled`). */
  isSelectable(date: Date): boolean {
    const min = this.min();
    const max = this.max();
    if (min && compareDays(date, min) < 0) return false;
    if (max && compareDays(date, max) > 0) return false;
    return !this.dateDisabled()?.(date);
  }

  protected previousMonth(): void {
    this.showMonth(addMonths(this.viewMonth(), -1));
  }

  protected nextMonth(): void {
    this.showMonth(addMonths(this.viewMonth(), 1));
  }

  protected select(day: CalendarDay): void {
    if (this.isDisabled() || day.disabled) return;
    this.focusDate.set(day.date);
    if (!day.inMonth) this.month.set(startOfMonth(day.date));

    if (this.mode() === 'single') {
      this.value.set(day.date);
      this.onChange(day.date);
      return;
    }

    const { start, end } = this.range();
    if (!start || end || compareDays(day.date, start) < 0) {
      this.range.set({ start: day.date, end: null });
    } else {
      this.range.set({ start, end: day.date });
    }
  }

  protected handleKeydown(event: KeyboardEvent, day: CalendarDay): void {
    const first = this.firstDayOfWeek();
    let target: Date;
    switch (event.key) {
      case 'ArrowLeft':
        target = addDays(day.date, -1);
        break;
      case 'ArrowRight':
        target = addDays(day.date, 1);
        break;
      case 'ArrowUp':
        target = addDays(day.date, -7);
        break;
      case 'ArrowDown':
        target = addDays(day.date, 7);
        break;
      case 'Home':
        target = startOfWeek(day.date, first);
        break;
      case 'End':
        target = addDays(startOfWeek(day.date, first), 6);
        break;
      case 'PageUp':
        target = addMonths(day.date, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        target = addMonths(day.date, event.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    this.moveFocus(target);
  }

  protected handleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.nativeElement.contains(next)) this.onTouched();
  }

  /** Change de mois en gardant le même jour (borné) pour le focus clavier. */
  private showMonth(month: Date): void {
    const reference = this.focusDate() ?? this.viewMonth();
    const day = Math.min(
      reference.getDate(),
      new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    );
    this.focusDate.set(new Date(month.getFullYear(), month.getMonth(), day));
    this.month.set(startOfMonth(month));
  }

  private moveFocus(target: Date): void {
    const view = this.viewMonth();
    this.focusDate.set(target);
    if (!isSameMonth(target, view)) this.month.set(startOfMonth(target));
    const key = dateKey(target);
    afterNextRender(
      () =>
        this.host.nativeElement.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)?.focus(),
      { injector: this.injector },
    );
  }
}
