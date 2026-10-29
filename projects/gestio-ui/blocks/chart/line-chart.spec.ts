import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioChartSeries } from './chart';
import { GestioLineChart } from './line-chart';

@Component({
  imports: [GestioLineChart],
  template: `
    <gestio-line-chart
      heading="Trésorerie"
      description="Solde en fin de mois."
      [categories]="['Janv.', 'Févr.', 'Mars', 'Avr.']"
      [series]="series()"
      [area]="area()"
      [beginAtZero]="beginAtZero()"
      [labels]="{ showTable: 'Voir les données' }"
      locale="en-US"
    />
  `,
})
class Host {
  readonly series = signal<GestioChartSeries[]>([
    { name: 'Réel', data: [120, 150, null, 180] },
    { name: 'Prévision', data: [110, 140, 160, 175] },
  ]);
  readonly area = signal(false);
  readonly beginAtZero = signal(true);
}

describe('GestioLineChart', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement.querySelector('gestio-line-chart') as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('trace une courbe par série, interrompue par les valeurs absentes', async () => {
    const { el } = await setup();
    const lines = [...el.querySelectorAll('.gestio-chart__svg .gestio-chart__line')];
    expect(lines).toHaveLength(2);
    expect(lines[0].getAttribute('d')!.match(/M/g)).toHaveLength(2);
    expect(lines[1].getAttribute('d')!.match(/M/g)).toHaveLength(1);
    // Trait propre à chaque série (continu puis tirets).
    expect(lines[0].getAttribute('stroke-dasharray')).toBeNull();
    expect(lines[1].getAttribute('stroke-dasharray')).toBe('6 4');
    expect(el.querySelectorAll('.gestio-chart__svg .gestio-chart__marker')).toHaveLength(7);
  });

  it('décrit le graphique et applique la langue et les libellés', async () => {
    const { el } = await setup();
    const desc = el.querySelector('desc')!.textContent!;
    expect(desc).toContain('Solde en fin de mois.');
    expect(desc).toContain('2 série(s) sur 4 points, de 110 à 180');
    expect(el.querySelector('.gestio-chart-table__toggle')!.textContent!.trim()).toBe(
      'Voir les données',
    );
  });

  it('remplit l’aire sous les courbes sur demande', async () => {
    const { fixture, host, el } = await setup();
    expect(el.querySelector('.gestio-chart__area')).toBeNull();
    host.area.set(true);
    await fixture.whenStable();
    expect(el.querySelectorAll('.gestio-chart__area')).toHaveLength(2);
  });

  it('ajuste l’axe aux valeurs sans beginAtZero', async () => {
    const { fixture, host, el } = await setup();
    const ticks = () =>
      [...el.querySelectorAll('.gestio-chart__tick')].map((t) => t.textContent!.trim());
    expect(ticks()).toContain('0');
    host.beginAtZero.set(false);
    await fixture.whenStable();
    expect(ticks()).not.toContain('0');
  });

  it('passe d’une série à l’autre avec haut et bas', async () => {
    const { fixture, el } = await setup();
    const hits = () => [...el.querySelectorAll<SVGElement>('.gestio-chart__hit')];
    expect(hits()).toHaveLength(7);
    hits()[0].focus();
    hits()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Janv., Prévision : 110');
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    await fixture.whenStable();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Janv., Réel : 120');
    expect(el.querySelector('.gestio-chart__tooltip')!.textContent).toContain('Réel');
  });

  it('représente chaque série dans la légende par son trait et son marqueur', async () => {
    const { el } = await setup();
    const items = el.querySelectorAll('.gestio-chart__legend-item');
    expect(items).toHaveLength(2);
    expect(items[1].querySelector('line')!.getAttribute('stroke-dasharray')).toBe('6 4');
    expect(items[1].querySelector('.gestio-chart__marker')).not.toBeNull();
  });
});
