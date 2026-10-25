import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, disabled, form, required } from '@angular/forms/signals';
import { GestioCheckbox } from '@gestiolabs336/ui/checkbox';
import { GestioInput } from '@gestiolabs336/ui/input';
import { GESTIO_RADIO_IMPORTS } from '@gestiolabs336/ui/radio';
import { GestioSelect, GestioSelectOption } from '@gestiolabs336/ui/select';
import { GestioSwitch } from '@gestiolabs336/ui/switch';

/**
 * Les champs Gestio passent par leur ControlValueAccessor : la directive
 * [formField] de Signal Forms doit les piloter sans adaptation.
 */
@Component({
  imports: [
    FormField,
    GestioInput,
    GestioCheckbox,
    GestioSwitch,
    GestioSelect,
    GESTIO_RADIO_IMPORTS,
  ],
  template: `
    <gestio-input label="Nom" [formField]="f.name" />
    <gestio-checkbox label="Conditions" [formField]="f.terms" />
    <gestio-switch label="Relances" [formField]="f.reminders" />
    <gestio-select label="Pays" [options]="countries" [formField]="f.country" />
    <gestio-radio-group label="Paiement" [formField]="f.payment">
      <gestio-radio value="card" label="Carte" />
      <gestio-radio value="transfer" label="Virement" />
    </gestio-radio-group>
  `,
})
class Host {
  readonly countries: GestioSelectOption<string>[] = [
    { label: 'France', value: 'fr' },
    { label: 'Belgique', value: 'be' },
  ];
  readonly model = signal({
    name: 'Ada',
    terms: false,
    reminders: true,
    country: 'fr',
    payment: 'card',
    locked: false,
  });
  readonly f = form(this.model, (path) => {
    required(path.name);
    disabled(path.reminders, ({ valueOf }) => valueOf(path.locked));
  });
}

describe('Signal Forms ([formField])', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const q = <E extends Element>(selector: string) => el.querySelector(selector) as E;
    return { fixture, host: fixture.componentInstance, el, q };
  }

  it('affiche les valeurs du modèle', async () => {
    const { q, el } = await setup();
    expect(q<HTMLInputElement>('gestio-input input').value).toBe('Ada');
    expect(q<HTMLInputElement>('gestio-checkbox input').checked).toBe(false);
    expect(q<HTMLInputElement>('gestio-switch input').checked).toBe(true);
    expect(q<HTMLSelectElement>('gestio-select select').selectedOptions[0].textContent).toContain(
      'France',
    );
    const radios = el.querySelectorAll<HTMLInputElement>('gestio-radio input');
    expect(radios[0].checked).toBe(true);
  });

  it('remonte les saisies dans le modèle', async () => {
    const { host, el, q } = await setup();
    const name = q<HTMLInputElement>('gestio-input input');
    name.value = 'Grace';
    name.dispatchEvent(new Event('input'));
    q<HTMLInputElement>('gestio-checkbox input').click();
    q<HTMLInputElement>('gestio-switch input').click();
    const select = q<HTMLSelectElement>('gestio-select select');
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    el.querySelectorAll<HTMLInputElement>('gestio-radio input')[1].click();

    expect(host.model()).toEqual({
      name: 'Grace',
      terms: true,
      reminders: false,
      country: 'be',
      payment: 'transfer',
      locked: false,
    });
  });

  it('applique l’état désactivé du schéma', async () => {
    const { fixture, host, q } = await setup();
    host.model.update((value) => ({ ...value, locked: true }));
    await fixture.whenStable();
    expect(q<HTMLInputElement>('gestio-switch input').disabled).toBe(true);
  });

  it('écrit dans le champ quand le modèle change', async () => {
    const { fixture, host, el, q } = await setup();
    host.model.update((value) => ({ ...value, name: 'Linus', payment: 'transfer', terms: true }));
    await fixture.whenStable();
    expect(q<HTMLInputElement>('gestio-input input').value).toBe('Linus');
    expect(q<HTMLInputElement>('gestio-checkbox input').checked).toBe(true);
    expect(el.querySelectorAll<HTMLInputElement>('gestio-radio input')[1].checked).toBe(true);
  });
});
