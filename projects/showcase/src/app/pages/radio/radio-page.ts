import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GESTIO_RADIO_IMPORTS } from '@gestiolabs336/ui/radio';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

interface Plan {
  readonly id: string;
  readonly name: string;
  readonly price: string;
}

@Component({
  selector: 'sc-radio-page',
  imports: [GESTIO_RADIO_IMPORTS, ReactiveFormsModule, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Boutons radio" eyebrow="Composants">
      Un choix unique parmi quelques options visibles. Le groupe est un
      <code>&lt;fieldset&gt;</code> natif : les flèches passent d’une option à l’autre, Tab entre et
      sort du groupe.
    </sc-page-header>

    <sc-example heading="Avec Reactive Forms" [code]="formCode" stacked>
      <gestio-radio-group
        label="Mode de paiement"
        hint="Modifiable jusqu’à la validation de la commande."
        required
        [formControl]="payment"
      >
        <gestio-radio value="card" label="Carte bancaire" />
        <gestio-radio value="transfer" label="Virement" description="Sous 2 jours ouvrés." />
        <gestio-radio value="check" label="Chèque" description="Bientôt disponible." disabled />
      </gestio-radio-group>
      <p class="sc-result" aria-live="polite">
        Valeur du contrôle : <strong>{{ payment.value }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Valeurs objet et disposition horizontale"
      description="La valeur peut être de n’importe quel type ; elle est comparée par référence."
      [code]="objectCode"
      stacked
    >
      <gestio-radio-group label="Formule" orientation="horizontal" [(value)]="plan">
        @for (item of plans; track item.id) {
          <gestio-radio [value]="item" [label]="item.name" [description]="item.price" />
        }
      </gestio-radio-group>
      <p class="sc-result" aria-live="polite">
        Formule choisie : <strong>{{ plan()?.name ?? 'aucune' }}</strong>
      </p>
    </sc-example>

    <sc-example heading="Erreur" [code]="errorCode" stacked>
      <gestio-radio-group
        label="Fréquence de facturation"
        required
        error="Choisissez une fréquence pour continuer."
      >
        <gestio-radio value="monthly" label="Mensuelle" />
        <gestio-radio value="yearly" label="Annuelle" />
      </gestio-radio-group>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties des boutons radio" [rows]="api" />
    </section>
  `,
})
export class RadioPage {
  protected readonly payment = new FormControl('card', { nonNullable: true });

  protected readonly plans: readonly Plan[] = [
    { id: 'starter', name: 'Essentiel', price: '19 € / mois' },
    { id: 'pro', name: 'Pro', price: '49 € / mois' },
    { id: 'team', name: 'Équipe', price: '99 € / mois' },
  ];
  protected readonly plan = signal<Plan | null>(this.plans[1]);

  protected readonly formCode = `<gestio-radio-group label="Mode de paiement" formControlName="payment" required>
  <gestio-radio value="card" label="Carte bancaire" />
  <gestio-radio value="transfer" label="Virement" description="Sous 2 jours ouvrés." />
  <gestio-radio value="check" label="Chèque" disabled />
</gestio-radio-group>

// imports: [GESTIO_RADIO_IMPORTS, ReactiveFormsModule]`;

  protected readonly objectCode = `<gestio-radio-group label="Formule" orientation="horizontal" [(value)]="plan">
  @for (item of plans; track item.id) {
    <gestio-radio [value]="item" [label]="item.name" [description]="item.price" />
  }
</gestio-radio-group>`;

  protected readonly errorCode = `<gestio-radio-group label="Fréquence de facturation" required
  [error]="frequencyError()">…</gestio-radio-group>`;

  protected readonly api: ApiRow[] = [
    { name: 'label', type: 'string', description: 'Légende du groupe.' },
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible sans légende visible.' },
    { name: 'hint, error', type: 'string', description: 'Aide et erreur reliées au groupe.' },
    {
      name: 'value',
      type: 'model<T | null>',
      default: 'null',
      description: 'Valeur choisie ; [(value)] hors formulaire.',
    },
    {
      name: 'orientation',
      type: "'vertical' | 'horizontal'",
      default: "'vertical'",
      description: 'Disposition des options.',
    },
    {
      name: 'disabled, required',
      type: 'boolean',
      default: 'false',
      description: 'États du groupe.',
    },
    { name: 'name', type: 'string', description: 'Attribut name commun, généré si absent.' },
    {
      name: 'gestio-radio : value',
      type: 'unknown',
      description: 'Valeur transmise au groupe (requise).',
    },
    {
      name: 'gestio-radio : label, description, disabled',
      type: 'string | boolean',
      description: 'Libellé, texte secondaire, choix désactivé.',
    },
  ];
}
