import { Component, signal } from '@angular/core';
import { GestioProductCard } from '@gestiolabs336/ui/blocks/product-card';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

interface Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly price: number;
  readonly compareAtPrice: number | null;
  readonly badge?: string;
  readonly rating: number;
  readonly reviews: number;
  readonly inStock: boolean;
}

@Component({
  selector: 'sc-product-card-page',
  imports: [GestioProductCard, GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Carte produit" eyebrow="Blocs">
      <code>gestio-product-card</code> réunit image, prix (formatés avec <code>Intl</code>), remise,
      note, stock et bouton d’ajout au panier. Avec <code>href</code>, toute la carte est cliquable
      sans gêner le bouton ni les actions secondaires.
    </sc-page-header>

    <sc-example heading="Catalogue" [code]="code" stacked>
      <div class="sc-grid">
        @for (product of products; track product.id) {
          <gestio-product-card
            [name]="product.name"
            [href]="'#' + product.id"
            [image]="product.image"
            [imageAlt]="product.imageAlt"
            [description]="product.description"
            [price]="product.price"
            [compareAtPrice]="product.compareAtPrice"
            [badge]="product.badge"
            [rating]="product.rating"
            [reviewCount]="product.reviews"
            [inStock]="product.inStock"
            [adding]="adding() === product.id"
            showStock
            (addToCart)="add(product)"
          >
            <button
              gestioProductCardActions
              gestioButton
              variant="outline"
              size="sm"
              [attr.aria-label]="'Favori : ' + product.name"
              [attr.aria-pressed]="favorites().includes(product.id)"
              (click)="toggleFavorite(product.id)"
            >
              <span aria-hidden="true">{{ favorites().includes(product.id) ? '♥' : '♡' }}</span>
            </button>
          </gestio-product-card>
        }
      </div>
      <p class="sc-result" aria-live="polite">{{ cartMessage() }}</p>
    </sc-example>

    <sc-example heading="Sans lien ni bouton, en dollars" [code]="compactCode">
      <gestio-product-card
        style="max-width: 18rem"
        name="Lampe de bureau Halo"
        image="blocks/lampe.svg"
        [price]="59.9"
        currency="USD"
        locale="en-US"
        badge="New"
        badgeVariant="primary"
        hideAddToCart
      />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-product-card" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          L’image passe par <code>NgOptimizedImage</code> (mode <code>fill</code>, ratio 4/3) :
          utilisez <code>imagePriority</code> pour les cartes visibles au chargement. Les URL
          <code>data:</code> ne sont pas acceptées. Le bouton d’ajout est décrit par le nom du
          produit pour rester explicite dans une liste.
        </p>
      </div>
    </section>
  `,
})
export class ProductCardPage {
  protected readonly products: Product[] = [
    {
      id: 'ergo',
      name: 'Chaise de bureau Ergo',
      description: 'Dossier en maille respirante, accoudoirs réglables 4D.',
      image: 'blocks/chaise.svg',
      imageAlt: 'Chaise de bureau noire à roulettes',
      price: 189,
      compareAtPrice: 239,
      badge: '-20 %',
      rating: 4.5,
      reviews: 128,
      inStock: true,
    },
    {
      id: 'halo',
      name: 'Lampe de bureau Halo',
      description: 'LED dimmable, température de couleur réglable.',
      image: 'blocks/lampe.svg',
      imageAlt: 'Lampe de bureau orange',
      price: 59.9,
      compareAtPrice: null,
      rating: 4.1,
      reviews: 37,
      inStock: true,
    },
    {
      id: 'atelier',
      name: 'Bureau Atelier 140 cm',
      description: 'Chêne massif, caisson trois tiroirs intégré.',
      image: 'blocks/bureau.svg',
      imageAlt: 'Bureau en bois avec écran',
      price: 449,
      compareAtPrice: null,
      badge: 'Bientôt',
      rating: 4.8,
      reviews: 12,
      inStock: false,
    },
  ];

  protected readonly adding = signal<string | null>(null);
  protected readonly favorites = signal<string[]>([]);
  protected readonly cartMessage = signal('Panier vide');

  protected add(product: Product): void {
    this.adding.set(product.id);
    setTimeout(() => {
      this.adding.set(null);
      this.cartMessage.set(`« ${product.name} » ajouté au panier`);
    }, 600);
  }

  protected toggleFavorite(id: string): void {
    this.favorites.update((list) =>
      list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
    );
  }

  protected readonly code = `<gestio-product-card
  name="Chaise de bureau Ergo"
  href="/produits/ergo"
  image="images/ergo.jpg"
  imageAlt="Chaise de bureau noire à roulettes"
  description="Dossier en maille respirante…"
  [price]="189"
  [compareAtPrice]="239"
  badge="-20 %"
  [rating]="4.5"
  [reviewCount]="128"
  [adding]="adding()"
  showStock
  (addToCart)="add(product)"
>
  <button gestioProductCardActions gestioButton variant="outline" size="sm"
          aria-label="Ajouter aux favoris">♡</button>
</gestio-product-card>`;

  protected readonly compactCode = `<gestio-product-card
  name="Lampe de bureau Halo"
  image="images/halo.svg"
  [price]="59.9"
  currency="USD"
  locale="en-US"
  badge="New"
  badgeVariant="primary"
  hideAddToCart
/>`;

  protected readonly api: ApiRow[] = [
    { name: 'name', type: 'string', description: 'Nom du produit (obligatoire).' },
    { name: 'href', type: 'string', description: 'Lien de la fiche : carte entière cliquable.' },
    { name: 'image', type: 'string', description: 'URL de l’image.' },
    { name: 'imageAlt', type: 'string', default: `''`, description: 'Texte alternatif.' },
    {
      name: 'imagePriority',
      type: 'boolean',
      default: 'false',
      description: 'Chargement prioritaire.',
    },
    {
      name: 'imageSizes',
      type: 'string',
      default: `'(min-width: 640px) 33vw, 100vw'`,
      description: 'Attribut sizes.',
    },
    { name: 'description', type: 'string', description: 'Description courte (2 lignes).' },
    { name: 'price', type: 'number', description: 'Prix (obligatoire).' },
    { name: 'compareAtPrice', type: 'number | null', default: 'null', description: 'Prix barré.' },
    { name: 'currency', type: 'string', default: `'EUR'`, description: 'Devise ISO 4217.' },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Formatage.' },
    { name: 'badge', type: 'string', description: 'Texte du badge.' },
    {
      name: 'badgeVariant',
      type: 'GestioBadgeVariant',
      default: `'danger'`,
      description: 'Couleur du badge.',
    },
    { name: 'rating', type: 'number | null', default: 'null', description: 'Note moyenne.' },
    { name: 'reviewCount', type: 'number | null', default: 'null', description: 'Nombre d’avis.' },
    { name: 'inStock', type: 'boolean', default: 'true', description: 'Disponibilité.' },
    { name: 'showStock', type: 'boolean', default: 'false', description: 'Mention de stock.' },
    { name: 'adding', type: 'boolean', default: 'false', description: 'Bouton en chargement.' },
    { name: 'hideAddToCart', type: 'boolean', default: 'false', description: 'Masque le bouton.' },
    { name: 'headingLevel', type: 'number', default: '3', description: 'Niveau du titre.' },
    {
      name: 'labels',
      type: 'Partial<GestioProductCardLabels>',
      default: '{}',
      description: 'Libellés.',
    },
    { name: '(addToCart)', type: 'void', description: 'Clic sur « Ajouter au panier ».' },
  ];
}
