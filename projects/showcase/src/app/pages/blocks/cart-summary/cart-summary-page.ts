import { Component, computed, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import {
  GestioCartItem,
  GestioCartQuantityChange,
  GestioCartSummary,
} from '@gestiolabs336/ui/blocks/cart-summary';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioInput } from '@gestiolabs336/ui/input';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

const INITIAL_ITEMS: GestioCartItem[] = [
  {
    id: 'pro',
    name: 'Licence Gestio Pro',
    description: 'Abonnement 12 mois, par utilisateur',
    unitPrice: 470,
    quantity: 2,
    maxQuantity: 50,
  },
  {
    id: 'onboarding',
    name: 'Formation de prise en main',
    description: 'Session à distance de 2 h',
    unitPrice: 290,
    quantity: 1,
    maxQuantity: 1,
  },
  {
    id: 'sms',
    name: 'Pack 500 SMS de relance',
    unitPrice: 35,
    quantity: 1,
  },
];

@Component({
  selector: 'sc-cart-summary-page',
  imports: [GestioCartSummary, GestioButton, GestioInput, FormField, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Récapitulatif de panier" eyebrow="Blocs">
      <code>gestio-cart-summary</code> liste les articles et calcule sous-total, remise, livraison,
      TVA et total. Il est sans état : il émet des demandes que l’application applique à ses
      données.
    </sc-page-header>

    <sc-example
      heading="Panier avec code promo"
      description="Modifiez les quantités, retirez un article ou essayez le code BIENVENUE."
      [code]="cartCode"
      stacked
    >
      <div style="max-width: 28rem; width: 100%">
        <gestio-cart-summary
          [items]="items()"
          [discount]="discount()"
          [shipping]="0"
          [taxRate]="0.2"
          [loading]="ordering()"
          (quantityChange)="changeQuantity($event)"
          (remove)="removeItem($event)"
          (checkout)="checkout()"
        >
          <form
            gestioCartPromo
            class="sc-row"
            style="align-items: flex-end"
            (submit)="applyCode($event)"
          >
            <gestio-input
              label="Code promo"
              size="sm"
              style="flex: 1"
              [hint]="promoMessage()"
              [formField]="promo.code"
            />
            <button gestioButton type="submit" variant="outline" size="sm">Appliquer</button>
          </form>
          <button gestioCartEmpty gestioButton variant="outline" (click)="reset()">
            Recharger l’exemple
          </button>
        </gestio-cart-summary>
      </div>
      <p class="sc-result" aria-live="polite">
        Dernier événement : <strong>{{ lastEvent() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Lecture seule, prix HT"
      description="Récapitulatif de commande non modifiable ; la TVA est ajoutée au total et la livraison reste à calculer."
      [code]="readonlyCode"
    >
      <div style="max-width: 28rem; width: 100%">
        <gestio-cart-summary
          [items]="readonlyItems"
          [editable]="false"
          [taxRate]="0.2"
          [taxIncluded]="false"
          [labels]="{ heading: 'Votre commande', checkout: 'Payer' }"
        />
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-cart-summary" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Chaque bouton est nommé par l’article (« Augmenter la quantité de Formation »). Les
          changements sont annoncés par une région <code>role="status"</code> et, après un retrait,
          le focus revient sur le titre du panier. Zones projetées : <code>[gestioCartPromo]</code>,
          <code>[gestioCartEmpty]</code> et contenu par défaut.
        </p>
      </div>
    </section>
  `,
})
export class CartSummaryPage {
  protected readonly items = signal<GestioCartItem[]>(INITIAL_ITEMS);
  protected readonly promoModel = signal({ code: '' });
  protected readonly promo = form(this.promoModel);
  protected readonly promoApplied = signal(false);
  protected readonly promoError = signal(false);
  protected readonly ordering = signal(false);
  protected readonly lastEvent = signal('aucun');

  protected readonly discount = computed(() => (this.promoApplied() ? 50 : 0));
  protected readonly promoMessage = computed(() =>
    this.promoApplied()
      ? 'Code BIENVENUE appliqué : 50 € de remise.'
      : this.promoError()
        ? 'Code inconnu.'
        : 'Essayez BIENVENUE.',
  );

  protected readonly readonlyItems: GestioCartItem[] = [
    { id: 1, name: 'Licence Gestio Essentiel', unitPrice: 182, quantity: 3 },
    { id: 2, name: 'Module Stocks', description: 'Option annuelle', unitPrice: 120, quantity: 1 },
  ];

  protected changeQuantity({ item, quantity }: GestioCartQuantityChange): void {
    this.items.update((items) => items.map((i) => (i.id === item.id ? { ...i, quantity } : i)));
    this.lastEvent.set(`quantityChange (${item.name} → ${quantity})`);
  }

  protected removeItem(item: GestioCartItem): void {
    this.items.update((items) => items.filter((i) => i.id !== item.id));
    this.lastEvent.set(`remove (${item.name})`);
  }

  protected applyCode(event: Event): void {
    event.preventDefault();
    const valid = this.promoModel().code.trim().toUpperCase() === 'BIENVENUE';
    this.promoApplied.set(valid);
    this.promoError.set(!valid);
  }

  protected checkout(): void {
    this.lastEvent.set('checkout');
    this.ordering.set(true);
    setTimeout(() => this.ordering.set(false), 1200);
  }

  protected reset(): void {
    this.items.set(INITIAL_ITEMS);
    this.lastEvent.set('aucun');
  }

  protected readonly cartCode = `<gestio-cart-summary
  [items]="panier()"
  [discount]="remise()"
  [shipping]="0"
  [taxRate]="0.2"
  [loading]="commandeEnCours()"
  (quantityChange)="changerQuantite($event)"
  (remove)="retirer($event)"
  (checkout)="commander()"
>
  <form gestioCartPromo (submit)="appliquerCode($event)">…</form>
  <a gestioCartEmpty gestioButton routerLink="/catalogue">Voir le catalogue</a>
</gestio-cart-summary>

changerQuantite({ item, quantity }: GestioCartQuantityChange) {
  this.panier.update((items) => items.map((i) => (i.id === item.id ? { ...i, quantity } : i)));
}
retirer(item: GestioCartItem) {
  this.panier.update((items) => items.filter((i) => i.id !== item.id));
}`;

  protected readonly readonlyCode = `<gestio-cart-summary
  [items]="commande()"
  [editable]="false"
  [taxRate]="0.2"
  [taxIncluded]="false"
  [labels]="{ heading: 'Votre commande', checkout: 'Payer' }"
/>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'items',
      type: 'readonly GestioCartItem[]',
      description:
        'Lignes { id, name, unitPrice, quantity, description?, image?, imageAlt?, maxQuantity? } (obligatoire).',
    },
    { name: 'discount', type: 'number', default: '0', description: 'Montant de remise.' },
    {
      name: 'shipping',
      type: 'number | null',
      default: 'null',
      description: '0 = « Offerte », null = à calculer.',
    },
    { name: 'taxRate', type: 'number', default: '0', description: 'Taux de TVA (0.2 = 20 %).' },
    {
      name: 'taxIncluded',
      type: 'boolean',
      default: 'true',
      description: 'Prix TTC (TVA indiquée) ; false : TVA ajoutée.',
    },
    {
      name: 'editable',
      type: 'boolean',
      default: 'true',
      description: 'Boutons de quantité et de retrait.',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Bouton « Commander » occupé.',
    },
    {
      name: 'checkoutDisabled',
      type: 'boolean',
      default: 'false',
      description: 'Désactive « Commander ».',
    },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Langue des montants.' },
    { name: 'currency', type: 'string', default: `'EUR'`, description: 'Devise ISO 4217.' },
    { name: 'headingLevel', type: 'number', default: '2', description: 'Niveau du titre.' },
    {
      name: 'labels',
      type: 'Partial<GestioCartSummaryLabels>',
      default: '{}',
      description: 'Libellés et annonces.',
    },
    {
      name: '(quantityChange)',
      type: 'GestioCartQuantityChange',
      description: '{ item, quantity } demandé.',
    },
    { name: '(remove)', type: 'GestioCartItem', description: 'Retrait demandé.' },
    { name: '(checkout)', type: 'void', description: 'Clic sur « Commander ».' },
  ];
}
