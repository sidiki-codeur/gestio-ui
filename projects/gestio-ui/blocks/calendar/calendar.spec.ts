import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';
import { GestioCalendar, GestioCalendarMode, GestioDateRange } from './calendar';
import { addMonths, monthWeeks } from './date-utils';

@Component({
  imports: [GestioCalendar],
  template: `
    <gestio-calendar
      [mode]="mode()"
      [(value)]="value"
      [(range)]="range"
      [(month)]="month"
      [today]="today"
      [min]="min()"
      [max]="max()"
      [dateDisabled]="isSunday"
    />
  `,
})
class Host {
  readonly today = new Date(2026, 9, 15);
  readonly mode = signal<GestioCalendarMode>('single');
  readonly value = signal<Date | null>(null);
  readonly range = signal<GestioDateRange>({ start: null, end: null });
  readonly month = signal<Date | null>(null);
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  readonly isSunday = (date: Date) => date.getDay() === 0;
}

@Component({
  imports: [GestioCalendar, FormField],
  template: `<gestio-calendar [today]="today" [formField]="f.due" />`,
})
class FormHost {
  readonly today = new Date(2026, 9, 15);
  readonly model = signal({ due: new Date(2026, 9, 20) as Date | null });
  readonly f = form(this.model);
}

describe('GestioCalendar', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const day = (key: string) => el.querySelector(`[data-date="${key}"]`) as HTMLButtonElement;
    const title = () => el.querySelector('.gestio-calendar__title')!.textContent!.trim();
    return { fixture, host: fixture.componentInstance, el, day, title };
  }

  function press(target: HTMLElement, key: string, shiftKey = false) {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }));
  }

  it('affiche le mois du jour courant, en commençant le lundi', async () => {
    const { el, title, day } = await setup();
    expect(title()).toBe('Octobre 2026');
    const headers = el.querySelectorAll('th');
    expect(headers).toHaveLength(7);
    expect(headers[0].getAttribute('abbr')).toBe('lundi');
    expect(el.querySelector('table')!.getAttribute('role')).toBe('grid');
    // 1er octobre 2026 = jeudi : 3 cellules vides avant.
    expect(el.querySelectorAll('tbody tr')[0].querySelectorAll('td.is-outside')).toHaveLength(3);
    expect(day('2026-10-15').getAttribute('aria-current')).toBe('date');
    expect(day('2026-10-15').getAttribute('aria-label')).toContain('jeudi 15 octobre 2026');
  });

  it('un seul arrêt de tabulation, sur le jour courant par défaut', async () => {
    const { el, day } = await setup();
    const tabbable = el.querySelectorAll('.gestio-calendar__day[tabindex="0"]');
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toBe(day('2026-10-15'));
  });

  it('sélectionne une date au clic et met à jour aria-selected', async () => {
    const { fixture, host, day } = await setup();
    day('2026-10-20').click();
    await fixture.whenStable();
    expect(host.value()).toEqual(new Date(2026, 9, 20));
    expect(day('2026-10-20').closest('td')!.getAttribute('aria-selected')).toBe('true');
    expect(day('2026-10-20').getAttribute('tabindex')).toBe('0');
  });

  it('ignore les dates indisponibles (dateDisabled, min, max)', async () => {
    const { fixture, host, day } = await setup();
    host.min.set(new Date(2026, 9, 10));
    host.max.set(new Date(2026, 9, 25));
    await fixture.whenStable();

    for (const key of ['2026-10-18', '2026-10-05', '2026-10-28']) {
      expect(day(key).getAttribute('aria-disabled')).toBe('true');
      day(key).click();
    }
    expect(host.value()).toBeNull();
    expect(day('2026-10-18').getAttribute('aria-label')).toContain('indisponible');
  });

  it('navigation clavier : flèches, Début/Fin, Page préc./suiv. et Maj', async () => {
    const { fixture, host, el, day, title } = await setup();
    const focused = () => (document.activeElement as HTMLElement).dataset['date'];

    press(day('2026-10-15'), 'ArrowRight');
    await fixture.whenStable();
    expect(focused()).toBe('2026-10-16');

    press(day('2026-10-16'), 'ArrowDown');
    await fixture.whenStable();
    expect(focused()).toBe('2026-10-23');

    press(day('2026-10-23'), 'Home');
    await fixture.whenStable();
    expect(focused()).toBe('2026-10-19');

    press(day('2026-10-19'), 'End');
    await fixture.whenStable();
    expect(focused()).toBe('2026-10-25');

    press(day('2026-10-25'), 'PageDown');
    await fixture.whenStable();
    expect(title()).toBe('Novembre 2026');
    expect(focused()).toBe('2026-11-25');
    expect(host.month()).toEqual(new Date(2026, 10, 1));

    press(day('2026-11-25'), 'PageUp', true);
    await fixture.whenStable();
    expect(title()).toBe('Novembre 2025');
    expect(focused()).toBe('2025-11-25');

    press(day('2025-11-25'), 'Enter');
    day('2025-11-25').click();
    await fixture.whenStable();
    expect(host.value()).toEqual(new Date(2025, 10, 25));
  });

  it('boutons mois précédent / suivant, bornés par min et max', async () => {
    const { fixture, host, el, title } = await setup();
    const [previous, next] = Array.from(
      el.querySelectorAll<HTMLButtonElement>('.gestio-calendar__nav'),
    );
    expect(previous.getAttribute('aria-label')).toBe('Mois précédent');
    next.click();
    await fixture.whenStable();
    expect(title()).toBe('Novembre 2026');

    host.min.set(new Date(2026, 10, 3));
    await fixture.whenStable();
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
  });

  it('mode plage : début puis fin, réinitialisation au troisième clic', async () => {
    const { fixture, host, day } = await setup();
    host.mode.set('range');
    await fixture.whenStable();

    day('2026-10-12').click();
    await fixture.whenStable();
    expect(host.range()).toEqual({ start: new Date(2026, 9, 12), end: null });

    day('2026-10-16').click();
    await fixture.whenStable();
    expect(host.range()).toEqual({ start: new Date(2026, 9, 12), end: new Date(2026, 9, 16) });
    expect(day('2026-10-14').closest('td')!.classList).toContain('is-in-range');
    expect(day('2026-10-16').getAttribute('aria-label')).toContain('fin de la période');

    day('2026-10-20').click();
    await fixture.whenStable();
    expect(host.range()).toEqual({ start: new Date(2026, 9, 20), end: null });

    // Une date antérieure au début redémarre la plage.
    day('2026-10-02').click();
    await fixture.whenStable();
    expect(host.range()).toEqual({ start: new Date(2026, 9, 2), end: null });
  });

  it('pilotable par Signal Forms ([formField])', async () => {
    const fixture = TestBed.createComponent(FormHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const day = (key: string) => el.querySelector(`[data-date="${key}"]`) as HTMLButtonElement;
    expect(day('2026-10-20').closest('td')!.getAttribute('aria-selected')).toBe('true');

    day('2026-10-22').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.model().due).toEqual(new Date(2026, 9, 22));
  });
});

describe('date-utils', () => {
  it('addMonths borne le jour au dernier jour du mois', () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
  });

  it('monthWeeks couvre le mois par semaines complètes', () => {
    const weeks = monthWeeks(new Date(2026, 1, 10), 1);
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toEqual(new Date(2026, 0, 26));
    expect(weeks.at(-1)!.at(-1)).toEqual(new Date(2026, 2, 1));
  });
});
