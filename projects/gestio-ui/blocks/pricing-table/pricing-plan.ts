import { Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { GestioBadge } from '@gestiolabs336/ui/badge';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioPricingTable } from './pricing-table';

/** Fonctionnalité d'un forfait : libellé seul (incluse) ou objet détaillé. */
export type GestioPricingFeature = string | { readonly label: string; readonly included?: boolean };

/**
 * Forfait d'une grille tarifaire. À placer dans `gestio-pricing-table`.
 *
 * ```html
 * <gestio-pricing-plan
 *   name="Pro"
 *   description="Pour les équipes en croissance"
 *   highlighted
 *   [monthlyPrice]="49"
 *   [yearlyPrice]="470"
 *   [features]="['10 utilisateurs', { label: 'API', included: false }]"
 * />
 * ```
 *
 * Contenu projeté : affiché entre la liste des fonctionnalités et le bouton.
 */
@Component({
  selector: 'gestio-pricing-plan',
  imports: [GestioBadge, GestioButton],
  templateUrl: './pricing-plan.html',
  styleUrl: './pricing-plan.scss',
  host: {
    class: 'gestio-pricing-plan',
    role: 'listitem',
    '[class.gestio-pricing-plan--highlighted]': 'highlighted()',
    '[class.gestio-pricing-plan--current]': 'current()',
  },
})
export class GestioPricingPlan {
  protected readonly table = inject(GestioPricingTable);

  /** Nom du forfait. */
  readonly name = input.required<string>();
  /** Identifiant émis par `planSelect` (défaut : `name`). */
  readonly value = input<string>();
  /** Phrase d'accroche. */
  readonly description = input<string>();
  /** Prix mensuel ; `null` = sur devis, `0` = gratuit. */
  readonly monthlyPrice = input<number | null>(null);
  /** Prix annuel total ; par défaut 12 × le prix mensuel. */
  readonly yearlyPrice = input<number | null | undefined>(undefined);
  /** Fonctionnalités listées. */
  readonly features = input<readonly GestioPricingFeature[]>([]);
  /** Met le forfait en avant (bordure, badge « Populaire », bouton principal). */
  readonly highlighted = input(false, { transform: booleanAttribute });
  /** Forfait actuel du client : bouton désactivé « Forfait actuel ». */
  readonly current = input(false, { transform: booleanAttribute });
  /** Désactive le bouton d'action. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Libellé du bouton (défaut : « Choisir ce forfait »). */
  readonly ctaLabel = input<string>();

  protected readonly nameId = gestioUniqueId('gestio-pricing-plan-name');
  protected readonly priceId = gestioUniqueId('gestio-pricing-plan-price');

  private readonly amount = computed(() => {
    const monthly = this.monthlyPrice();
    if (this.table.billing() === 'monthly') return monthly;
    const yearly = this.yearlyPrice();
    if (yearly !== undefined) return yearly;
    return monthly === null ? null : monthly * 12;
  });

  protected readonly priceText = computed(() => {
    const amount = this.amount();
    const text = this.table.text();
    if (amount === null) return text.custom;
    if (amount === 0) return text.free;
    return this.table.formatPrice(amount);
  });

  protected readonly periodText = computed(() => {
    const amount = this.amount();
    if (amount === null || amount === 0) return '';
    const text = this.table.text();
    return this.table.billing() === 'monthly' ? text.perMonth : text.perYear;
  });

  protected readonly featureList = computed(() =>
    this.features().map((feature) =>
      typeof feature === 'string'
        ? { label: feature, included: true }
        : { label: feature.label, included: feature.included ?? true },
    ),
  );

  protected readonly buttonLabel = computed(() =>
    this.current() ? this.table.text().current : (this.ctaLabel() ?? this.table.text().choose),
  );

  protected choose(): void {
    this.table.planSelect.emit({
      plan: this.value() ?? this.name(),
      billing: this.table.billing(),
    });
  }
}

/** Grille tarifaire et forfait. */
export const GESTIO_PRICING_TABLE_IMPORTS = [GestioPricingTable, GestioPricingPlan] as const;
