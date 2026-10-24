import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { GestioInput } from '@gestiolabs/ui';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-input-page',
  imports: [GestioInput, ReactiveFormsModule, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Champ de saisie" eyebrow="Composants">
      <code>gestio-input</code> encapsule un <code>&lt;input&gt;</code> natif avec son label, son
      aide et son message d’erreur, reliés par des identifiants uniques.
    </sc-page-header>

    <sc-example heading="Champ de base" [code]="basicCode">
      <div class="sc-grid sc-grid--2">
        <gestio-input
          label="Raison sociale"
          placeholder="Ex. Atelier Moreau SARL"
          hint="Telle qu’elle figure sur le Kbis."
          required
        />
        <gestio-input
          label="E-mail de facturation"
          type="email"
          placeholder="compta@exemple.fr"
          autocomplete="email"
        />
      </div>
    </sc-example>

    <sc-example heading="Types" [code]="typesCode">
      <div class="sc-grid">
        <gestio-input
          label="Téléphone"
          type="tel"
          placeholder="06 12 34 56 78"
          autocomplete="tel"
        />
        <gestio-input
          label="Mot de passe"
          type="password"
          autocomplete="new-password"
          hint="12 caractères minimum."
        />
        <gestio-input
          label="Quantité"
          type="number"
          [min]="0"
          [step]="1"
          [formControl]="quantity"
        />
      </div>
      <p class="sc-result" aria-live="polite">
        Valeur de « Quantité » : <strong>{{ describe(quantity.value) }}</strong>
      </p>
    </sc-example>

    <sc-example heading="Tailles" [code]="sizesCode">
      <div class="sc-grid">
        <gestio-input label="Petit" size="sm" placeholder="Rechercher" />
        <gestio-input label="Moyen" size="md" placeholder="Rechercher" />
        <gestio-input label="Grand" size="lg" placeholder="Rechercher" />
      </div>
    </sc-example>

    <sc-example heading="Préfixe et suffixe" [code]="affixCode">
      <div class="sc-grid">
        <gestio-input label="Montant HT" type="number" placeholder="0,00">
          <span gestioSuffix>€</span>
        </gestio-input>
        <gestio-input label="Site web" placeholder="exemple.fr">
          <span gestioPrefix>https://</span>
        </gestio-input>
        <gestio-input ariaLabel="Rechercher un client" placeholder="Rechercher un client">
          <svg gestioPrefix width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M10.5 10.5L14 14"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </gestio-input>
      </div>
    </sc-example>

    <sc-example heading="États" [code]="statesCode">
      <div class="sc-grid">
        <gestio-input label="Identifiant client" [formControl]="readonlyControl" readonly />
        <gestio-input label="Code TVA" placeholder="FR00000000000" disabled />
        <gestio-input
          label="SIRET"
          [formControl]="siret"
          [error]="siret.invalid ? 'Le SIRET doit comporter 14 chiffres.' : null"
          required
        />
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <p>
        Implémente <code>ControlValueAccessor</code> : utilisable avec <code>formControlName</code>,
        <code>[formControl]</code> ou <code>ngModel</code>. Les validateurs restent ceux du
        formulaire ; le message passé à <code>error</code> est choisi par l’application.
      </p>
      <sc-api-table caption="Entrées du champ de saisie" [rows]="api" />
    </section>
  `,
})
export class InputPage {
  protected readonly quantity = new FormControl<number | null>(12);
  protected readonly readonlyControl = new FormControl('CLI-00482');
  protected readonly siret = new FormControl('1234', {
    validators: [Validators.required, Validators.pattern(/^\d{14}$/)],
  });

  protected describe(value: number | null): string {
    return value === null ? 'null' : `${value} (${typeof value})`;
  }

  protected readonly basicCode = `<gestio-input
  label="Raison sociale"
  placeholder="Ex. Atelier Moreau SARL"
  hint="Telle qu’elle figure sur le Kbis."
  required
  formControlName="raisonSociale"
/>`;

  protected readonly typesCode = `<gestio-input label="Téléphone" type="tel" />
<gestio-input label="Mot de passe" type="password" autocomplete="new-password" />

<!-- type="number" : la valeur du contrôle est number | null -->
<gestio-input label="Quantité" type="number" [min]="0" [step]="1" [formControl]="quantity" />`;

  protected readonly sizesCode = `<gestio-input label="Petit" size="sm" />
<gestio-input label="Moyen" size="md" />
<gestio-input label="Grand" size="lg" />`;

  protected readonly affixCode = `<gestio-input label="Montant HT" type="number">
  <span gestioSuffix>€</span>
</gestio-input>

<gestio-input label="Site web">
  <span gestioPrefix>https://</span>
</gestio-input>

<!-- Sans label visible : fournir un nom accessible -->
<gestio-input ariaLabel="Rechercher un client" placeholder="Rechercher un client">
  <svg gestioPrefix aria-hidden="true">…</svg>
</gestio-input>`;

  protected readonly statesCode = `<gestio-input label="Identifiant client" readonly [formControl]="id" />
<gestio-input label="Code TVA" disabled />
<gestio-input
  label="SIRET"
  [formControl]="siret"
  [error]="siret.invalid ? 'Le SIRET doit comporter 14 chiffres.' : null"
  required
/>`;

  protected readonly api: ApiRow[] = [
    { name: 'label', type: 'string', description: 'Libellé visible, relié au champ.' },
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible en l’absence de label.' },
    {
      name: 'placeholder',
      type: 'string',
      description: 'Texte indicatif (ne remplace pas le label).',
    },
    { name: 'hint', type: 'string', description: 'Aide, reliée par aria-describedby.' },
    {
      name: 'error',
      type: 'string | null',
      description: 'Message d’erreur ; active aria-invalid et le style d’erreur.',
    },
    {
      name: 'type',
      type: `'text' | 'email' | 'password' | 'tel' | 'number'`,
      default: `'text'`,
      description: 'Type natif ; number expose number | null.',
    },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Hauteur du champ.' },
    {
      name: 'required',
      type: 'boolean',
      default: 'false',
      description: 'Indicateur visuel et attribut natif.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Désactive le champ (cumulé avec le formulaire).',
    },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Lecture seule.' },
    { name: 'inputId', type: 'string', description: 'Identifiant du champ natif (généré sinon).' },
    { name: 'name, autocomplete', type: 'string', description: 'Attributs natifs.' },
    { name: 'min, max, step, maxlength', type: 'number', description: 'Attributs natifs.' },
    {
      name: 'showPasswordLabel, hidePasswordLabel',
      type: 'string',
      default: `'Afficher… / Masquer le mot de passe'`,
      description: 'Libellés du bouton de visibilité.',
    },
  ];
}
