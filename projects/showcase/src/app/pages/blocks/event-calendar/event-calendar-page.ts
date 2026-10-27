import { Component, signal } from '@angular/core';
import {
  GestioCalendarEvent,
  GestioCalendarMoreEvent,
  GestioEventCalendar,
} from '@gestiolabs336/ui/blocks/event-calendar';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

const dayFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' });

/** Événements du mois courant, pour que la démonstration reste vivante. */
function demoEvents(reference: Date): GestioCalendarEvent[] {
  const y = reference.getFullYear();
  const m = reference.getMonth();
  const at = (day: number, hour = 0, minute = 0) => new Date(y, m, day, hour, minute);
  return [
    { id: 1, title: 'Point commercial', start: at(3, 9, 30) },
    { id: 2, title: 'Maintenance serveur', start: at(6, 22), variant: 'warning' },
    { id: 3, title: 'Inventaire', start: at(10), allDay: true, variant: 'neutral' },
    { id: 4, title: 'Revue budget T4', start: at(10, 14), variant: 'primary' },
    { id: 5, title: 'Entretien candidat', start: at(10, 16), variant: 'success' },
    { id: 6, title: 'Relance impayés', start: at(10, 17, 30), variant: 'danger' },
    { id: 7, title: 'Appel fournisseur', start: at(10, 18) },
    {
      id: 8,
      title: 'Salon Équip’Pro',
      start: at(15),
      end: at(17),
      allDay: true,
      variant: 'success',
    },
    { id: 9, title: 'Clôture mensuelle', start: at(27), allDay: true, variant: 'danger' },
    { id: 10, title: 'Comité de direction', start: at(24, 10) },
  ];
}

@Component({
  selector: 'sc-event-calendar-page',
  imports: [GestioEventCalendar, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Agenda" eyebrow="Blocs">
      <code>gestio-event-calendar</code> présente les événements d’un mois : journées entières en
      tête, événements sur plusieurs jours répétés chaque jour, bouton « +N autres » au-delà d’un
      seuil. Sur un conteneur étroit, les événements deviennent des pastilles et une liste du mois
      s’affiche sous la grille.
    </sc-page-header>

    <sc-example
      heading="Planning de l’équipe"
      description="Cliquez sur un événement, un numéro de jour ou « +N autres »."
      [code]="code"
      stacked
    >
      <gestio-event-calendar
        [events]="events"
        [(month)]="month"
        [maxEventsPerDay]="3"
        (eventClick)="last.set('Événement : ' + $event.title)"
        (dayClick)="last.set('Jour : ' + format($event))"
        (moreClick)="onMore($event)"
      />
      <p class="sc-result" aria-live="polite">
        Dernière action : <strong>{{ last() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Conteneur étroit"
      description="Même composant dans une colonne de 22rem."
      [code]="narrowCode"
      stacked
    >
      <div style="max-width: 22rem">
        <gestio-event-calendar [events]="events" ariaLabel="Planning (vue compacte)" />
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-event-calendar" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Le composant n’effectue aucun chargement : écoutez <code>(monthChange)</code> pour
          récupérer les événements du mois affiché. Chaque événement doit avoir un
          <code>id</code> unique.
        </p>
      </div>
    </section>
  `,
})
export class EventCalendarPage {
  protected readonly events = demoEvents(new Date());
  protected readonly month = signal<Date | null>(null);
  protected readonly last = signal('aucune');

  protected format(date: Date): string {
    return dayFormat.format(date);
  }

  protected onMore(event: GestioCalendarMoreEvent): void {
    this.last.set(`${event.events.length} événements le ${this.format(event.date)}`);
  }

  protected readonly code = `<gestio-event-calendar
  [events]="events()"
  [(month)]="month"
  [maxEventsPerDay]="3"
  (eventClick)="open($event)"
  (dayClick)="create($event)"
  (moreClick)="showDay($event)"
/>

readonly events = signal<GestioCalendarEvent[]>([
  { id: 1, title: 'Point commercial', start: new Date(2026, 9, 3, 9, 30) },
  { id: 3, title: 'Inventaire', start: new Date(2026, 9, 10), allDay: true, variant: 'neutral' },
  { id: 8, title: 'Salon Équip’Pro', start: new Date(2026, 9, 15), end: new Date(2026, 9, 17),
    allDay: true, variant: 'success' },
]);`;

  protected readonly narrowCode = `<div style="max-width: 22rem">
  <gestio-event-calendar [events]="events()" ariaLabel="Planning (vue compacte)" />
</div>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'events',
      type: 'GestioCalendarEvent[]',
      default: '[]',
      description: '{ id, title, start, end?, variant?, allDay? }.',
    },
    {
      name: 'month',
      type: 'model<Date | null>',
      default: 'null',
      description: 'Mois affiché ; [(month)] ou (monthChange).',
    },
    {
      name: 'maxEventsPerDay',
      type: 'number',
      default: '3',
      description: 'Au-delà : « +N autres ».',
    },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Dates et heures.' },
    {
      name: 'firstDayOfWeek',
      type: '0 … 6',
      default: '1',
      description: 'Premier jour (0 = dimanche).',
    },
    { name: 'today', type: 'Date', default: 'maintenant', description: 'Jour mis en évidence.' },
    { name: 'ariaLabel', type: 'string', description: 'Nom du tableau (défaut : le mois).' },
    {
      name: 'labels',
      type: 'Partial<GestioEventCalendarLabels>',
      default: '{}',
      description: 'Libellés traduits.',
    },
    { name: '(eventClick)', type: 'GestioCalendarEvent', description: 'Clic sur un événement.' },
    { name: '(dayClick)', type: 'Date', description: 'Clic sur un numéro de jour.' },
    {
      name: '(moreClick)',
      type: 'GestioCalendarMoreEvent',
      description: '{ date, events } du jour.',
    },
  ];
}
