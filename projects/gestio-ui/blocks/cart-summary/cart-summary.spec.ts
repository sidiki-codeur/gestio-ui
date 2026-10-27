import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioCartItem, GestioCartQuantityChange, GestioCartSummary } from './cart-summary';

const ITEMS: GestioCartItem[] = [
  {
    id: 'a',
    name: 'Licence Gestio Pro',
    description: 'Abonnement annuel',
    unitPrice: 100,
    quantity: 2,
    image: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
  },
  { id: 'b', name: 'Formation', unitPrice: 50, quantity: 1, maxQuantity: 1 },
];

@Component({
  imports: [GestioCartSummary],
  template: `
    <gestio-cart-summary
      [items]="items()"
      [discount]="discount()"
      [shipping]="shipping()"
      [taxRate]="0.2"
      [taxIncluded]="taxIncluded()"
      (quantityChange)="changes.push($event)"
      (remove)="onRemove($event)"
      (checkout)="checkouts = checkouts + 1"
    >
      <p gestioCartPromo class="promo">Code promo</p>
      <a gestioCartEmpty href="/catalogue" class="browse">Voir le catalogue</a>
    </gestio-cart-summary>
  `,
})
class Host {
  readonly items = signal<GestioCartItem[]>(ITEMS);
  readonly discount = signal(10);
  readonly shipping = signal<number | null>(0);
  readonly taxIncluded = signal(true);
  readonly changes: GestioCartQuantityChange[] = [];
  readonly removed: GestioCartItem[] = [];
  checkouts = 0;

  onRemove(item: GestioCartItem): void {
    this.removed.push(item);
    this.items.update((items) => items.filter((i) => i.id !== item.id));
  }
}

const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();

describe('GestioCartSummary', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const rows = () =>
      [...el.querySelectorAll('.gestio-cart-summary__row')].map((row) => [
        normalize(row.querySelector('dt')!.textContent),
        normalize(row.querySelector('dd')!.textContent),
      ]);
    const button = (label: string) =>
      el.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    return { fixture, host: fixture.componentInstance, el, rows, button };
  }

  it('liste les articles avec titre, prix unitaire et total de ligne', async () => {
    const { el } = await setup();
    const heading = el.querySelector('[role="heading"]')!;
    expect(heading.getAttribute('aria-level')).toBe('2');
    expect(normalize(heading.textContent)).toBe('Votre panier');
    const items = el.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(normalize(items[0].querySelector('.gestio-cart-summary__unit')!.textContent)).toBe(
      '100,00 € × 2',
    );
    expect(normalize(items[0].querySelector('.gestio-cart-summary__line-total')!.textContent)).toBe(
      '200,00 €',
    );
    expect(items[0].querySelector('img')!.getAttribute('alt')).toBe('');
    expect(el.querySelector('.promo')).not.toBeNull();
  });

  it('calcule les totaux TTC (TVA comprise)', async () => {
    const { rows } = await setup();
    expect(rows()).toEqual([
      ['Sous-total', '250,00 €'],
      ['Remise', '-10,00 €'],
      ['Livraison', 'Offerte'],
      ['Dont TVA (20 %)', '40,00 €'],
      ['Total', '240,00 €'],
    ]);
  });

  it('ajoute la TVA quand les prix sont HT et gère la livraison à calculer', async () => {
    const { fixture, host, rows } = await setup();
    host.taxIncluded.set(false);
    host.shipping.set(null);
    host.discount.set(0);
    await fixture.whenStable();
    expect(rows()).toEqual([
      ['Sous-total', '250,00 €'],
      ['Livraison', 'Calculée à l’étape suivante'],
      ['TVA (20 %)', '50,00 €'],
      ['Total', '300,00 €'],
    ]);
  });

  it('émet quantityChange dans les bornes et l’annonce', async () => {
    const { fixture, host, el, button } = await setup();
    button('Augmenter la quantité de Licence Gestio Pro').click();
    button('Diminuer la quantité de Licence Gestio Pro').click();
    expect(host.changes.map((c) => c.quantity)).toEqual([3, 1]);
    await fixture.whenStable();
    expect(el.querySelector('[role="status"]')!.textContent).toBe(
      'Quantité de Licence Gestio Pro : 1',
    );

    // Formation : quantité 1, maximum 1 → les deux boutons sont inactifs.
    const decrease = button('Diminuer la quantité de Formation');
    const increase = button('Augmenter la quantité de Formation');
    expect(decrease.getAttribute('aria-disabled')).toBe('true');
    expect(increase.getAttribute('aria-disabled')).toBe('true');
    decrease.click();
    increase.click();
    expect(host.changes).toHaveLength(2);
    expect(el.querySelector('[role="group"][aria-label="Quantité de Formation"]')).not.toBeNull();
  });

  it('retire une ligne et replace le focus sur le titre', async () => {
    const { fixture, host, el, button } = await setup();
    const remove = button('Retirer Formation du panier');
    remove.focus();
    remove.click();
    await fixture.whenStable();
    expect(host.removed.map((i) => i.id)).toEqual(['b']);
    expect(el.querySelectorAll('li')).toHaveLength(1);
    expect(document.activeElement).toBe(el.querySelector('[role="heading"]'));
    expect(el.querySelector('[role="status"]')!.textContent).toBe('Formation retiré du panier');
  });

  it('émet checkout', async () => {
    const { host, el } = await setup();
    const checkout = el.querySelector<HTMLButtonElement>('.gestio-cart-summary__checkout')!;
    expect(normalize(checkout.textContent)).toBe('Commander');
    checkout.click();
    expect(host.checkouts).toBe(1);
  });

  it('affiche l’état vide avec son contenu projeté', async () => {
    const { fixture, host, el } = await setup();
    host.items.set([]);
    await fixture.whenStable();
    expect(el.querySelector('ul')).toBeNull();
    expect(el.querySelector('dl')).toBeNull();
    expect(el.textContent).toContain('Votre panier est vide.');
    expect(el.querySelector('.browse')).not.toBeNull();
  });
});
