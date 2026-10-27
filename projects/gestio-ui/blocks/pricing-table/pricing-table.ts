import {
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';

/** Période de facturation affichée. */
export type GestioPricingBilling = 'monthly' | 'yearly';

/** Forfait choisi, émis par `planSelect`. */
export interface GestioPricingSelection {
  /** Identifiant du forfait (`value`, ou à défaut `name`). */
  readonly plan: string;
  readonly billing: GestioPricingBilling;
}

/** Libellés de la grille tarifaire (internationalisation). */
export interface GestioPricingTableLabels {
  /** Nom du groupe de bascule de facturation. */
  billing: string;
  monthly: string;
  yearly: string;
  perMonth: string;
  perYear: string;
  /** Badge du forfait mis en avant. */
  popular: string;
  /** Préfixe lu avant une fonctionnalité incluse. */
  included: string;
  /** Préfixe lu avant une fonctionnalité non incluse. */
  excluded: string;
  /** Bouton d'action par défaut. */
  choose: string;
  /** Bouton du forfait actuel (désactivé). */
  current: string;
  /** Prix `null` : tarif sur demande. */
  custom: string;
  /** Prix nul. */
  free: string;
}

export const GESTIO_PRICING_TABLE_LABELS: GestioPricingTableLabels = {
  billing: 'Période de facturation',
  monthly: 'Mensuel',
  yearly: 'Annuel',
  perMonth: '/ mois',
  perYear: '/ an',
  popular: 'Populaire',
  included: 'Inclus :',
  excluded: 'Non inclus :',
  choose: 'Choisir ce forfait',
  current: 'Forfait actuel',
  custom: 'Sur devis',
  free: 'Gratuit',
};

/**
 * Grille de forfaits avec bascule mensuel / annuel.
 *
 * ```html
 * <gestio-pricing-table [(billing)]="periode" yearlyHint="−20 %" (planSelect)="souscrire($event)">
 *   <gestio-pricing-plan name="Essentiel" [monthlyPrice]="19" [yearlyPrice]="182" [features]="['3 utilisateurs']" />
 *   <gestio-pricing-plan name="Pro" highlighted [monthlyPrice]="49" [yearlyPrice]="470" [features]="…" />
 *   <gestio-pricing-plan name="Entreprise" [monthlyPrice]="null" ctaLabel="Nous contacter" [features]="…" />
 * </gestio-pricing-table>
 * ```
 *
 * Importer `GestioPricingTable` et `GestioPricingPlan` (ou `GESTIO_PRICING_TABLE_IMPORTS`).
 */
@Component({
  selector: 'gestio-pricing-table',
  template: `
    <div class="gestio-pricing-table__header">
      <ng-content select="[gestioPricingHeader]" />
      @if (showBillingToggle()) {
        <div class="gestio-pricing-table__billing" role="group" [attr.aria-label]="text().billing">
          <button
            type="button"
            class="gestio-pricing-table__billing-option"
            [attr.aria-pressed]="billing() === 'monthly'"
            (click)="billing.set('monthly')"
          >
            {{ text().monthly }}
          </button>
          <button
            type="button"
            class="gestio-pricing-table__billing-option"
            [attr.aria-pressed]="billing() === 'yearly'"
            (click)="billing.set('yearly')"
          >
            {{ text().yearly }}
            @if (yearlyHint()) {
              <span class="gestio-pricing-table__hint">{{ yearlyHint() }}</span>
            }
          </button>
        </div>
      }
    </div>
    <div class="gestio-pricing-table__plans" role="list" [attr.aria-label]="ariaLabel() ?? null">
      <ng-content />
    </div>
    <ng-content select="[gestioPricingFooter]" />
  `,
  styleUrl: './pricing-table.scss',
  host: { class: 'gestio-pricing-table' },
})
export class GestioPricingTable {
  /** Période affichée ; `[(billing)]`. */
  readonly billing = model<GestioPricingBilling>('monthly');
  /** Affiche la bascule mensuel / annuel. */
  readonly showBillingToggle = input(true, { transform: booleanAttribute });
  /** Mention accolée à « Annuel » (ex. « −20 % »). */
  readonly yearlyHint = input<string>();
  /** Langue de formatage des prix. */
  readonly locale = input('fr-FR');
  /** Devise ISO 4217. */
  readonly currency = input('EUR');
  /** Niveau de titre (`aria-level`) du nom de chaque forfait. */
  readonly headingLevel = input(3, { transform: numberAttribute });
  /** Nom accessible de la liste des forfaits. */
  readonly ariaLabel = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioPricingTableLabels>>({});

  /** Émis au clic sur le bouton d'un forfait. */
  readonly planSelect = output<GestioPricingSelection>();

  readonly text = computed<GestioPricingTableLabels>(() => ({
    ...GESTIO_PRICING_TABLE_LABELS,
    ...this.labels(),
  }));

  /** Formate un montant ; usage interne aux forfaits. */
  formatPrice(amount: number): string {
    return new Intl.NumberFormat(this.locale(), {
      style: 'currency',
      currency: this.currency(),
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  }
}
