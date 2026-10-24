import { Component, DestroyRef, inject, signal } from '@angular/core';
import { GestioButton, GestioButtonVariant } from '@gestiolabs/ui';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-button-page',
  imports: [GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Bouton" eyebrow="Composants">
      Directive-composant appliquée sur un <code>&lt;button&gt;</code> ou un
      <code>&lt;a&gt;</code> natif : le comportement clavier, le focus et la soumission de
      formulaire restent ceux du navigateur.
    </sc-page-header>

    <sc-example heading="Variantes" [code]="variantsCode">
      @for (variant of variants; track variant.value) {
        <button gestioButton [variant]="variant.value">{{ variant.label }}</button>
      }
    </sc-example>

    <sc-example heading="Tailles" [code]="sizesCode">
      <button gestioButton size="sm">Petit</button>
      <button gestioButton size="md">Moyen</button>
      <button gestioButton size="lg">Grand</button>
    </sc-example>

    <sc-example
      heading="Chargement simulé"
      description="Le bouton garde sa largeur, reste focalisable et ignore les clics pendant le chargement."
      [code]="loadingCode"
    >
      <button gestioButton [loading]="saving()" (click)="save()">Enregistrer la facture</button>
      <button gestioButton variant="outline" [loading]="saving()" (click)="save()">
        Exporter en PDF
      </button>
      <p class="sc-result" aria-live="polite">
        Enregistrements effectués : <strong>{{ saveCount() }}</strong>
      </p>
    </sc-example>

    <sc-example heading="Icônes" [code]="iconCode">
      <button gestioButton>
        <svg gestioButtonIcon width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 3v10M3 8h10"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
          />
        </svg>
        Nouveau client
      </button>
      <button gestioButton variant="ghost">
        Suivant
        <svg gestioButtonIconEnd width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M6 3.5L10.5 8 6 12.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button gestioButton variant="outline" aria-label="Paramètres">
        <svg gestioButtonIcon width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="2.25" fill="none" stroke="currentColor" stroke-width="1.5" />
          <path
            d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </sc-example>

    <sc-example heading="États et largeur" [code]="statesCode" stacked>
      <div class="sc-row">
        <button gestioButton disabled>Désactivé</button>
        <button gestioButton variant="outline" disabled>Désactivé</button>
        <a gestioButton variant="secondary" href="#api">Lien stylé en bouton</a>
      </div>
      <button gestioButton fullWidth>Valider la commande</button>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <p>Sélecteurs : <code>button[gestioButton]</code>, <code>a[gestioButton]</code>.</p>
      <sc-api-table caption="Entrées du bouton" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Un bouton contenant uniquement une icône doit recevoir un <code>aria-label</code>. Sur un
          lien, <code>disabled</code> pose <code>aria-disabled</code> et retire le lien de l’ordre
          de tabulation.
        </p>
      </div>
    </section>
  `,
})
export class ButtonPage {
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly saving = signal(false);
  protected readonly saveCount = signal(0);

  protected readonly variants: { value: GestioButtonVariant; label: string }[] = [
    { value: 'primary', label: 'Enregistrer' },
    { value: 'secondary', label: 'Dupliquer' },
    { value: 'outline', label: 'Annuler' },
    { value: 'ghost', label: 'Plus d’options' },
    { value: 'danger', label: 'Supprimer' },
  ];

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected save(): void {
    this.saving.set(true);
    this.timer = setTimeout(() => {
      this.saving.set(false);
      this.saveCount.update((count) => count + 1);
    }, 1500);
  }

  protected readonly variantsCode = `<button gestioButton variant="primary">Enregistrer</button>
<button gestioButton variant="secondary">Dupliquer</button>
<button gestioButton variant="outline">Annuler</button>
<button gestioButton variant="ghost">Plus d’options</button>
<button gestioButton variant="danger">Supprimer</button>`;

  protected readonly sizesCode = `<button gestioButton size="sm">Petit</button>
<button gestioButton size="md">Moyen</button>
<button gestioButton size="lg">Grand</button>`;

  protected readonly loadingCode = `<button gestioButton [loading]="saving()" (click)="save()">
  Enregistrer la facture
</button>

// Composant
saving = signal(false);
save() {
  this.saving.set(true);
  this.api.save().subscribe({ complete: () => this.saving.set(false) });
}`;

  protected readonly iconCode = `<button gestioButton>
  <svg gestioButtonIcon aria-hidden="true">…</svg>
  Nouveau client
</button>

<button gestioButton variant="ghost">
  Suivant
  <svg gestioButtonIconEnd aria-hidden="true">…</svg>
</button>

<button gestioButton variant="outline" aria-label="Paramètres">
  <svg gestioButtonIcon aria-hidden="true">…</svg>
</button>`;

  protected readonly statesCode = `<button gestioButton disabled>Désactivé</button>
<a gestioButton variant="secondary" href="/aide">Lien stylé en bouton</a>
<button gestioButton fullWidth>Valider la commande</button>
<button gestioButton type="submit">Envoyer</button>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'variant',
      type: `'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'`,
      default: `'primary'`,
      description: 'Style visuel.',
    },
    {
      name: 'size',
      type: `'sm' | 'md' | 'lg'`,
      default: `'md'`,
      description: 'Hauteur et typographie.',
    },
    {
      name: 'type',
      type: `'button' | 'submit' | 'reset'`,
      default: `'button'`,
      description: 'Type natif (ignoré sur un lien).',
    },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Désactive le bouton.' },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Affiche l’indicateur, pose aria-busy et bloque clics et soumission.',
    },
    {
      name: 'fullWidth',
      type: 'boolean',
      default: 'false',
      description: 'Occupe toute la largeur.',
    },
    {
      name: 'loadingLabel',
      type: 'string',
      default: `'Chargement en cours'`,
      description: 'Texte annoncé pendant le chargement.',
    },
  ];
}
