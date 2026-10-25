import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GestioCheckbox } from './checkbox';

@Component({
  imports: [GestioCheckbox, ReactiveFormsModule],
  template: `
    <gestio-checkbox
      label="J’accepte les conditions"
      description="Consultables dans les paramètres"
      [formControl]="terms"
    />
    <gestio-checkbox label="Tout sélectionner" [(indeterminate)]="mixed" />
  `,
})
class Host {
  readonly terms = new FormControl(false, { nonNullable: true });
  readonly mixed = signal(true);
}

describe('GestioCheckbox', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const inputs = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];
    return { fixture, host: fixture.componentInstance, inputs };
  }

  it('propage une valeur booléenne dans les deux sens', async () => {
    const { fixture, host, inputs } = await setup();
    const [checkbox] = inputs;
    expect(checkbox.checked).toBe(false);

    checkbox.click();
    expect(host.terms.value).toBe(true);

    host.terms.setValue(false);
    await fixture.whenStable();
    expect(checkbox.checked).toBe(false);
  });

  it('coche en cliquant sur le label et relie la description', async () => {
    const { fixture, host, inputs } = await setup();
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    label.click();
    expect(host.terms.value).toBe(true);

    const descriptionId = inputs[0].getAttribute('aria-describedby');
    expect(fixture.nativeElement.querySelector(`#${descriptionId}`).textContent).toContain(
      'paramètres',
    );
  });

  it('applique setDisabledState', async () => {
    const { fixture, host, inputs } = await setup();
    host.terms.disable();
    await fixture.whenStable();
    expect(inputs[0].disabled).toBe(true);
  });

  it('réinitialise l’état indéterminé après interaction', async () => {
    const { fixture, host, inputs } = await setup();
    const mixed = inputs[1];
    expect(mixed.indeterminate).toBe(true);

    mixed.click();
    await fixture.whenStable();
    expect(host.mixed()).toBe(false);
    expect(mixed.indeterminate).toBe(false);
    expect(mixed.checked).toBe(true);
  });
});
