import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  GESTIO_PRICING_TABLE_IMPORTS,
  GestioPricingBilling,
  GestioPricingSelection,
} from './public-api';

@Component({
  imports: [GESTIO_PRICING_TABLE_IMPORTS],
  template: `
    <gestio-pricing-table
      ariaLabel="Forfaits"
      yearlyHint="−20 %"
      [(billing)]="billing"
      (planSelect)="selected.set($event)"
    >
      <h2 gestioPricingHeader>Nos offres</h2>
      <gestio-pricing-plan
        name="Essentiel"
        [monthlyPrice]="0"
        [features]="['1 utilisateur', { label: 'API', included: false }]"
        current
      />
      <gestio-pricing-plan
        name="Pro"
        value="pro"
        highlighted
        description="Pour les équipes"
        [monthlyPrice]="49"
        [yearlyPrice]="470"
        [features]="['10 utilisateurs']"
      >
        <p class="extra">Essai 14 jours</p>
      </gestio-pricing-plan>
      <gestio-pricing-plan name="Équipe" [monthlyPrice]="19.5" />
      <gestio-pricing-plan name="Entreprise" [monthlyPrice]="null" ctaLabel="Nous contacter" />
    </gestio-pricing-table>
  `,
})
class Host {
  readonly billing = signal<GestioPricingBilling>('monthly');
  readonly selected = signal<GestioPricingSelection | null>(null);
}

const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();

describe('GestioPricingTable', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const plans = () => [...el.querySelectorAll<HTMLElement>('gestio-pricing-plan')];
    const toggles = () => [
      ...el.querySelectorAll<HTMLButtonElement>('.gestio-pricing-table__billing-option'),
    ];
    const price = (index: number) =>
      normalize(plans()[index].querySelector('.gestio-pricing-plan__price')!.textContent);
    return { fixture, host: fixture.componentInstance, el, plans, toggles, price };
  }

  it('structure une liste nommée de forfaits avec titres', async () => {
    const { el, plans } = await setup();
    const list = el.querySelector('[role="list"]')!;
    expect(list.getAttribute('aria-label')).toBe('Forfaits');
    expect(plans().every((p) => p.getAttribute('role') === 'listitem')).toBe(true);
    const heading = plans()[1].querySelector('[role="heading"]')!;
    expect(heading.getAttribute('aria-level')).toBe('3');
    expect(normalize(heading.textContent)).toBe('Pro');
    expect(el.querySelector('h2')!.textContent).toBe('Nos offres');
  });

  it('formate les prix mensuels, gratuits et sur devis', async () => {
    const { price } = await setup();
    expect(price(0)).toBe('Gratuit');
    expect(price(1)).toBe('49 € / mois');
    expect(price(2)).toBe('19,50 € / mois');
    expect(price(3)).toBe('Sur devis');
  });

  it('bascule en annuel via les boutons aria-pressed et met à jour le model', async () => {
    const { fixture, host, toggles, price } = await setup();
    const [monthly, yearly] = toggles();
    expect(toggles()[0].closest('[role="group"]')!.getAttribute('aria-label')).toBe(
      'Période de facturation',
    );
    expect(monthly.getAttribute('aria-pressed')).toBe('true');
    expect(normalize(yearly.textContent)).toBe('Annuel −20 %');

    yearly.click();
    await fixture.whenStable();
    expect(host.billing()).toBe('yearly');
    expect(yearly.getAttribute('aria-pressed')).toBe('true');
    expect(monthly.getAttribute('aria-pressed')).toBe('false');
    expect(price(1)).toBe('470 € / an');
    // Sans prix annuel : 12 × le mensuel.
    expect(price(2)).toBe('234 € / an');
  });

  it('met en avant un forfait avec badge et bouton principal', async () => {
    const { plans } = await setup();
    const pro = plans()[1];
    expect(pro.classList).toContain('gestio-pricing-plan--highlighted');
    expect(normalize(pro.querySelector('gestio-badge')!.textContent)).toBe('Populaire');
    expect(pro.querySelector('button')!.classList).toContain('gestio-button--primary');
    expect(plans()[2].querySelector('button')!.classList).toContain('gestio-button--outline');
    expect(pro.querySelector('.extra')).not.toBeNull();
  });

  it('annonce les fonctionnalités incluses et exclues', async () => {
    const { plans } = await setup();
    const items = plans()[0].querySelectorAll('li');
    expect(normalize(items[0].textContent)).toBe('Inclus : 1 utilisateur');
    expect(normalize(items[1].textContent)).toBe('Non inclus : API');
    expect(items[1].classList).toContain('gestio-pricing-plan__feature--excluded');
  });

  it('émet planSelect avec la période et décrit le bouton par le forfait', async () => {
    const { fixture, host, plans, toggles } = await setup();
    toggles()[1].click();
    await fixture.whenStable();
    const button = plans()[1].querySelector('button')!;
    const [nameId, priceId] = button.getAttribute('aria-describedby')!.split(' ');
    expect(document.getElementById(nameId)!.textContent!.trim()).toBe('Pro');
    expect(document.getElementById(priceId)).not.toBeNull();
    button.click();
    expect(host.selected()).toEqual({ plan: 'pro', billing: 'yearly' });

    plans()[3].querySelector('button')!.click();
    expect(host.selected()).toEqual({ plan: 'Entreprise', billing: 'yearly' });
    expect(normalize(plans()[3].querySelector('button')!.textContent)).toBe('Nous contacter');
  });

  it('désactive le forfait actuel', async () => {
    const { host, plans } = await setup();
    const button = plans()[0].querySelector('button')!;
    expect(button.disabled).toBe(true);
    expect(normalize(button.textContent)).toBe('Forfait actuel');
    button.click();
    expect(host.selected()).toBeNull();
  });
});
