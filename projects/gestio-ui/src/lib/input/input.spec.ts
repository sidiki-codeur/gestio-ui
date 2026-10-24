import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GestioInput } from './input';

@Component({
  imports: [GestioInput, ReactiveFormsModule],
  template: `
    <gestio-input
      label="Nom"
      hint="Tel qu’il apparaît sur la facture"
      [error]="error()"
      required
      [formControl]="name"
    />
    <gestio-input label="Quantité" type="number" [formControl]="quantity" />
    <gestio-input label="Mot de passe" type="password" [formControl]="password" />
  `,
})
class Host {
  readonly name = new FormControl('Durand', { nonNullable: true });
  readonly quantity = new FormControl<number | null>(3);
  readonly password = new FormControl('');
  readonly error = signal<string | null>(null);
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('GestioInput', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const inputs = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];
    return { fixture, host: fixture.componentInstance, inputs };
  }

  it('associe le label, l’aide et l’erreur au champ natif', async () => {
    const { fixture, host, inputs } = await setup();
    const [input] = inputs;
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;

    expect(label.htmlFor).toBe(input.id);
    expect(input.required).toBe(true);
    const hintId = input.getAttribute('aria-describedby')!;
    expect(fixture.nativeElement.querySelector(`#${hintId}`).textContent).toContain('facture');

    host.error.set('Le nom est obligatoire');
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(2);
    expect(fixture.nativeElement.querySelector(`#${ids[1]}`).textContent).toContain('obligatoire');
  });

  it('propage la valeur dans les deux sens', async () => {
    const { fixture, host, inputs } = await setup();
    const [input] = inputs;
    expect(input.value).toBe('Durand');

    type(input, 'Martin');
    expect(host.name.value).toBe('Martin');

    host.name.setValue('Bernard');
    await fixture.whenStable();
    expect(input.value).toBe('Bernard');
  });

  it('marque le contrôle comme touché au blur', async () => {
    const { host, inputs } = await setup();
    expect(host.name.touched).toBe(false);
    inputs[0].dispatchEvent(new Event('blur'));
    expect(host.name.touched).toBe(true);
  });

  it('expose number | null pour type="number"', async () => {
    const { host, inputs } = await setup();
    const quantity = inputs[1];
    expect(quantity.value).toBe('3');

    type(quantity, '12.5');
    expect(host.quantity.value).toBe(12.5);

    type(quantity, '');
    expect(host.quantity.value).toBeNull();
  });

  it('applique setDisabledState', async () => {
    const { fixture, host, inputs } = await setup();
    host.name.disable();
    await fixture.whenStable();
    expect(inputs[0].disabled).toBe(true);

    host.name.enable();
    await fixture.whenStable();
    expect(inputs[0].disabled).toBe(false);
  });

  it('affiche ou masque le mot de passe avec un bouton accessible', async () => {
    const { fixture, inputs } = await setup();
    const password = inputs[2];
    const toggle = fixture.nativeElement.querySelector(
      '.gestio-field__toggle',
    ) as HTMLButtonElement;

    expect(password.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe('Afficher le mot de passe');
    expect(toggle.getAttribute('aria-controls')).toBe(password.id);

    toggle.click();
    await fixture.whenStable();
    expect(password.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Masquer le mot de passe');
  });
});
