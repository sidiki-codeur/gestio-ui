import { Component, signal } from '@angular/core';
import {
  GESTIO_PRICING_TABLE_IMPORTS,
  GestioPricingBilling,
  GestioPricingSelection,
} from '@gestiolabs336/ui/blocks/pricing-table';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-pricing-table-page',
  imports: [GESTIO_PRICING_TABLE_IMPORTS, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Grille tarifaire" eyebrow="Blocs">
      <code>gestio-pricing-table</code> présente des forfaits côte à côte avec une bascule mensuel /
      annuel, un forfait mis en avant et la liste des fonctionnalités incluses ou non.
    </sc-page-header>

    <sc-example
      heading="Abonnements Gestio"
      description="Basculez en annuel : les prix sont recalculés, le forfait choisi est émis avec la période."
      [code]="plansCode"
      stacked
    >
      <gestio-pricing-table
        ariaLabel="Forfaits Gestio"
        yearlyHint="−20 %"
        [(billing)]="billing"
        (planSelect)="selection.set($event)"
      >
        <gestio-pricing-plan
          name="Essentiel"
          value="essentiel"
          description="Pour les indépendants qui démarrent."
          [monthlyPrice]="19"
          [yearlyPrice]="182"
          [features]="essentialFeatures"
        />
        <gestio-pricing-plan
          name="Pro"
          value="pro"
          description="Pour les équipes qui facturent chaque semaine."
          highlighted
          [monthlyPrice]="49"
          [yearlyPrice]="470"
          [features]="proFeatures"
        >
          <p class="sc-muted" style="margin: 0; font-size: var(--gestio-font-size-sm)">
            Essai gratuit de 14 jours, sans carte bancaire.
          </p>
        </gestio-pricing-plan>
        <gestio-pricing-plan
          name="Entreprise"
          value="entreprise"
          description="Pour les structures multi-sites."
          [monthlyPrice]="null"
          ctaLabel="Nous contacter"
          [features]="enterpriseFeatures"
        />
        <p gestioPricingFooter class="sc-muted" style="margin: 0; text-align: center">
          Prix hors taxes. Sans engagement en formule mensuelle.
        </p>
      </gestio-pricing-table>
      <p class="sc-result" aria-live="polite">
        billing : <strong>{{ billing() }}</strong> — planSelect :
        <strong>{{
          selection() ? selection()!.plan + ' (' + selection()!.billing + ')' : 'aucun'
        }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Changement de forfait"
      description="Le forfait actuel du client est signalé et son bouton désactivé ; sans bascule de période."
      [code]="upgradeCode"
      stacked
    >
      <gestio-pricing-table [showBillingToggle]="false" ariaLabel="Changer de forfait">
        <gestio-pricing-plan
          name="Gratuit"
          [monthlyPrice]="0"
          current
          [features]="['1 utilisateur', '10 factures par mois']"
        />
        <gestio-pricing-plan
          name="Pro"
          highlighted
          [monthlyPrice]="49"
          ctaLabel="Passer au forfait Pro"
          [features]="['10 utilisateurs', 'Factures illimitées']"
        />
      </gestio-pricing-table>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-pricing-table" [rows]="tableApi" />
      <sc-api-table caption="Entrées de gestio-pricing-plan" [rows]="planApi" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          La bascule est un groupe de deux boutons <code>aria-pressed</code>. Chaque bouton d’action
          est décrit par le nom et le prix de son forfait ; les fonctionnalités exclues sont
          annoncées « Non inclus ». <code>yearlyPrice</code> est le montant annuel total.
        </p>
      </div>
    </section>
  `,
})
export class PricingTablePage {
  protected readonly billing = signal<GestioPricingBilling>('monthly');
  protected readonly selection = signal<GestioPricingSelection | null>(null);

  protected readonly essentialFeatures = [
    '3 utilisateurs',
    'Devis et factures illimités',
    'Relances automatiques',
    { label: 'Accès API', included: false },
    { label: 'Support prioritaire', included: false },
  ];
  protected readonly proFeatures = [
    '10 utilisateurs',
    'Devis et factures illimités',
    'Relances automatiques',
    'Accès API',
    { label: 'Support prioritaire', included: false },
  ];
  protected readonly enterpriseFeatures = [
    'Utilisateurs illimités',
    'Multi-sociétés',
    'Accès API',
    'Support prioritaire',
    'Authentification unique (SSO)',
  ];

  protected readonly plansCode = `<gestio-pricing-table
  ariaLabel="Forfaits Gestio"
  yearlyHint="−20 %"
  [(billing)]="billing"
  (planSelect)="souscrire($event)"
>
  <gestio-pricing-plan
    name="Essentiel"
    value="essentiel"
    [monthlyPrice]="19"
    [yearlyPrice]="182"
    [features]="['3 utilisateurs', { label: 'Accès API', included: false }]"
  />
  <gestio-pricing-plan name="Pro" value="pro" highlighted [monthlyPrice]="49" [yearlyPrice]="470" [features]="…">
    <p>Essai gratuit de 14 jours.</p>
  </gestio-pricing-plan>
  <gestio-pricing-plan name="Entreprise" value="entreprise" [monthlyPrice]="null" ctaLabel="Nous contacter" />
  <p gestioPricingFooter>Prix hors taxes.</p>
</gestio-pricing-table>`;

  protected readonly upgradeCode = `<gestio-pricing-table [showBillingToggle]="false" ariaLabel="Changer de forfait">
  <gestio-pricing-plan name="Gratuit" [monthlyPrice]="0" current [features]="…" />
  <gestio-pricing-plan name="Pro" highlighted [monthlyPrice]="49" ctaLabel="Passer au forfait Pro" [features]="…" />
</gestio-pricing-table>`;

  protected readonly tableApi: ApiRow[] = [
    {
      name: 'billing',
      type: `model<'monthly' | 'yearly'>`,
      default: `'monthly'`,
      description: 'Période affichée ; [(billing)].',
    },
    {
      name: 'showBillingToggle',
      type: 'boolean',
      default: 'true',
      description: 'Affiche la bascule mensuel / annuel.',
    },
    { name: 'yearlyHint', type: 'string', description: 'Mention accolée à « Annuel ».' },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Langue des prix.' },
    { name: 'currency', type: 'string', default: `'EUR'`, description: 'Devise ISO 4217.' },
    {
      name: 'headingLevel',
      type: 'number',
      default: '3',
      description: 'Niveau de titre du nom des forfaits.',
    },
    { name: 'ariaLabel', type: 'string', description: 'Nom de la liste des forfaits.' },
    {
      name: 'labels',
      type: 'Partial<GestioPricingTableLabels>',
      default: '{}',
      description: 'Libellés (périodes, badge, boutons, sur devis, gratuit…).',
    },
    {
      name: '(planSelect)',
      type: 'GestioPricingSelection',
      description: '{ plan, billing } au clic sur un bouton de forfait.',
    },
  ];

  protected readonly planApi: ApiRow[] = [
    { name: 'name', type: 'string', description: 'Nom du forfait (obligatoire).' },
    { name: 'value', type: 'string', default: 'name', description: 'Identifiant émis.' },
    { name: 'description', type: 'string', description: 'Phrase d’accroche.' },
    {
      name: 'monthlyPrice',
      type: 'number | null',
      default: 'null',
      description: 'null = « Sur devis », 0 = « Gratuit ».',
    },
    {
      name: 'yearlyPrice',
      type: 'number | null',
      default: '12 × mensuel',
      description: 'Montant annuel total.',
    },
    {
      name: 'features',
      type: 'readonly (string | { label; included? })[]',
      default: '[]',
      description: 'Fonctionnalités ; une chaîne est incluse.',
    },
    {
      name: 'highlighted',
      type: 'boolean',
      default: 'false',
      description: 'Mise en avant et badge « Populaire ».',
    },
    {
      name: 'current',
      type: 'boolean',
      default: 'false',
      description: 'Forfait actuel : bouton désactivé.',
    },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Désactive le bouton.' },
    {
      name: 'ctaLabel',
      type: 'string',
      default: `'Choisir ce forfait'`,
      description: 'Libellé du bouton.',
    },
  ];
}
