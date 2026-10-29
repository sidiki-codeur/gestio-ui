import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioBarChart } from './bar-chart';
import { GestioChartSeries } from './chart';
import { niceTicks } from './chart-utils';

@Component({
  imports: [GestioBarChart],
  template: `
    <gestio-bar-chart
      heading="Chiffre d’affaires mensuel"
      [categories]="categories()"
      [series]="series()"
      [stacked]="stacked()"
      [valueFormat]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
    />
  `,
})
class Host {
  readonly categories = signal(['Janv.', 'Févr.', 'Mars']);
  readonly series = signal<GestioChartSeries[]>([
    { name: '2025', data: [1000, 2000, 1500] },
    { name: '2026', data: [1200, null, 2400] },
  ]);
  readonly stacked = signal(false);
}

const clean = (value: string | null | undefined) => (value ?? '').replace(/\s/g, ' ').trim();

describe('niceTicks', () => {
  it('produit des graduations rondes couvrant le domaine', () => {
    expect(niceTicks(0, 2400, 5)).toEqual([0, 500, 1000, 1500, 2000, 2500]);
    expect(niceTicks(-3, 7, 5)).toEqual([-4, -2, 0, 2, 4, 6, 8]);
    expect(niceTicks(0, 0.9, 4)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(niceTicks(5, 5)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(niceTicks(0, 0)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });
});

describe('GestioBarChart', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement.querySelector('gestio-bar-chart') as HTMLElement;
    const hits = () => [...el.querySelectorAll<SVGElement>('.gestio-chart__hit')];
    return { fixture, host: fixture.componentInstance, el, hits };
  }

  it('expose une image nommée par le titre et décrite par un résumé', async () => {
    const { el } = await setup();
    const svg = el.querySelector('svg.gestio-chart__svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    const title = svg.querySelector('title')!;
    expect(svg.getAttribute('aria-labelledby')).toBe(title.id);
    expect(title.textContent).toBe('Chiffre d’affaires mensuel');
    const desc = svg.querySelector('desc')!;
    expect(svg.getAttribute('aria-describedby')).toBe(desc.id);
    expect(clean(desc.textContent)).toContain('2 série(s) sur 3 catégories, de 1 000 € à 2 400 €');
  });

  it('dessine une barre par valeur et des graduations formatées', async () => {
    const { el } = await setup();
    expect(el.querySelectorAll('.gestio-chart__bar')).toHaveLength(5);
    const ticks = [...el.querySelectorAll('.gestio-chart__tick')].map((t) => clean(t.textContent));
    expect(ticks).toContain('0 €');
    expect(ticks).toContain('2 500 €');
    expect(ticks).toContain('Févr.');
  });

  it('distingue les séries par un motif, repris dans la légende', async () => {
    const { el } = await setup();
    const patterns = el.querySelectorAll('pattern');
    expect(patterns).toHaveLength(1);
    const legend = [...el.querySelectorAll('.gestio-chart__legend-item')];
    expect(legend.map((li) => clean(li.textContent))).toEqual(['2025', '2026']);
    expect(legend[1].querySelector('rect')!.getAttribute('style')).toContain(patterns[0].id);
  });

  it('fournit un tableau de données équivalent, affichable par un bouton', async () => {
    const { fixture, el } = await setup();
    const wrap = el.querySelector('.gestio-chart-table__wrap')!;
    expect(wrap.classList).toContain('gestio-chart-table__wrap--hidden');
    const cells = [...el.querySelectorAll('tbody tr:nth-child(2) td')].map((c) =>
      clean(c.textContent),
    );
    expect(cells).toEqual(['2 000 €', 'Non renseigné']);
    expect(clean(el.querySelector('caption')!.textContent)).toBe('Chiffre d’affaires mensuel');

    const toggle = el.querySelector<HTMLButtonElement>('.gestio-chart-table__toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe(wrap.id);
    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(clean(toggle.textContent)).toBe('Masquer le tableau');
    expect(wrap.classList).not.toContain('gestio-chart-table__wrap--hidden');
    expect(wrap.getAttribute('role')).toBe('region');
  });

  it('navigue au clavier avec une tabulation itinérante et affiche l’info-bulle', async () => {
    const { fixture, el, hits } = await setup();
    const group = el.querySelector('.gestio-chart__hits')!;
    expect(group.getAttribute('role')).toBe('group');
    expect(hits().map((h) => h.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1', '-1']);
    expect(clean(hits()[0].getAttribute('aria-label'))).toBe('Janv., 2025 : 1 000 €');

    hits()[0].focus();
    await fixture.whenStable();
    expect(clean(el.querySelector('.gestio-chart__tooltip')!.textContent)).toContain(
      '2025 : 1 000 €',
    );
    expect(el.querySelector('.gestio-chart__focus')).not.toBeNull();

    hits()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(hits()[1]);
    expect(hits()[1].getAttribute('tabindex')).toBe('0');

    // Haut : série suivante pour la même catégorie (Févr. 2026 est absente).
    hits()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(hits()[1]);

    hits()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    hits()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement?.getAttribute('aria-label')).toContain('Mars, 2026');

    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await fixture.whenStable();
    expect(el.querySelector('.gestio-chart__tooltip')).toBeNull();
  });

  it('affiche l’info-bulle au survol', async () => {
    const { fixture, el, hits } = await setup();
    hits()[4].dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    expect(clean(el.querySelector('.gestio-chart__tooltip')!.textContent)).toContain('Mars');
    expect(el.querySelectorAll('.gestio-chart__mark--dim')).toHaveLength(4);
    hits()[4].dispatchEvent(new MouseEvent('mouseleave'));
    await fixture.whenStable();
    expect(el.querySelector('.gestio-chart__tooltip')).toBeNull();
  });

  it('empile les séries', async () => {
    const { fixture, host, el } = await setup();
    host.stacked.set(true);
    await fixture.whenStable();
    const bars = [...el.querySelectorAll('.gestio-chart__bar')];
    // Janv. : la barre 2026 commence où finit la barre 2025.
    const first = bars[0];
    const stackedOn = bars[3];
    expect(
      Number(stackedOn.getAttribute('y')) + Number(stackedOn.getAttribute('height')),
    ).toBeCloseTo(Number(first.getAttribute('y')));
    expect(el.querySelector('desc')!.textContent).toContain('3 catégories');
  });

  it('affiche un état vide sans données', async () => {
    const { fixture, host, el } = await setup();
    host.series.set([{ name: '2025', data: [null, null, null] }]);
    await fixture.whenStable();
    expect(el.querySelector('svg')).toBeNull();
    expect(clean(el.querySelector('.gestio-chart__empty')!.textContent)).toContain(
      'Aucune donnée à afficher',
    );
  });
});
