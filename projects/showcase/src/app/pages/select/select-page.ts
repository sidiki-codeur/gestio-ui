import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GestioSelect, GestioSelectOption } from '@gestiolabs/ui';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-select-page',
  imports: [GestioSelect, ReactiveFormsModule, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Sélecteur" eyebrow="Composants">
      <code>gestio-select</code> stylise un <code>&lt;select&gt;</code> natif : navigation au
      clavier, saisie rapide et liste native sur mobile sont conservées.
    </sc-page-header>

    <sc-example
      heading="Valeurs numériques préservées"
      description="Le contrôle reçoit un number, pas la chaîne du DOM."
      [code]="numberCode"
    >
      <div class="sc-grid sc-grid--2">
        <gestio-select
          label="Délai de paiement"
          placeholder="Choisir un délai"
          [options]="delays"
          [formControl]="delay"
        />
        <p class="sc-result" aria-live="polite">
          Valeur : <strong>{{ describe(delay.value) }}</strong>
        </p>
      </div>
    </sc-example>

    <sc-example heading="Valeurs texte, aide et option désactivée" [code]="stringCode">
      <div class="sc-grid sc-grid--2">
        <gestio-select
          label="Pays de facturation"
          hint="Détermine le régime de TVA appliqué."
          [options]="countries"
          [formControl]="country"
        />
        <gestio-select
          label="Statut"
          placeholder="Sélectionner"
          [options]="statuses"
          required
          error="Sélectionnez un statut."
        />
      </div>
    </sc-example>

    <sc-example heading="Tailles et désactivé" [code]="sizesCode">
      <div class="sc-grid">
        <gestio-select label="Petit" size="sm" [options]="countries" />
        <gestio-select label="Grand" size="lg" [options]="countries" />
        <gestio-select label="Désactivé" disabled [options]="countries" />
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées du sélecteur" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>Limite</strong>
        <p>
          Version native uniquement : pas de recherche, de sélection multiple ni de groupes
          d’options dans cette version.
        </p>
      </div>
    </section>
  `,
})
export class SelectPage {
  protected readonly delays: GestioSelectOption<number>[] = [
    { label: 'À réception', value: 0 },
    { label: '30 jours', value: 30 },
    { label: '45 jours fin de mois', value: 45 },
    { label: '60 jours', value: 60, disabled: true },
  ];
  protected readonly countries: GestioSelectOption<string>[] = [
    { label: 'France', value: 'FR' },
    { label: 'Belgique', value: 'BE' },
    { label: 'Suisse', value: 'CH' },
    { label: 'Luxembourg', value: 'LU' },
  ];
  protected readonly statuses: GestioSelectOption<string>[] = [
    { label: 'Prospect', value: 'prospect' },
    { label: 'Client actif', value: 'active' },
    { label: 'Archivé', value: 'archived' },
  ];

  protected readonly delay = new FormControl<number | null>(30);
  protected readonly country = new FormControl<string | null>('FR');

  protected describe(value: number | null): string {
    return value === null ? 'null' : `${value} (${typeof value})`;
  }

  protected readonly numberCode = `delays: GestioSelectOption<number>[] = [
  { label: 'À réception', value: 0 },
  { label: '30 jours', value: 30 },
  { label: '45 jours fin de mois', value: 45 },
  { label: '60 jours', value: 60, disabled: true },
];
delay = new FormControl<number | null>(30);

<gestio-select
  label="Délai de paiement"
  placeholder="Choisir un délai"
  [options]="delays"
  [formControl]="delay"
/>`;

  protected readonly stringCode = `<gestio-select
  label="Pays de facturation"
  hint="Détermine le régime de TVA appliqué."
  [options]="countries"
  formControlName="country"
/>`;

  protected readonly sizesCode = `<gestio-select label="Petit" size="sm" [options]="countries" />
<gestio-select label="Grand" size="lg" [options]="countries" />
<gestio-select label="Désactivé" disabled [options]="countries" />`;

  protected readonly api: ApiRow[] = [
    {
      name: 'options',
      type: 'readonly GestioSelectOption<T>[]',
      default: '[]',
      description: 'Options { label, value, disabled? } ; T = string | number.',
    },
    { name: 'placeholder', type: 'string', description: 'Option vide initiale, valeur null.' },
    { name: 'label, ariaLabel', type: 'string', description: 'Libellé visible ou nom accessible.' },
    { name: 'hint', type: 'string', description: 'Aide.' },
    { name: 'error', type: 'string | null', description: 'Message d’erreur.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Hauteur.' },
    { name: 'disabled, required', type: 'boolean', default: 'false', description: 'États natifs.' },
    { name: 'selectId, name', type: 'string', description: 'Attributs natifs.' },
  ];
}
