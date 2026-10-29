import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioProgressBar, GestioProgressCircle } from '@gestiolabs336/ui/progress';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

const INVOICE_COUNT = 240;

@Component({
  selector: 'sc-progress-page',
  imports: [GestioProgressBar, GestioProgressCircle, GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Progression" eyebrow="Composants">
      <code>gestio-progress-bar</code> et <code>gestio-progress-circle</code> indiquent l’avancement
      d’une tâche (<code>role="progressbar"</code>). Le pourcentage est formaté par
      <code>Intl</code> et annoncé via <code>aria-valuetext</code> ; en mode indéterminé,
      <code>aria-valuenow</code> est omis.
    </sc-page-header>

    <sc-example
      heading="Barre avec libellé et valeur"
      description="Le libellé visible sert de nom accessible."
      [code]="barCode"
      stacked
    >
      <gestio-progress-bar
        label="Import des factures"
        [value]="imported()"
        [max]="total"
        showValue
        [variant]="imported() === total ? 'success' : 'primary'"
      />
      <div class="sc-row">
        <button gestioButton size="sm" [loading]="running()" (click)="startImport()">
          {{ imported() === total ? 'Relancer l’import' : 'Lancer l’import' }}
        </button>
      </div>
      <p class="sc-result" aria-live="polite">
        {{ importStatus() }}
      </p>
    </sc-example>

    <sc-example
      heading="Variantes et tailles"
      description="La couleur complète le texte : la valeur reste lisible et annoncée."
      [code]="variantsCode"
      stacked
    >
      <gestio-progress-bar label="Espace de stockage" [value]="42" showValue size="sm" />
      <gestio-progress-bar
        label="Objectif de chiffre d’affaires"
        [value]="96"
        variant="success"
        showValue
      />
      <gestio-progress-bar label="Quota d’e-mails" [value]="81" variant="warning" showValue />
      <gestio-progress-bar
        label="Licences utilisées"
        [value]="49"
        [max]="50"
        valueText="49 sur 50"
        variant="danger"
        showValue
        size="lg"
      />
    </sc-example>

    <sc-example
      heading="Durée inconnue"
      description="Mode indéterminé : animation continue, sans valeur. Immobile si l’utilisateur réduit les animations."
      [code]="indeterminateCode"
      stacked
    >
      <gestio-progress-bar label="Synchronisation bancaire" indeterminate />
      <div class="sc-row">
        <gestio-progress-circle ariaLabel="Génération du PDF" indeterminate size="sm" />
        <span>Génération du PDF…</span>
      </div>
    </sc-example>

    <sc-example heading="Cercle" [code]="circleCode">
      <gestio-progress-circle label="Relances envoyées" [value]="62" showValue size="lg" />
      <gestio-progress-circle
        label="Devis signés"
        [value]="18"
        [max]="24"
        variant="success"
        showValue
        size="lg"
      />
      <gestio-progress-circle label="Budget consommé" [value]="92" variant="danger" showValue />
      <gestio-progress-circle ariaLabel="Profil complété" [value]="40" size="sm" />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table
        caption="Entrées de gestio-progress-bar et gestio-progress-circle"
        [rows]="api"
      />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Un nom accessible est obligatoire : <code>label</code> (visible) ou
          <code>ariaLabel</code>. Pour une progression qui évolue, ajoutez si besoin une annonce
          <code>aria-live</code> à des étapes clés (début, fin) plutôt qu’à chaque variation.
        </p>
      </div>
    </section>
  `,
})
export class ProgressPage {
  protected readonly total = INVOICE_COUNT;
  protected readonly imported = signal(0);
  protected readonly running = signal(false);
  private timer: ReturnType<typeof setInterval> | undefined;

  protected readonly importStatus = computed(() => {
    if (this.running()) return 'Import en cours…';
    return this.imported() === this.total
      ? `${this.total} factures importées.`
      : 'Aucun import en cours.';
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
  }

  protected startImport(): void {
    clearInterval(this.timer);
    this.imported.set(0);
    this.running.set(true);
    this.timer = setInterval(() => {
      const next = Math.min(this.total, this.imported() + 24);
      this.imported.set(next);
      if (next === this.total) {
        clearInterval(this.timer);
        this.running.set(false);
      }
    }, 300);
  }

  protected readonly barCode = `<gestio-progress-bar
  label="Import des factures"
  [value]="imported()"
  [max]="240"
  showValue
/>`;

  protected readonly variantsCode = `<gestio-progress-bar label="Espace de stockage" [value]="42" showValue size="sm" />
<gestio-progress-bar label="Objectif de chiffre d’affaires" [value]="96" variant="success" showValue />
<gestio-progress-bar label="Quota d’e-mails" [value]="81" variant="warning" showValue />
<gestio-progress-bar
  label="Licences utilisées"
  [value]="49"
  [max]="50"
  valueText="49 sur 50"
  variant="danger"
  showValue
  size="lg"
/>`;

  protected readonly indeterminateCode = `<gestio-progress-bar label="Synchronisation bancaire" indeterminate />
<gestio-progress-circle ariaLabel="Génération du PDF" indeterminate size="sm" />`;

  protected readonly circleCode = `<gestio-progress-circle label="Relances envoyées" [value]="62" showValue size="lg" />
<gestio-progress-circle label="Devis signés" [value]="18" [max]="24" variant="success" showValue size="lg" />
<gestio-progress-circle ariaLabel="Profil complété" [value]="40" size="sm" />`;

  protected readonly api: ApiRow[] = [
    {
      name: 'value',
      type: 'number',
      default: '0',
      description: 'Avancement, borné entre 0 et max.',
    },
    { name: 'max', type: 'number', default: '100', description: 'Valeur correspondant à 100 %.' },
    {
      name: 'indeterminate',
      type: 'boolean',
      default: 'false',
      description: 'Durée inconnue : animation continue, sans aria-valuenow.',
    },
    { name: 'label', type: 'string', description: 'Libellé visible et nom accessible.' },
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible sans libellé visible.' },
    {
      name: 'variant',
      type: `'primary' | 'success' | 'warning' | 'danger'`,
      default: `'primary'`,
      description: 'Couleur de l’indicateur.',
    },
    {
      name: 'size',
      type: `'sm' | 'md' | 'lg'`,
      default: `'md'`,
      description: 'Épaisseur de la barre ou diamètre du cercle.',
    },
    {
      name: 'showValue',
      type: 'boolean',
      default: 'false',
      description: 'Affiche le pourcentage (masqué sur un cercle sm).',
    },
    {
      name: 'valueText',
      type: 'string',
      description: 'Texte affiché et annoncé à la place du pourcentage.',
    },
    {
      name: 'locale',
      type: 'string',
      default: `'fr-FR'`,
      description: 'Locale Intl du pourcentage.',
    },
    {
      name: 'labels',
      type: 'Partial<GestioProgressLabels>',
      default: '{}',
      description: 'Surcharge des libellés (indeterminate : « En cours »).',
    },
  ];
}
