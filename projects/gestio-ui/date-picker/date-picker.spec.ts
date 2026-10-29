import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { GestioDatePicker, GestioDateRange, GestioDatePickerMode } from './date-picker';
import { formatPattern, parseDate } from './date-format';

@Component({
  imports: [GestioDatePicker, ReactiveFormsModule],
  template: `
    <gestio-date-picker
      label="Date d’échéance"
      hint="Au plus tard le 31 décembre"
      required
      [today]="today"
      [min]="min"
      [formControl]="due"
    />
  `,
})
class FormHost {
  readonly today = new Date(2026, 9, 15);
  readonly min = new Date(2026, 9, 1);
  readonly due = new FormControl<Date | null>(new Date(2026, 9, 20));
}

@Component({
  imports: [GestioDatePicker],
  template: `
    <gestio-date-picker
      ariaLabel="Période"
      [mode]="mode()"
      [today]="today"
      [(value)]="value"
      [(range)]="range"
    />
  `,
})
class ModelHost {
  readonly today = new Date(2026, 9, 15);
  readonly mode = signal<GestioDatePickerMode>('single');
  readonly value = signal<Date | null>(null);
  readonly range = signal<GestioDateRange>({ start: null, end: null });
}

@Component({
  imports: [GestioDatePicker, FormField],
  template: `<gestio-date-picker label="Livraison" [today]="today" [formField]="f.delivery" />`,
})
class SignalHost {
  readonly today = new Date(2026, 9, 15);
  readonly model = signal({ delivery: new Date(2026, 9, 22) as Date | null });
  readonly f = form(this.model);
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function press(target: Element, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('GestioDatePicker', () => {
  async function render<T>(host: new () => T) {
    const fixture = TestBed.createComponent(host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input') as HTMLInputElement;
    const toggle = el.querySelector('.gestio-date-picker__toggle') as HTMLButtonElement;
    const dialog = () => document.querySelector('.gestio-popover') as HTMLElement | null;
    const day = (key: string) =>
      document.querySelector(`.gestio-popover [data-date="${key}"]`) as HTMLButtonElement;
    const settle = () => fixture.whenStable();
    return { fixture, host: fixture.componentInstance, el, input, toggle, dialog, day, settle };
  }

  afterEach(() => {
    document.querySelectorAll('.gestio-popover').forEach((node) => node.remove());
  });

  it('associe le libellé, l’aide et le gabarit au champ texte', async () => {
    const { el, input, toggle } = await render(FormHost);
    const label = el.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.placeholder).toBe('jj/mm/aaaa');
    expect(el.querySelector(`#${input.getAttribute('aria-describedby')}`)?.textContent).toContain(
      '31 décembre',
    );
    expect(input.value).toBe('20/10/2026');
    expect(toggle.getAttribute('aria-haspopup')).toBe('dialog');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-label')).toBe('Choisir une date, sélection : 20 octobre 2026');
  });

  it('valide une saisie complète pendant la frappe', async () => {
    const { host, input } = await render(FormHost);
    type(input, '28/10/2026');
    expect(host.due.value).toEqual(new Date(2026, 9, 28));
    expect(input.value).toBe('28/10/2026');

    type(input, '');
    expect(host.due.value).toBeNull();
  });

  it('lit une saisie tolérante à la sortie du champ et la remet au format', async () => {
    const { fixture, host, input } = await render(FormHost);
    type(input, '5.11');
    expect(host.due.value).toEqual(new Date(2026, 9, 20));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.due.value).toEqual(new Date(2026, 10, 5));
    expect(input.value).toBe('05/11/2026');
    expect(host.due.touched).toBe(true);

    type(input, '3 déc. 26');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();
    expect(host.due.value).toEqual(new Date(2026, 11, 3));
    expect(input.value).toBe('03/12/2026');
  });

  it('signale une saisie non reconnue ou indisponible', async () => {
    const { fixture, host, el, input } = await render(FormHost);
    type(input, '31/02/2026');
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.due.value).toBeNull();
    // `required` active aussi le validateur natif d'Angular (RequiredValidator).
    expect(host.due.errors?.['gestioDate']).toEqual({ reason: 'invalid', text: '31/02/2026' });
    expect(input.value).toBe('31/02/2026');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('.gestio-field__error')?.textContent).toContain(
      'Format attendu : jj/mm/aaaa',
    );

    // Antérieure à `min`.
    type(input, '15/09/2026');
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.due.value).toBeNull();
    expect(host.due.errors?.['gestioDate'].reason).toBe('unavailable');

    type(input, '16/10/2026');
    await fixture.whenStable();
    expect(host.due.errors).toBeNull();
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it('applique writeValue et setDisabledState', async () => {
    const { fixture, host, input, toggle } = await render(FormHost);
    host.due.setValue(new Date(2027, 0, 2));
    await fixture.whenStable();
    expect(input.value).toBe('02/01/2027');

    host.due.disable();
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
    expect(toggle.disabled).toBe(true);
  });

  it('ouvre un calendrier modal centré sur la date choisie, puis ferme à la sélection', async () => {
    const { host, toggle, dialog, day, settle } = await render(FormHost);
    toggle.focus();
    toggle.click();
    await settle();

    const panel = dialog()!;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(panel.getAttribute('aria-label')).toBe('Choisir une date');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe(panel.id);
    expect(document.activeElement).toBe(day('2026-10-20'));
    // `min` est transmis au calendrier.
    expect(day('2026-10-01').getAttribute('aria-disabled')).toBeNull();

    day('2026-10-27').click();
    await settle();
    expect(host.due.value).toEqual(new Date(2026, 9, 27));
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });

  it('ferme avec Échap et rend le focus au bouton', async () => {
    const { host, toggle, dialog, day, settle } = await render(FormHost);
    toggle.click();
    await settle();
    press(day('2026-10-20'), 'Escape');
    await settle();
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(toggle);
    expect(host.due.value).toEqual(new Date(2026, 9, 20));
  });

  it('ouvre le calendrier avec Alt + flèche bas depuis le champ', async () => {
    const { input, dialog, settle } = await render(FormHost);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true }));
    await settle();
    expect(dialog()).not.toBeNull();
  });

  it('expose [(value)] et gère le mode plage', async () => {
    const { host, input, toggle, dialog, day, settle } = await render(ModelHost);
    type(input, '2026-10-12');
    expect(host.value()).toEqual(new Date(2026, 9, 12));

    host.mode.set('range');
    await settle();
    expect(input.placeholder).toBe('jj/mm/aaaa – jj/mm/aaaa');
    expect(toggle.getAttribute('aria-label')).toBe('Choisir une période');

    type(input, '01/10/2026 au 15/10/2026');
    expect(host.range()).toEqual({ start: new Date(2026, 9, 1), end: new Date(2026, 9, 15) });
    input.dispatchEvent(new Event('blur'));
    await settle();
    expect(input.value).toBe('01/10/2026 – 15/10/2026');

    toggle.click();
    await settle();
    expect(dialog()!.getAttribute('aria-label')).toBe('Choisir une période');
    day('2026-10-05').click();
    await settle();
    expect(dialog()).not.toBeNull();
    expect(host.range()).toEqual({ start: new Date(2026, 9, 1), end: new Date(2026, 9, 15) });
    day('2026-10-09').click();
    await settle();
    expect(dialog()).toBeNull();
    expect(host.range()).toEqual({ start: new Date(2026, 9, 5), end: new Date(2026, 9, 9) });
    expect(input.value).toBe('05/10/2026 – 09/10/2026');
  });

  it('signale une plage inversée', async () => {
    const { fixture, host, el, input, settle } = await render(ModelHost);
    host.mode.set('range');
    await settle();
    type(input, '15/10/2026 - 01/10/2026');
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.range()).toEqual({ start: null, end: null });
    expect(el.querySelector('.gestio-field__error')?.textContent).toContain('précède');
  });

  it('pilotable par Signal Forms ([formField])', async () => {
    const { fixture, host, input, toggle, day, settle } = await render(SignalHost);
    expect(input.value).toBe('22/10/2026');

    type(input, '30/10/2026');
    await fixture.whenStable();
    expect(host.model().delivery).toEqual(new Date(2026, 9, 30));

    toggle.click();
    await settle();
    day('2026-10-14').click();
    await settle();
    expect(host.model().delivery).toEqual(new Date(2026, 9, 14));
  });
});

describe('date-format', () => {
  it('suit l’ordre et le gabarit de la locale', () => {
    expect(formatPattern('fr-FR', { day: 'jj', month: 'mm', year: 'aaaa' })).toBe('jj/mm/aaaa');
    expect(formatPattern('en-US', { day: 'dd', month: 'mm', year: 'yyyy' })).toBe('mm/dd/yyyy');
    expect(parseDate('10/28/2026', 'en-US', 2026)).toEqual({
      kind: 'date',
      date: new Date(2026, 9, 28),
      complete: true,
    });
  });

  it('accepte chiffres collés, ISO et mois en lettres', () => {
    const date = (text: string) => {
      const parsed = parseDate(text, 'fr-FR', 2026);
      return parsed.kind === 'date' ? parsed.date : parsed.kind;
    };
    expect(date('28102026')).toEqual(new Date(2026, 9, 28));
    expect(date('281026')).toEqual(new Date(2026, 9, 28));
    expect(date('2026-10-28')).toEqual(new Date(2026, 9, 28));
    expect(date('28 octobre 2026')).toEqual(new Date(2026, 9, 28));
    expect(date('1er févr.')).toBe('invalid');
    expect(date('1 févr.')).toEqual(new Date(2026, 1, 1));
    expect(date('  ')).toBe('empty');
    expect(date('32/01/2026')).toBe('invalid');
  });
});
