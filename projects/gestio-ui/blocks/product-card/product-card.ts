import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import { GestioBadge, GestioBadgeVariant } from '@gestiolabs336/ui/badge';
import { GestioRating } from '@gestiolabs336/ui/blocks/rating';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

/** Libellés de la carte produit (internationalisation). */
export interface GestioProductCardLabels {
  addToCart: string;
  inStock: string;
  outOfStock: string;
  /** Préfixe lu avant le prix courant. */
  currentPrice: string;
  /** Préfixe lu avant le prix barré. */
  previousPrice: string;
}

export const GESTIO_PRODUCT_CARD_LABELS: GestioProductCardLabels = {
  addToCart: 'Ajouter au panier',
  inStock: 'En stock',
  outOfStock: 'Rupture de stock',
  currentPrice: 'Prix :',
  previousPrice: 'Prix initial :',
};

/**
 * Carte produit : image, nom, prix (et prix barré), badge, note, stock et
 * bouton « Ajouter au panier ».
 *
 * ```html
 * <gestio-product-card
 *   name="Chaise de bureau Ergo"
 *   href="/produits/ergo"
 *   image="/img/ergo.jpg"
 *   imageAlt="Chaise de bureau noire à dossier en maille"
 *   [price]="189"
 *   [compareAtPrice]="239"
 *   badge="-20 %"
 *   [rating]="4.5"
 *   [reviewCount]="128"
 *   (addToCart)="cart.add(product)"
 * />
 * ```
 *
 * Avec `href`, toute la carte est cliquable (lien étendu sur le nom) ; le
 * bouton et les actions projetées restent accessibles séparément.
 * Actions secondaires : projeter un élément portant `gestioProductCardActions`.
 */
@Component({
  selector: 'gestio-product-card',
  imports: [NgOptimizedImage, GestioBadge, GestioButton, GestioRating],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  host: {
    class: 'gestio-product-card',
    role: 'article',
    '[attr.aria-labelledby]': 'nameId',
    '[class.is-linked]': '!!href()',
    '[class.is-out-of-stock]': '!inStock()',
  },
})
export class GestioProductCard {
  /** Nom du produit. */
  readonly name = input.required<string>();
  /** Lien vers la fiche produit : rend toute la carte cliquable. */
  readonly href = input<string>();
  /** URL de l'image (chargée via `NgOptimizedImage`, mode `fill`). */
  readonly image = input<string>();
  /** Texte alternatif de l'image ; vide si elle est décorative. */
  readonly imageAlt = input('');
  /** Charge l'image en priorité (carte visible au chargement de la page). */
  readonly imagePriority = input(false, { transform: booleanAttribute });
  /** Attribut `sizes` de l'image (valeurs relatives uniquement, ex. `50vw`). */
  readonly imageSizes = input('(min-width: 640px) 33vw, 100vw');
  /** Courte description sous le nom. */
  readonly description = input<string>();
  /** Prix courant. */
  readonly price = input.required({ transform: numberAttribute });
  /** Prix avant remise, affiché barré s'il est supérieur au prix courant. */
  readonly compareAtPrice = input<number | null>(null);
  /** Code devise ISO 4217. */
  readonly currency = input('EUR');
  /** Locale de formatage des prix. */
  readonly locale = input('fr-FR');
  /** Texte du badge (ex. « -20 % », « Nouveau »). */
  readonly badge = input<string>();
  readonly badgeVariant = input<GestioBadgeVariant>('danger');
  /** Note moyenne ; masquée si absente. */
  readonly rating = input<number | null>(null);
  /** Nombre d'avis affiché avec la note. */
  readonly reviewCount = input<number | null>(null);
  /** Disponibilité : désactive le bouton d'ajout si `false`. */
  readonly inStock = input(true, { transform: booleanAttribute });
  /** Affiche la mention de stock. */
  readonly showStock = input(false, { transform: booleanAttribute });
  /** Ajout en cours : bouton en chargement. */
  readonly adding = input(false, { transform: booleanAttribute });
  /** Masque le bouton « Ajouter au panier ». */
  readonly hideAddToCart = input(false, { transform: booleanAttribute });
  /** Niveau de titre (`aria-level`) du nom. */
  readonly headingLevel = input(3, { transform: numberAttribute });
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioProductCardLabels>>({});

  /** Clic sur « Ajouter au panier ». */
  readonly addToCart = output<void>();

  protected readonly nameId = gestioUniqueId('gestio-product-card');

  protected readonly text = computed<GestioProductCardLabels>(() => ({
    ...GESTIO_PRODUCT_CARD_LABELS,
    ...this.labels(),
  }));

  private readonly priceFormat = computed(
    () => new Intl.NumberFormat(this.locale(), { style: 'currency', currency: this.currency() }),
  );
  protected readonly formattedPrice = computed(() => this.priceFormat().format(this.price()));
  protected readonly formattedCompareAt = computed(() => {
    const compareAt = this.compareAtPrice();
    return compareAt !== null && compareAt > this.price()
      ? this.priceFormat().format(compareAt)
      : null;
  });
}
