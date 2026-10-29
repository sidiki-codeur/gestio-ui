import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled, form } from '@angular/forms/signals';
import { GestioSegment } from './segment';
import { GestioSegmentedControl } from './segmented-control';

@Component({
  imports: [GestioSegmentedControl, GestioSegment],
  template: `
    <gestio-segmented-control
      ariaLabel="Période"
      size="sm"
      [fullWidth]="full()"
      [(value)]="period"
      [disabled]="locked()"
    >
      <gestio-segment value="day" label="Jour" />
      <gestio-segment value="week" label="Semaine" />
      <gestio-segment value="quarter" label="Trimestre" disabled />
      <gestio-segment value="month" ariaLabel="Mois">
        <svg gestioSegmentIcon viewBox="0 0 16 16"><rect width="16" height="16" /></svg>
      </gestio-segment>
    </gestio-segmented-control>
  `,
})
class Host {
  readonly period = signal<string | null>('week');
  readonly locked = signal(false);
  readonly full = signal(false);
}

@Component({
  imports: [GestioSegmentedControl, GestioSegment, ReactiveFormsModule, FormsModule],
  template: `
    <gestio-segmented-control id="reactive" ariaLabel="Affichage" [formControl]="view">
      @for (option of options; track option.id) {
        <gestio-segment [value]="option" [label]="option.label" />
      }
    </gestio-segmented-control>
    <gestio-segmented-control id="model" ariaLabel="Devise" [(ngModel)]="currency">
      <gestio-segment value="EUR">EUR</gestio-segment>
      <gestio-segment value="USD">USD</gestio-segment>
    </gestio-segmented-control>
  `,
})
class FormsHost {
  readonly options = [
    { id: 'list', label: 'Liste' },
    { id: 'grid', label: 'Grille' },
  ];
  readonly view = new FormControl(this.options[1]);
  readonly currency = signal('EUR');
}

@Component({
  imports: [GestioSegmentedControl, GestioSegment, FormField],
  template: `
    <gestio-segmented-control ariaLabel="Statut" [formField]="f.status">
      <gestio-segment value="draft" label="Brouillon" />
      <gestio-segment value="sent" label="Envoyée" />
    </gestio-segmented-control>
  `,
})
class SignalFormHost {
  readonly model = signal({ status: 'draft', locked: false });
  readonly f = form(this.model, (path) => {
    disabled(path.status, ({ valueOf }) => valueOf(path.locked));
  });
}

function key(target: HTMLElement, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe('GestioSegmentedControl', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const group = el.querySelector('gestio-segmented-control') as HTMLElement;
    const segments = Array.from(el.querySelectorAll('gestio-segment')) as HTMLElement[];
    return { fixture, host: fixture.componentInstance, group, segments };
  }

  it('expose le motif radiogroup : rôles, nom, état coché et segment désactivé', async () => {
    const { group, segments } = await setup();
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Période');
    expect(segments.map((s) => s.getAttribute('role'))).toEqual([
      'radio',
      'radio',
      'radio',
      'radio',
    ]);
    expect(segments.map((s) => s.getAttribute('aria-checked'))).toEqual([
      'false',
      'true',
      'false',
      'false',
    ]);
    expect(segments[2].getAttribute('aria-disabled')).toBe('true');
    expect(segments[3].getAttribute('aria-label')).toBe('Mois');
    expect(segments[3].querySelector('.gestio-segment__icon svg')).not.toBeNull();
    expect(segments[0].textContent).toContain('Jour');
    expect(segments[0].classList).toContain('gestio-segment--sm');
  });

  it('tabulation itinérante : seul le segment coché est focalisable', async () => {
    const { fixture, host, segments } = await setup();
    expect(segments.map((s) => s.tabIndex)).toEqual([-1, 0, -1, -1]);

    host.period.set(null);
    await fixture.whenStable();
    expect(segments.map((s) => s.tabIndex)).toEqual([0, -1, -1, -1]);
  });

  it('sélectionne au clic et ignore les segments désactivés', async () => {
    const { fixture, host, segments } = await setup();
    segments[0].click();
    await fixture.whenStable();
    expect(host.period()).toBe('day');
    expect(segments[0].getAttribute('aria-checked')).toBe('true');

    segments[2].click();
    expect(host.period()).toBe('day');
  });

  it('flèches, Début et Fin : déplacent le focus et sélectionnent en sautant les désactivés', async () => {
    const { fixture, host, segments } = await setup();
    segments[1].focus();

    expect(key(segments[1], 'ArrowRight').defaultPrevented).toBe(true);
    await fixture.whenStable();
    expect(host.period()).toBe('month');
    expect(document.activeElement).toBe(segments[3]);

    key(segments[3], 'ArrowDown');
    await fixture.whenStable();
    expect(host.period()).toBe('day');
    expect(document.activeElement).toBe(segments[0]);

    key(segments[0], 'ArrowLeft');
    await fixture.whenStable();
    expect(host.period()).toBe('month');

    key(segments[3], 'Home');
    await fixture.whenStable();
    expect(host.period()).toBe('day');

    key(segments[0], 'End');
    await fixture.whenStable();
    expect(host.period()).toBe('month');
  });

  it('Espace sélectionne le segment focalisé', async () => {
    const { fixture, host, segments } = await setup();
    host.period.set(null);
    await fixture.whenStable();
    expect(key(segments[0], ' ').defaultPrevented).toBe(true);
    expect(host.period()).toBe('day');
  });

  it('désactivé : aucun segment focalisable ni sélectionnable', async () => {
    const { fixture, host, group, segments } = await setup();
    host.locked.set(true);
    await fixture.whenStable();
    expect(group.getAttribute('aria-disabled')).toBe('true');
    expect(segments.every((s) => s.getAttribute('aria-disabled') === 'true')).toBe(true);
    expect(segments.every((s) => s.tabIndex === -1)).toBe(true);
    segments[0].click();
    expect(host.period()).toBe('week');
  });

  it('pleine largeur : classes sur le groupe et les segments', async () => {
    const { fixture, host, group, segments } = await setup();
    host.full.set(true);
    await fixture.whenStable();
    expect(group.classList).toContain('gestio-segmented-control--full-width');
    expect(segments[0].classList).toContain('gestio-segment--stretch');
  });

  it('Reactive Forms et ngModel : valeurs objet, écriture, lecture, touched', async () => {
    const fixture = TestBed.createComponent(FormsHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const host = fixture.componentInstance;
    const reactive = Array.from(el.querySelectorAll('#reactive gestio-segment')) as HTMLElement[];
    expect(reactive[1].getAttribute('aria-checked')).toBe('true');

    reactive[0].click();
    expect(host.view.value).toBe(host.options[0]);
    reactive[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    expect(host.view.touched).toBe(true);

    host.view.disable();
    await fixture.whenStable();
    expect(reactive[0].getAttribute('aria-disabled')).toBe('true');

    const currencies = Array.from(el.querySelectorAll('#model gestio-segment')) as HTMLElement[];
    expect(currencies[0].getAttribute('aria-checked')).toBe('true');
    currencies[1].click();
    expect(host.currency()).toBe('USD');
  });

  it('Signal Forms : lit, écrit et applique l’état désactivé', async () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const segments = Array.from(el.querySelectorAll('gestio-segment')) as HTMLElement[];
    expect(segments[0].getAttribute('aria-checked')).toBe('true');

    segments[1].click();
    expect(fixture.componentInstance.model().status).toBe('sent');

    fixture.componentInstance.model.update((v) => ({ ...v, locked: true }));
    await fixture.whenStable();
    expect(segments[0].getAttribute('aria-disabled')).toBe('true');
  });
});
