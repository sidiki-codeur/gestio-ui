import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioProgressBar, GestioProgressCircle } from './progress';

@Component({
  imports: [GestioProgressBar, GestioProgressCircle],
  template: `
    <gestio-progress-bar
      id="bar"
      label="Import des factures"
      [value]="value()"
      [max]="max()"
      [indeterminate]="indeterminate()"
      variant="success"
      showValue
    />
    <gestio-progress-bar
      id="custom"
      ariaLabel="Relances"
      [value]="12"
      [max]="40"
      valueText="12 sur 40"
    />
    <gestio-progress-circle
      id="circle"
      ariaLabel="Objectif mensuel"
      [value]="value()"
      [max]="max()"
      [indeterminate]="indeterminate()"
      showValue
      size="lg"
    />
    <gestio-progress-circle
      id="labelled"
      label="Sauvegarde"
      [value]="50"
      [labels]="{ indeterminate: 'Patientez' }"
    />
  `,
})
class Host {
  readonly value = signal(25);
  readonly max = signal(200);
  readonly indeterminate = signal(false);
}

describe('GestioProgress', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const bar = el.querySelector('#bar [role="progressbar"]') as HTMLElement;
    const circle = el.querySelector('#circle [role="progressbar"]') as HTMLElement;
    return { fixture, host: fixture.componentInstance, el, bar, circle };
  }

  it('barre : attributs ARIA, nom accessible via le libellé et pourcentage formaté', async () => {
    const { el, bar } = await setup();
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('200');
    expect(bar.getAttribute('aria-valuenow')).toBe('25');
    expect(bar.getAttribute('aria-valuetext')).toMatch(/^13\s%$/);
    const labelId = bar.getAttribute('aria-labelledby')!;
    expect(el.querySelector(`#${labelId}`)!.textContent).toBe('Import des factures');
    expect(bar.hasAttribute('aria-label')).toBe(false);
    expect(el.querySelector('#bar .gestio-progress-bar__value')!.textContent).toMatch(/13\s%/);
    expect(
      (el.querySelector('#bar .gestio-progress-bar__fill') as HTMLElement).style.inlineSize,
    ).toBe('12.5%');
    expect(el.querySelector('#bar')!.classList).toContain('gestio-progress-bar--success');
  });

  it('borne la valeur entre 0 et max', async () => {
    const { fixture, host, bar } = await setup();
    host.value.set(500);
    await fixture.whenStable();
    expect(bar.getAttribute('aria-valuenow')).toBe('200');
    host.value.set(-10);
    await fixture.whenStable();
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('mode indéterminé : sans aria-valuenow, texte annoncé et valeur masquée', async () => {
    const { fixture, host, el, bar, circle } = await setup();
    host.indeterminate.set(true);
    await fixture.whenStable();
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
    expect(bar.getAttribute('aria-valuetext')).toBe('En cours');
    expect(el.querySelector('#bar .gestio-progress-bar__value')).toBeNull();
    expect(el.querySelector('#bar')!.classList).toContain('gestio-progress-bar--indeterminate');
    expect(circle.hasAttribute('aria-valuenow')).toBe(false);
  });

  it('valueText remplace le pourcentage ; ariaLabel sans libellé visible', async () => {
    const { el } = await setup();
    const bar = el.querySelector('#custom [role="progressbar"]')!;
    expect(bar.getAttribute('aria-label')).toBe('Relances');
    expect(bar.getAttribute('aria-valuetext')).toBe('12 sur 40');
    expect(el.querySelector('#custom .gestio-progress-bar__header')).toBeNull();
  });

  it('cercle : ARIA, arc proportionnel et valeur centrale', async () => {
    const { el, circle } = await setup();
    expect(circle.getAttribute('aria-label')).toBe('Objectif mensuel');
    expect(circle.getAttribute('aria-valuenow')).toBe('25');
    const fill = el.querySelector('#circle .gestio-progress-circle__fill')!;
    expect(fill.getAttribute('stroke-dasharray')).toBe('12.5 100');
    expect(el.querySelector('#circle .gestio-progress-circle__value')!.textContent).toMatch(
      /13\s%/,
    );

    const labelled = el.querySelector('#labelled [role="progressbar"]')!;
    const labelId = labelled.getAttribute('aria-labelledby')!;
    expect(el.querySelector(`#${labelId}`)!.textContent).toBe('Sauvegarde');
    expect(labelled.getAttribute('aria-valuetext')).toMatch(/^50\s%$/);
  });
});
