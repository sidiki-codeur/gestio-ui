import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioDonutChart } from './donut-chart';

@Component({
  imports: [GestioDonutChart],
  template: `
    <gestio-donut-chart
      heading="Répartition des dépenses"
      [categories]="['Salaires', 'Loyers', 'Logiciels', 'Divers']"
      [values]="values()"
      [valueFormat]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
    />
  `,
})
class Host {
  readonly values = signal<(number | null)[]>([600, 300, 100, null]);
}

const clean = (value: string | null | undefined) => (value ?? '').replace(/\s/g, ' ').trim();

describe('GestioDonutChart', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement.querySelector('gestio-donut-chart') as HTMLElement;
    const hits = () => [...el.querySelectorAll<SVGElement>('.gestio-chart__hit')];
    return { fixture, host: fixture.componentInstance, el, hits };
  }

  it('dessine une part par valeur positive et affiche le total', async () => {
    const { el } = await setup();
    expect(el.querySelectorAll('.gestio-chart__slice')).toHaveLength(3);
    expect(clean(el.querySelector('.gestio-chart__center-value')!.textContent)).toBe('1 000 €');
    expect(clean(el.querySelector('desc')!.textContent)).toBe(
      'Graphique en anneau : 3 parts, total 1 000 €.',
    );
  });

  it('donne valeur et part dans la légende (pas seulement la couleur)', async () => {
    const { el } = await setup();
    const items = [...el.querySelectorAll('.gestio-chart__legend-item')].map((li) =>
      clean(li.textContent),
    );
    expect(items[0]).toBe('Salaires : 600 € (60 %)');
    expect(items[3]).toBe('Divers : 0 € (0 %)');
    expect(el.querySelectorAll('pattern')).toHaveLength(3);
  });

  it('fournit un tableau avec parts et total', async () => {
    const { el } = await setup();
    const head = [...el.querySelectorAll('thead th')].map((th) => clean(th.textContent));
    expect(head).toEqual(['Catégorie', 'Valeur', 'Part']);
    const foot = [...el.querySelectorAll('tfoot th, tfoot td')].map((c) => clean(c.textContent));
    expect(foot).toEqual(['Total', '1 000 €', '100 %']);
  });

  it('parcourt les parts au clavier dans l’ordre', async () => {
    const { fixture, el, hits } = await setup();
    expect(clean(hits()[1].getAttribute('aria-label'))).toBe('Loyers : 300 € (30 %)');
    hits()[0].focus();
    hits()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(hits()[1]);
    hits()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(hits()[2]);
    expect(clean(el.querySelector('.gestio-chart__tooltip')!.textContent)).toContain('Logiciels');
    hits()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(hits()[1]);
  });

  it('dessine un anneau complet pour une seule part et un état vide sans total', async () => {
    const { fixture, host, el } = await setup();
    host.values.set([500, 0, null, -20]);
    await fixture.whenStable();
    expect(el.querySelectorAll('.gestio-chart__slice')).toHaveLength(1);
    host.values.set([0, 0, 0, 0]);
    await fixture.whenStable();
    expect(el.querySelector('.gestio-chart__empty')).not.toBeNull();
  });
});
