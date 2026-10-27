import { Component, computed, input, model, numberAttribute, output } from '@angular/core';
import {
  GestioWeekday,
  ɵaddDays as addDays,
  ɵaddMonths as addMonths,
  ɵcapitalize as capitalize,
  ɵcompareDays as compareDays,
  ɵdateKey as dateKey,
  ɵisSameDay as isSameDay,
  ɵisSameMonth as isSameMonth,
  ɵmonthWeeks as monthWeeks,
  ɵstartOfDay as startOfDay,
  ɵstartOfMonth as startOfMonth,
  ɵweekdayNames as weekdayNames,
} from '@gestiolabs336/ui/blocks/calendar';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

export type GestioCalendarEventVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

/** Événement affiché dans l'agenda. */
export interface GestioCalendarEvent {
  /** Identifiant unique (suivi des listes). */
  id: string | number;
  title: string;
  start: Date;
  /** Fin ; un événement sur plusieurs jours apparaît dans chacun d'eux. */
  end?: Date;
  /** Couleur ; `primary` par défaut. */
  variant?: GestioCalendarEventVariant;
  /** Journée entière : aucune heure affichée. */
  allDay?: boolean;
}

/** Émis par `moreClick` : jour concerné et tous ses événements. */
export interface GestioCalendarMoreEvent {
  date: Date;
  events: GestioCalendarEvent[];
}

/** Libellés de l'agenda (internationalisation). */
export interface GestioEventCalendarLabels {
  previousMonth: string;
  nextMonth: string;
  today: string;
  /** Lien « +2 autres » ; `{count}` est remplacé. */
  more: string;
  /** Nom accessible du lien « +N autres » ; `{count}` et `{date}` sont remplacés. */
  moreLabel: string;
  /** Ajouté au nom d'un jour ; `{count}` est remplacé. */
  eventCount: string;
  /** Pluriel de `eventCount`. */
  eventCountPlural: string;
  /** Ajouté au nom du jour courant. */
  todayMarker: string;
  allDay: string;
  /** Liste affichée sur petit écran quand le mois n'a aucun événement. */
  noEvents: string;
}

export const GESTIO_EVENT_CALENDAR_LABELS: GestioEventCalendarLabels = {
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  today: 'Aujourd’hui',
  more: '+{count} autres',
  moreLabel: '{count} autres événements le {date}',
  eventCount: '{count} événement',
  eventCountPlural: '{count} événements',
  todayMarker: 'aujourd’hui',
  allDay: 'Journée',
  noEvents: 'Aucun événement ce mois-ci.',
};

interface AgendaDay {
  readonly date: Date;
  readonly key: string;
  readonly inMonth: boolean;
  readonly today: boolean;
  readonly label: string;
  readonly events: GestioCalendarEvent[];
  readonly visible: GestioCalendarEvent[];
  readonly hidden: number;
  readonly moreText: string;
  readonly moreLabel: string;
  /** Pastilles affichées sur conteneur étroit (4 au plus). */
  readonly dots: GestioCalendarEvent[];
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/** Événements triés : journées entières d'abord, puis par heure de début. */
function byStart(a: GestioCalendarEvent, b: GestioCalendarEvent): number {
  if (!!a.allDay !== !!b.allDay) return a.allDay ? -1 : 1;
  return a.start.getTime() - b.start.getTime();
}

/**
 * Agenda en vue mensuelle : événements par jour, navigation entre les mois.
 *
 * ```html
 * <gestio-event-calendar
 *   [events]="rendezVous()"
 *   [(month)]="mois"
 *   (eventClick)="ouvrir($event)"
 *   (dayClick)="creer($event)"
 * />
 * ```
 *
 * Au-delà de `maxEventsPerDay`, un bouton « +N autres » émet `moreClick`.
 * Sur un conteneur étroit, les événements deviennent des pastilles et une liste
 * des événements du mois s'affiche sous la grille.
 */
@Component({
  selector: 'gestio-event-calendar',
  templateUrl: './event-calendar.html',
  styleUrl: './event-calendar.scss',
  host: { class: 'gestio-event-calendar' },
})
export class GestioEventCalendar {
  /** Événements à afficher. */
  readonly events = input<readonly GestioCalendarEvent[]>([]);
  /** Mois affiché (n'importe quel jour du mois) ; par défaut celui du jour courant. */
  readonly month = model<Date | null>(null);
  /** Événements visibles par jour avant le bouton « +N autres ». */
  readonly maxEventsPerDay = input(3, { transform: numberAttribute });
  /** Locale des noms de mois, de jours et des heures. */
  readonly locale = input('fr-FR');
  /** Premier jour de la semaine : 0 = dimanche, 1 = lundi. */
  readonly firstDayOfWeek = input<GestioWeekday>(1);
  /** Jour courant (mis en évidence) ; par défaut la date à la création du composant. */
  readonly today = input<Date>(startOfDay(new Date()));
  /** Nom accessible du tableau ; par défaut le mois affiché. */
  readonly ariaLabel = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioEventCalendarLabels>>({});

  /** Clic sur un événement. */
  readonly eventClick = output<GestioCalendarEvent>();
  /** Clic sur le numéro d'un jour. */
  readonly dayClick = output<Date>();
  /** Clic sur « +N autres ». */
  readonly moreClick = output<GestioCalendarMoreEvent>();

  protected readonly titleId = gestioUniqueId('gestio-event-calendar-title');

  protected readonly text = computed<GestioEventCalendarLabels>(() => ({
    ...GESTIO_EVENT_CALENDAR_LABELS,
    ...this.labels(),
  }));

  protected readonly viewMonth = computed(() => startOfMonth(this.month() ?? this.today()));
  protected readonly isCurrentMonth = computed(() => isSameMonth(this.viewMonth(), this.today()));

  protected readonly title = computed(() =>
    capitalize(
      new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(
        this.viewMonth(),
      ),
      this.locale(),
    ),
  );

  protected readonly weekdays = computed(() => {
    const long = weekdayNames(this.locale(), this.firstDayOfWeek(), 'long');
    const short = weekdayNames(this.locale(), this.firstDayOfWeek(), 'short');
    return long.map((name, index) => ({ long: name, short: short[index] }));
  });

  private readonly timeFormat = computed(
    () => new Intl.DateTimeFormat(this.locale(), { hour: '2-digit', minute: '2-digit' }),
  );

  /** Événements indexés par jour (clé `AAAA-MM-JJ`), multi-jours dépliés. */
  private readonly eventsByDay = computed(() => {
    const map = new Map<string, GestioCalendarEvent[]>();
    for (const event of [...this.events()].sort(byStart)) {
      const last = event.end && compareDays(event.end, event.start) > 0 ? event.end : event.start;
      // Garde-fou : un événement ne s'étale pas sur plus d'un an.
      for (let day = startOfDay(event.start), n = 0; compareDays(day, last) <= 0 && n < 366; n++) {
        const key = dateKey(day);
        map.set(key, [...(map.get(key) ?? []), event]);
        day = addDays(day, 1);
      }
    }
    return map;
  });

  protected readonly weeks = computed<AgendaDay[][]>(() => {
    const view = this.viewMonth();
    const max = Math.max(0, this.maxEventsPerDay());
    const text = this.text();
    const dayFormat = new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const byDay = this.eventsByDay();

    return monthWeeks(view, this.firstDayOfWeek()).map((week) =>
      week.map((date) => {
        const key = dateKey(date);
        const events = byDay.get(key) ?? [];
        // « +1 autre » prendrait la place d'un événement : on l'affiche directement.
        const visible = events.length > max + 1 ? events.slice(0, max) : events;
        const hidden = events.length - visible.length;
        const today = isSameDay(date, this.today());
        const name = dayFormat.format(date);
        const count = events.length
          ? interpolate(events.length > 1 ? text.eventCountPlural : text.eventCount, {
              count: events.length,
            })
          : '';
        return {
          date,
          key,
          inMonth: isSameMonth(date, view),
          today,
          label: [name, today ? text.todayMarker : '', count].filter(Boolean).join(', '),
          events,
          visible,
          hidden,
          moreText: interpolate(text.more, { count: hidden }),
          moreLabel: interpolate(text.moreLabel, { count: hidden, date: name }),
          dots: events.slice(0, 4),
        };
      }),
    );
  });

  /** Jours du mois ayant des événements (liste affichée sur conteneur étroit). */
  protected readonly agenda = computed(() =>
    this.weeks()
      .flat()
      .filter((day) => day.inMonth && day.events.length),
  );

  protected readonly agendaDayFormat = computed(
    () =>
      new Intl.DateTimeFormat(this.locale(), { weekday: 'long', day: 'numeric', month: 'long' }),
  );

  protected eventTime(event: GestioCalendarEvent): string {
    return event.allDay ? '' : this.timeFormat().format(event.start);
  }

  protected eventLabel(event: GestioCalendarEvent): string {
    return [event.allDay ? this.text().allDay : this.eventTime(event), event.title].join(' · ');
  }

  protected previousMonth(): void {
    this.month.set(addMonths(this.viewMonth(), -1));
  }

  protected nextMonth(): void {
    this.month.set(addMonths(this.viewMonth(), 1));
  }

  protected goToToday(): void {
    this.month.set(startOfMonth(this.today()));
  }
}
