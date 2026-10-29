import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  GestioCalendarEvent,
  GestioCalendarMoreEvent,
  GestioEventCalendar,
} from './event-calendar';

@Component({
  imports: [GestioEventCalendar],
  template: `
    <gestio-event-calendar
      [events]="events()"
      [(month)]="month"
      [today]="today"
      [maxEventsPerDay]="2"
      (eventClick)="clicked = $event"
      (dayClick)="day = $event"
      (moreClick)="more = $event"
    />
  `,
})
class Host {
  readonly today = new Date(2026, 9, 15);
  readonly month = signal<Date | null>(null);
  readonly events = signal<GestioCalendarEvent[]>([
    { id: 1, title: 'Revue budget', start: new Date(2026, 9, 15, 14, 0), variant: 'warning' },
    { id: 2, title: 'Point équipe', start: new Date(2026, 9, 15, 9, 30) },
    { id: 3, title: 'Inventaire', start: new Date(2026, 9, 15), allDay: true },
    { id: 4, title: 'Audit', start: new Date(2026, 9, 15, 17, 0), variant: 'danger' },
    {
      id: 5,
      title: 'Salon',
      start: new Date(2026, 9, 20),
      end: new Date(2026, 9, 22),
      allDay: true,
      variant: 'success',
    },
    { id: 6, title: 'Clôture', start: new Date(2026, 9, 27, 10, 0) },
    { id: 7, title: 'Relance', start: new Date(2026, 9, 27, 11, 0) },
    { id: 8, title: 'Livraison', start: new Date(2026, 9, 27, 15, 0) },
  ]);
  clicked: GestioCalendarEvent | null = null;
  day: Date | null = null;
  more: GestioCalendarMoreEvent | null = null;
}

describe('GestioEventCalendar', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const cell = (day: number) =>
      Array.from(el.querySelectorAll<HTMLTableCellElement>('td:not(.is-outside)'))[day - 1];
    const titles = (td: HTMLElement) =>
      Array.from(
        td.querySelectorAll('.gestio-event-calendar__events .gestio-event-calendar__event-title'),
      ).map((node) => node.textContent!.trim());
    const title = () => el.querySelector('.gestio-event-calendar__title')!.textContent!.trim();
    return { fixture, host: fixture.componentInstance, el, cell, titles, title };
  }

  it('affiche le mois courant avec en-têtes de jours accessibles', async () => {
    const { el, title } = await setup();
    expect(title()).toBe('Octobre 2026');
    const table = el.querySelector('table')!;
    expect(table.getAttribute('aria-labelledby')).toBe(
      el.querySelector('.gestio-event-calendar__title')!.id,
    );
    const headers = el.querySelectorAll('th');
    expect(headers[0].getAttribute('abbr')).toBe('lundi');
    expect(headers[0].textContent).toContain('lun.');
    // Jours hors du mois affichés et atténués.
    expect(el.querySelectorAll('td.is-outside').length).toBeGreaterThan(0);
  });

  it('met en évidence aujourd’hui et résume les événements du jour', async () => {
    const { cell } = await setup();
    const date = cell(15).querySelector('.gestio-event-calendar__date')!;
    expect(date.getAttribute('aria-current')).toBe('date');
    expect(date.getAttribute('aria-label')).toBe(
      'jeudi 15 octobre 2026, aujourd’hui, 4 événements',
    );
  });

  it('trie les événements et limite leur nombre avec « +N autres »', async () => {
    const { fixture, host, cell, titles } = await setup();
    expect(titles(cell(15))).toEqual(['Inventaire', 'Point équipe']);
    const more = cell(15).querySelector<HTMLButtonElement>('.gestio-event-calendar__more')!;
    expect(more.textContent!.trim()).toBe('+2 autres');
    expect(more.getAttribute('aria-label')).toBe('2 autres événements le jeudi 15 octobre 2026');

    more.click();
    await fixture.whenStable();
    expect(host.more!.date).toEqual(new Date(2026, 9, 15));
    expect(host.more!.events.map((e) => e.id)).toEqual([3, 2, 1, 4]);

    // Un seul événement en trop : affiché plutôt que « +1 autre ».
    expect(titles(cell(27))).toEqual(['Clôture', 'Relance', 'Livraison']);
    expect(cell(27).querySelector('.gestio-event-calendar__more')).toBeNull();
  });

  it('étale un événement sur plusieurs jours', async () => {
    const { cell, titles } = await setup();
    for (const day of [20, 21, 22]) expect(titles(cell(day))).toEqual(['Salon']);
    expect(titles(cell(23))).toEqual([]);
  });

  it('nomme un événement horaire par son texte visible (heure · titre)', async () => {
    const { cell } = await setup();
    const timed = cell(27).querySelector<HTMLButtonElement>('.gestio-event-calendar__event')!;
    expect(timed.hasAttribute('aria-label')).toBe(false);
    expect(timed.textContent!.replace(/\s+/g, ' ').trim()).toBe('10:00 · Clôture');
  });

  it('émet eventClick et dayClick', async () => {
    const { fixture, host, cell } = await setup();
    const event = cell(15).querySelector<HTMLButtonElement>('.gestio-event-calendar__event')!;
    expect(event.getAttribute('aria-label')).toBe('Journée · Inventaire');
    expect(event.classList).toContain('is-primary');
    event.click();
    cell(3).querySelector<HTMLButtonElement>('.gestio-event-calendar__date')!.click();
    await fixture.whenStable();
    expect(host.clicked!.id).toBe(3);
    expect(host.day).toEqual(new Date(2026, 9, 3));
  });

  it('navigue entre les mois et revient à aujourd’hui', async () => {
    const { fixture, host, el, title } = await setup();
    const [today, previous, next] = Array.from(
      el.querySelectorAll<HTMLButtonElement>('.gestio-event-calendar__actions button'),
    );
    expect(today.disabled).toBe(true);
    expect(previous.getAttribute('aria-label')).toBe('Mois précédent');

    next.click();
    await fixture.whenStable();
    expect(title()).toBe('Novembre 2026');
    expect(host.month()).toEqual(new Date(2026, 10, 1));
    expect(today.disabled).toBe(false);

    previous.click();
    previous.click();
    await fixture.whenStable();
    expect(title()).toBe('Septembre 2026');

    today.click();
    await fixture.whenStable();
    expect(title()).toBe('Octobre 2026');
  });

  it('prépare la liste des événements du mois pour les petits conteneurs', async () => {
    const { fixture, host, el } = await setup();
    const sections = el.querySelectorAll('.gestio-event-calendar__agenda-day');
    expect(sections).toHaveLength(5);
    expect(sections[0].getAttribute('aria-label')).toContain('jeudi 15 octobre 2026');

    host.month.set(new Date(2026, 0, 1));
    await fixture.whenStable();
    expect(el.querySelector('.gestio-event-calendar__empty')!.textContent).toContain(
      'Aucun événement',
    );
  });
});
