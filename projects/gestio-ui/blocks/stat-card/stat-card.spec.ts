import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioStatCard } from './stat-card';

@Component({
  imports: [GestioStatCard],
  template: `
    <gestio-stat-card
      label="Chiffre d'affaires"
      [value]="value()"
      [valueFormat]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
      [delta]="delta()"
      [invertDelta]="invert()"
      comparison="vs mois dernier"
      [trend]="trend()"
      [loading]="loading()"
    />
  `,
})
class Host {
  readonly value = signal<number | string | null>(48250);
  readonly delta = signal<number | null>(12.5);
  readonly invert = signal(false);
  readonly trend = signal<number[]>([32, 35, 31, 40]);
  readonly loading = signal(false);
}

describe('GestioStatCard', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement.querySelector('gestio-stat-card') as HTMLElement;
    const text = (selector: string) => el.querySelector(selector)?.textContent?.trim() ?? null;
    return { fixture, host: fixture.componentInstance, el, text };
  }

  it('expose un groupe nommé par le libellé et formate la valeur', async () => {
    const { el, text } = await setup();
    const label = el.querySelector('.gestio-stat-card__label')!;
    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('aria-labelledby')).toBe(label.id);
    expect(text('.gestio-stat-card__value')?.replace(/\s/g, ' ')).toBe('48 250 €');
  });

  it('affiche une chaîne telle quelle et un tiret sans valeur', async () => {
    const { fixture, host, text } = await setup();
    host.value.set('3 j 4 h');
    await fixture.whenStable();
    expect(text('.gestio-stat-card__value')).toBe('3 j 4 h');
    host.value.set(null);
    await fixture.whenStable();
    expect(text('.gestio-stat-card__value')).toBe('—');
  });

  it('décrit une hausse favorable', async () => {
    const { el, text } = await setup();
    const delta = el.querySelector('.gestio-stat-card__delta')!;
    expect(delta.classList).toContain('gestio-stat-card__delta--positive');
    expect(
      text('.gestio-stat-card__delta [aria-hidden="true"]:not(svg)')?.replace(/\s/g, ' '),
    ).toBe('+12,5 %');
    expect(text('.gestio-stat-card__delta .gestio-stat-card__sr-only')?.replace(/\s/g, ' ')).toBe(
      'En hausse de 12,5 %',
    );
    expect(text('.gestio-stat-card__comparison')).toBe('vs mois dernier');
    expect(el.querySelector('.gestio-stat-card__meta')!.textContent).toContain('% vs mois');
  });

  it('inverse la tonalité avec invertDelta et gère la stabilité', async () => {
    const { fixture, host, el, text } = await setup();
    host.delta.set(-4);
    host.invert.set(true);
    await fixture.whenStable();
    expect(el.querySelector('.gestio-stat-card__delta')!.classList).toContain(
      'gestio-stat-card__delta--positive',
    );
    expect(text('.gestio-stat-card__delta .gestio-stat-card__sr-only')).toContain('En baisse');

    host.invert.set(false);
    await fixture.whenStable();
    expect(el.querySelector('.gestio-stat-card__delta')!.classList).toContain(
      'gestio-stat-card__delta--negative',
    );

    host.delta.set(0);
    await fixture.whenStable();
    expect(el.querySelector('.gestio-stat-card__delta')!.classList).toContain(
      'gestio-stat-card__delta--neutral',
    );
    expect(text('.gestio-stat-card__delta .gestio-stat-card__sr-only')).toBe('Stable');
  });

  it('dessine la courbe (masquée) et la décrit en texte', async () => {
    const { fixture, host, el } = await setup();
    const svg = el.querySelector('.gestio-stat-card__sparkline')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelector('polyline')!.getAttribute('points')!.split(' ')).toHaveLength(4);
    const description = svg.nextElementSibling!.textContent!.replace(/\s/g, ' ');
    expect(description).toContain('4 points');
    expect(description).toContain('de 32 € à 40 €');

    host.trend.set([5]);
    await fixture.whenStable();
    expect(el.querySelector('.gestio-stat-card__sparkline')).toBeNull();
  });

  it('en chargement : aria-busy, squelette et texte annoncé', async () => {
    const { fixture, host, el } = await setup();
    host.loading.set(true);
    await fixture.whenStable();
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('gestio-skeleton')).not.toBeNull();
    expect(el.querySelector('.gestio-stat-card__value')).toBeNull();
    expect(el.textContent).toContain('Chargement de l’indicateur');
  });
});
