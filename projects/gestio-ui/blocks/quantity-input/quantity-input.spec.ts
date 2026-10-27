import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, disabled, form, max } from '@angular/forms/signals';
import { GestioQuantityInput } from './quantity-input';

@Component({
  imports: [GestioQuantityInput],
  template: `
    <gestio-quantity-input
      label="Quantité"
      hint="Par carton de 2"
      [min]="2"
      [max]="10"
      [step]="2"
      [(value)]="quantity"
    />
  `,
})
class Host {
  readonly quantity = signal<number | null>(4);
}

@Component({
  imports: [GestioQuantityInput, FormField],
  template: `<gestio-quantity-input ariaLabel="Quantité" [formField]="f.qty" />`,
})
class FormHost {
  readonly model = signal({ qty: 1, locked: false });
  readonly f = form(this.model, (path) => {
    disabled(path.qty, ({ valueOf }) => valueOf(path.locked));
    max(path.qty, 2);
  });
}

describe('GestioQuantityInput', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const field = el.querySelector('input') as HTMLInputElement;
    const [minus, plus] = [...el.querySelectorAll<HTMLButtonElement>('button')];
    return { fixture, host: fixture.componentInstance, el, field, minus, plus };
  }

  it('champ numérique natif étiqueté, bornes et pas exposés', async () => {
    const { el, field, minus, plus } = await setup();
    expect(field.type).toBe('number');
    expect(field.value).toBe('4');
    expect(el.querySelector('label')!.getAttribute('for')).toBe(field.id);
    expect(field.getAttribute('min')).toBe('2');
    expect(field.getAttribute('max')).toBe('10');
    expect(field.getAttribute('step')).toBe('2');
    expect(field.getAttribute('aria-describedby')).toContain('-hint');
    expect(minus.getAttribute('aria-label')).toBe('Diminuer la quantité');
    expect(plus.getAttribute('aria-label')).toBe('Augmenter la quantité');
    expect(plus.getAttribute('aria-controls')).toBe(field.id);
  });

  it('− et + changent la valeur du pas, s’arrêtent aux bornes et annoncent la valeur', async () => {
    const { fixture, host, el, field, minus, plus } = await setup();
    plus.click();
    await fixture.whenStable();
    expect(host.quantity()).toBe(6);
    expect(field.value).toBe('6');
    expect(el.querySelector('[aria-live]')!.textContent).toBe('Quantité : 6');

    host.quantity.set(10);
    await fixture.whenStable();
    expect(plus.disabled).toBe(true);

    host.quantity.set(2);
    await fixture.whenStable();
    expect(minus.disabled).toBe(true);
    expect(plus.disabled).toBe(false);
  });

  it('saisie libre puis normalisation à la sortie du champ', async () => {
    const { fixture, host, field } = await setup();
    field.value = '15';
    field.dispatchEvent(new Event('input'));
    expect(host.quantity()).toBe(15);
    field.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.quantity()).toBe(10);
    expect(field.value).toBe('10');

    field.value = '5';
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.quantity()).toBe(6);

    field.value = '';
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
    expect(host.quantity()).toBeNull();
  });

  it('Signal Forms : lit, écrit, reçoit max du schéma et applique l’état désactivé', async () => {
    const fixture = TestBed.createComponent(FormHost);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const field = el.querySelector('input') as HTMLInputElement;
    expect(field.value).toBe('1');
    expect(field.getAttribute('aria-label')).toBe('Quantité');

    el.querySelectorAll<HTMLButtonElement>('button')[1].click();
    expect(fixture.componentInstance.model().qty).toBe(2);
    await fixture.whenStable();
    // Borne max fournie par le schéma.
    expect(field.getAttribute('max')).toBe('2');
    expect(el.querySelectorAll<HTMLButtonElement>('button')[1].disabled).toBe(true);

    fixture.componentInstance.model.update((v) => ({ ...v, locked: true }));
    await fixture.whenStable();
    expect(field.disabled).toBe(true);
    expect(el.querySelectorAll<HTMLButtonElement>('button')[1].disabled).toBe(true);
  });
});
