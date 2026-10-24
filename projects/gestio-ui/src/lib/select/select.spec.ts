import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GestioSelect, GestioSelectOption } from './select';

@Component({
  imports: [GestioSelect, ReactiveFormsModule],
  template: `
    <gestio-select label="Délai" placeholder="Choisir…" [options]="delays" [formControl]="delay" />
    <gestio-select label="Pays" [options]="countries" [formControl]="country" />
  `,
})
class Host {
  readonly delays: GestioSelectOption<number>[] = [
    { label: '15 jours', value: 15 },
    { label: '30 jours', value: 30 },
    { label: '60 jours', value: 60, disabled: true },
  ];
  readonly countries: GestioSelectOption<string>[] = [
    { label: 'France', value: 'FR' },
    { label: 'Belgique', value: 'BE' },
  ];
  readonly delay = new FormControl<number | null>(null);
  readonly country = new FormControl<string | null>('BE');
}

function choose(select: HTMLSelectElement, index: number): void {
  select.selectedIndex = index;
  select.dispatchEvent(new Event('change'));
}

describe('GestioSelect', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const selects = Array.from(
      fixture.nativeElement.querySelectorAll('select'),
    ) as HTMLSelectElement[];
    return { fixture, host: fixture.componentInstance, selects };
  }

  it('préserve le type numérique de la valeur', async () => {
    const { host, selects } = await setup();
    const [delay] = selects;
    expect(delay.selectedIndex).toBe(0); // placeholder

    choose(delay, 2);
    expect(host.delay.value).toBe(30);
    expect(typeof host.delay.value).toBe('number');

    choose(delay, 0);
    expect(host.delay.value).toBeNull();
  });

  it('sélectionne l’option correspondant à la valeur écrite par le formulaire', async () => {
    const { fixture, host, selects } = await setup();
    const [delay, country] = selects;
    expect(country.selectedIndex).toBe(1);

    host.delay.setValue(15);
    await fixture.whenStable();
    expect(delay.selectedIndex).toBe(1);
    expect(delay.options[3].disabled).toBe(true);

    choose(country, 0);
    expect(host.country.value).toBe('FR');
  });

  it('applique setDisabledState', async () => {
    const { fixture, host, selects } = await setup();
    host.country.disable();
    await fixture.whenStable();
    expect(selects[1].disabled).toBe(true);
  });
});
