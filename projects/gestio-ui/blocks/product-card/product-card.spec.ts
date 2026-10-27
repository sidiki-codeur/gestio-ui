import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GestioProductCard } from './product-card';

@Component({
  imports: [GestioProductCard],
  template: `
    <gestio-product-card
      name="Chaise de bureau Ergo"
      href="/produits/ergo"
      image="https://cdn.example.com/ergo.jpg"
      imageAlt="Chaise noire"
      description="Dossier en maille respirante"
      [price]="189"
      [compareAtPrice]="compareAt()"
      badge="-20 %"
      [rating]="4.5"
      [reviewCount]="128"
      [inStock]="inStock()"
      showStock
      (addToCart)="added = added + 1"
    >
      <button gestioProductCardActions type="button" aria-label="Ajouter aux favoris">♡</button>
    </gestio-product-card>
  `,
})
class Host {
  readonly compareAt = signal<number | null>(239);
  readonly inStock = signal(true);
  added = 0;
}

describe('GestioProductCard', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const card = el.querySelector('gestio-product-card') as HTMLElement;
    return { fixture, host: fixture.componentInstance, el, card };
  }

  it('article nommé par son titre, lien étendu et image', async () => {
    const { card } = await setup();
    expect(card.getAttribute('role')).toBe('article');
    const heading = card.querySelector('[role="heading"]')!;
    expect(card.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.getAttribute('aria-level')).toBe('3');
    const link = heading.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/produits/ergo');
    expect(link.textContent).toBe('Chaise de bureau Ergo');
    const img = card.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('Chaise noire');
    expect(img.getAttribute('src')).toContain('ergo.jpg');
    expect(card.querySelector('gestio-badge')!.textContent).toContain('-20 %');
    expect(card.querySelector('[gestioProductCardActions]')).not.toBeNull();
  });

  it('prix formatés via Intl, prix barré seulement s’il est supérieur', async () => {
    const { fixture, host, card } = await setup();
    const price = card.querySelector('.gestio-product-card__price')!;
    expect(price.querySelector('.gestio-product-card__current')!.textContent).toBe('189,00 €');
    expect(price.querySelector('del')!.textContent).toBe('239,00 €');
    expect(price.textContent).toContain('Prix initial :');

    host.compareAt.set(150);
    await fixture.whenStable();
    expect(price.querySelector('del')).toBeNull();
  });

  it('note en lecture seule avec nombre d’avis', async () => {
    const { card } = await setup();
    expect(card.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('Note : 4,5 sur 5');
    expect(card.textContent).toContain('128 avis');
  });

  it('ajout au panier : émet, décrit par le nom, bloqué hors stock', async () => {
    const { fixture, host, card } = await setup();
    const button = card.querySelector('button[gestioButton]') as HTMLButtonElement;
    expect(button.textContent).toContain('Ajouter au panier');
    expect(button.getAttribute('aria-describedby')).toBe(
      card.querySelector('[role="heading"]')!.id,
    );
    expect(card.textContent).toContain('En stock');
    button.click();
    expect(host.added).toBe(1);

    host.inStock.set(false);
    await fixture.whenStable();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Rupture de stock');
    button.click();
    expect(host.added).toBe(1);
  });
});
