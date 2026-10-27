import {
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

/** Ligne du panier. */
export interface GestioCartItem {
  /** Identifiant stable (suivi de la liste). */
  readonly id: string | number;
  readonly name: string;
  /** Prix unitaire, dans la devise du récapitulatif. */
  readonly unitPrice: number;
  readonly quantity: number;
  /** Détail affiché sous le nom (variante, référence…). */
  readonly description?: string;
  /** URL de la vignette. */
  readonly image?: string;
  /** Texte alternatif de la vignette ; vide par défaut (le nom est déjà affiché). */
  readonly imageAlt?: string;
  /** Quantité maximale autorisée. */
  readonly maxQuantity?: number;
}

/** Nouvelle quantité demandée pour une ligne, émise par `quantityChange`. */
export interface GestioCartQuantityChange {
  readonly item: GestioCartItem;
  readonly quantity: number;
}

/** Libellés du récapitulatif de panier (internationalisation). */
export interface GestioCartSummaryLabels {
  heading: string;
  /** Message du panier vide. */
  empty: string;
  /** Nom de la liste des articles. */
  items: string;
  subtotal: string;
  discount: string;
  shipping: string;
  /** Livraison `0`. */
  freeShipping: string;
  /** Livraison `null`. */
  shippingPending: string;
  /** Taxes comprises dans les prix ; `{rate}` est remplacé. */
  taxIncluded: string;
  /** Taxes ajoutées aux prix ; `{rate}` est remplacé. */
  taxExcluded: string;
  total: string;
  checkout: string;
  /** `{name}` est remplacé. */
  decrease: string;
  /** `{name}` est remplacé. */
  increase: string;
  /** `{name}` est remplacé. */
  remove: string;
  /** Nom de la quantité ; `{name}` est remplacé. */
  quantity: string;
  /** Prix unitaire × quantité ; `{price}`, `{quantity}` sont remplacés. */
  unitPrice: string;
  /** Annonce après un changement de quantité ; `{name}`, `{quantity}` sont remplacés. */
  quantityStatus: string;
  /** Annonce après un retrait ; `{name}` est remplacé. */
  removedStatus: string;
}

export const GESTIO_CART_SUMMARY_LABELS: GestioCartSummaryLabels = {
  heading: 'Votre panier',
  empty: 'Votre panier est vide.',
  items: 'Articles du panier',
  subtotal: 'Sous-total',
  discount: 'Remise',
  shipping: 'Livraison',
  freeShipping: 'Offerte',
  shippingPending: 'Calculée à l’étape suivante',
  taxIncluded: 'Dont TVA ({rate})',
  taxExcluded: 'TVA ({rate})',
  total: 'Total',
  checkout: 'Commander',
  decrease: 'Diminuer la quantité de {name}',
  increase: 'Augmenter la quantité de {name}',
  remove: 'Retirer {name} du panier',
  quantity: 'Quantité de {name}',
  unitPrice: '{price} × {quantity}',
  quantityStatus: 'Quantité de {name} : {quantity}',
  removedStatus: '{name} retiré du panier',
};

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/**
 * Récapitulatif de panier : lignes d'articles, totaux et bouton de commande.
 *
 * ```html
 * <gestio-cart-summary
 *   [items]="panier()"
 *   [discount]="10"
 *   [shipping]="0"
 *   [taxRate]="0.2"
 *   (quantityChange)="changerQuantite($event)"
 *   (remove)="retirer($event)"
 *   (checkout)="commander()"
 * >
 *   <form gestioCartPromo>…</form>
 * </gestio-cart-summary>
 * ```
 *
 * Composant sans état : il émet des demandes (`quantityChange`, `remove`) et
 * l'application met à jour `items`. Montants calculés : sous-total − remise +
 * livraison ; avec `taxIncluded` (défaut), la TVA est déjà comprise dans les
 * prix et seulement indiquée, sinon elle est ajoutée au total.
 */
@Component({
  selector: 'gestio-cart-summary',
  imports: [GestioButton],
  templateUrl: './cart-summary.html',
  styleUrl: './cart-summary.scss',
  host: { class: 'gestio-cart-summary' },
})
export class GestioCartSummary {
  /** Lignes du panier. */
  readonly items = input.required<readonly GestioCartItem[]>();
  /** Montant de la remise (positif), déduit du sous-total. */
  readonly discount = input(0, { transform: numberAttribute });
  /** Frais de livraison ; `0` = offerte, `null` = calculés plus tard. */
  readonly shipping = input<number | null>(null);
  /** Taux de TVA (ex. `0.2`) ; `0` masque la ligne. */
  readonly taxRate = input(0, { transform: numberAttribute });
  /** Les prix sont TTC (la TVA est indiquée, pas ajoutée). */
  readonly taxIncluded = input(true, { transform: booleanAttribute });
  /** Affiche les boutons de quantité et de retrait. */
  readonly editable = input(true, { transform: booleanAttribute });
  /** Commande en cours (bouton occupé). */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Désactive le bouton « Commander ». */
  readonly checkoutDisabled = input(false, { transform: booleanAttribute });
  /** Langue de formatage des montants. */
  readonly locale = input('fr-FR');
  /** Devise ISO 4217. */
  readonly currency = input('EUR');
  /** Niveau de titre (`aria-level`) de l'intitulé. */
  readonly headingLevel = input(2, { transform: numberAttribute });
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioCartSummaryLabels>>({});

  /** Demande de nouvelle quantité (bornée entre 1 et `maxQuantity`). */
  readonly quantityChange = output<GestioCartQuantityChange>();
  /** Demande de retrait d'une ligne. */
  readonly remove = output<GestioCartItem>();
  /** Clic sur « Commander ». */
  readonly checkout = output<void>();

  protected readonly headingId = gestioUniqueId('gestio-cart-summary-heading');
  protected readonly announcement = signal('');
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  /** Ligne retirée dont le bouton avait le focus : le focus passe au titre à sa disparition. */
  private readonly pendingRemoval = signal<GestioCartItem['id'] | null>(null);

  protected readonly text = computed<GestioCartSummaryLabels>(() => ({
    ...GESTIO_CART_SUMMARY_LABELS,
    ...this.labels(),
  }));

  private readonly currencyFormat = computed(
    () => new Intl.NumberFormat(this.locale(), { style: 'currency', currency: this.currency() }),
  );

  protected readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );

  /** Remise effective, jamais supérieure au sous-total. */
  protected readonly discountAmount = computed(() =>
    Math.min(Math.max(0, this.discount()), this.subtotal()),
  );

  private readonly taxBase = computed(
    () => this.subtotal() - this.discountAmount() + (this.shipping() ?? 0),
  );

  protected readonly taxAmount = computed(() => {
    const rate = Math.max(0, this.taxRate());
    const base = this.taxBase();
    return this.taxIncluded() ? base - base / (1 + rate) : base * rate;
  });

  protected readonly total = computed(
    () => this.taxBase() + (this.taxIncluded() ? 0 : this.taxAmount()),
  );

  protected readonly taxLabel = computed(() => {
    const rate = new Intl.NumberFormat(this.locale(), {
      style: 'percent',
      maximumFractionDigits: 2,
    }).format(this.taxRate());
    const text = this.text();
    return interpolate(this.taxIncluded() ? text.taxIncluded : text.taxExcluded, { rate });
  });

  protected readonly shippingText = computed(() => {
    const shipping = this.shipping();
    if (shipping === null) return this.text().shippingPending;
    return shipping === 0 ? this.text().freeShipping : this.format(shipping);
  });

  constructor() {
    afterRenderEffect(() => {
      const pending = this.pendingRemoval();
      if (pending === null || this.items().some((item) => item.id === pending)) return;
      this.pendingRemoval.set(null);
      this.heading().nativeElement.focus();
    });
  }

  protected format(amount: number): string {
    return this.currencyFormat().format(amount);
  }

  protected label(template: keyof GestioCartSummaryLabels, item: GestioCartItem): string {
    return interpolate(this.text()[template], {
      name: item.name,
      quantity: item.quantity,
      price: this.format(item.unitPrice),
    });
  }

  protected canIncrease(item: GestioCartItem): boolean {
    return item.maxQuantity === undefined || item.quantity < item.maxQuantity;
  }

  protected changeQuantity(item: GestioCartItem, step: number): void {
    const max = item.maxQuantity ?? Number.POSITIVE_INFINITY;
    const quantity = Math.min(Math.max(1, item.quantity + step), max);
    if (quantity === item.quantity) return;
    this.quantityChange.emit({ item, quantity });
    this.announce(interpolate(this.text().quantityStatus, { name: item.name, quantity }));
  }

  protected removeItem(item: GestioCartItem): void {
    this.pendingRemoval.set(item.id);
    this.remove.emit(item);
    this.announce(interpolate(this.text().removedStatus, { name: item.name }));
  }

  private announce(message: string): void {
    // Réinitialise pour que deux messages identiques soient annoncés.
    this.announcement.set('');
    queueMicrotask(() => this.announcement.set(message));
  }
}
