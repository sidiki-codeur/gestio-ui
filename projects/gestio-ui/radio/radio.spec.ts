import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GESTIO_RADIO_IMPORTS } from './public-api';

interface Plan {
  readonly id: string;
}

const MONTHLY: Plan = { id: 'monthly' };
const YEARLY: Plan = { id: 'yearly' };

@Component({
  imports: [GESTIO_RADIO_IMPORTS, ReactiveFormsModule],
  template: `
    <gestio-radio-group
      label="Facturation"
      hint="Modifiable à tout moment"
      [error]="error()"
      required
      [formControl]="plan"
    >
      <gestio-radio [value]="monthly" label="Mensuelle" />
      <gestio-radio [value]="yearly" label="Annuelle" description="2 mois offerts" />
    </gestio-radio-group>
    <gestio-radio-group ariaLabel="Taille" name="taille" [(value)]="size">
      <gestio-radio value="s" label="S" />
      <gestio-radio value="m" label="M" disabled />
    </gestio-radio-group>
  `,
})
class Host {
  readonly monthly = MONTHLY;
  readonly yearly = YEARLY;
  readonly plan = new FormControl<Plan | null>(MONTHLY);
  readonly size = signal<string | null>(null);
  readonly error = signal<string | null>(null);
}

describe('GestioRadioGroup', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const radios = Array.from(el.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
    const groups = Array.from(el.querySelectorAll('fieldset')) as HTMLFieldSetElement[];
    return { fixture, host: fixture.componentInstance, el, radios, groups };
  }

  it('expose une légende et un nom commun aux radios', async () => {
    const { radios, groups } = await setup();
    expect(groups[0].getAttribute('role')).toBe('radiogroup');
    expect(groups[0].querySelector('legend')?.textContent).toContain('Facturation');
    expect(groups[0].getAttribute('aria-required')).toBe('true');
    expect(radios[0].name).toBe(radios[1].name);
    expect(radios[2].name).toBe('taille');
    expect(groups[1].getAttribute('aria-label')).toBe('Taille');
  });

  it('synchronise une valeur objet avec le formulaire', async () => {
    const { fixture, host, radios } = await setup();
    expect(radios[0].checked).toBe(true);

    radios[1].click();
    expect(host.plan.value).toBe(YEARLY);

    host.plan.setValue(MONTHLY);
    await fixture.whenStable();
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
  });

  it('relie aide, description et erreur', async () => {
    const { fixture, host, el, radios, groups } = await setup();
    host.error.set('Choisissez une formule');
    await fixture.whenStable();
    const ids = groups[0].getAttribute('aria-describedby')!.split(' ');
    expect(ids.map((id) => el.querySelector(`#${id}`)?.textContent?.trim())).toEqual([
      'Modifiable à tout moment',
      'Choisissez une formule',
    ]);
    expect(groups[0].getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector(`#${radios[1].getAttribute('aria-describedby')}`)?.textContent).toBe(
      '2 mois offerts',
    );
  });

  it('gère [(value)], le choix désactivé et setDisabledState', async () => {
    const { fixture, host, radios, groups } = await setup();
    radios[2].click();
    expect(host.size()).toBe('s');
    expect(radios[3].disabled).toBe(true);

    host.plan.disable();
    await fixture.whenStable();
    expect(groups[0].disabled).toBe(true);
  });
});
