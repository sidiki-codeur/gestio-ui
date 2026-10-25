import { Component, signal } from '@angular/core';
import { GestioAlert } from '@gestiolabs336/ui/alert';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-alert-page',
  imports: [GestioAlert, GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Alerte" eyebrow="Composants">
      Message contextuel affiché dans la page. Contrairement à la notification, il reste en place
      tant que la situation dure. Un préfixe (« Erreur : », « Succès : »…) est lu par les lecteurs
      d’écran.
    </sc-page-header>

    <sc-example heading="Variantes" [code]="variantsCode" stacked>
      <gestio-alert title="Nouvelle version"
        >La facturation récurrente est disponible.</gestio-alert
      >
      <gestio-alert variant="success" title="Paiement reçu">
        La facture F-2024-118 est réglée.
      </gestio-alert>
      <gestio-alert variant="warning" title="Période d’essai">
        Il vous reste 3 jours d’essai.
        <div gestioAlertActions>
          <button gestioButton size="sm">Choisir une offre</button>
          <button gestioButton size="sm" variant="ghost">Plus tard</button>
        </div>
      </gestio-alert>
      <gestio-alert variant="danger" title="Synchronisation bancaire interrompue">
        Reconnectez votre compte pour reprendre l’import des relevés.
      </gestio-alert>
    </sc-example>

    <sc-example
      heading="Insérée après une action, avec fermeture"
      description='live="polite" l’annonce ; dismissed laisse l’application la retirer.'
      [code]="dynamicCode"
      stacked
    >
      <div class="sc-row">
        <button gestioButton variant="outline" (click)="saved.set(true)">Enregistrer</button>
      </div>
      @if (saved()) {
        <gestio-alert variant="success" live="polite" dismissible (dismissed)="saved.set(false)">
          Les modifications ont été enregistrées.
        </gestio-alert>
      }
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de l’alerte" [rows]="api" />
    </section>
  `,
})
export class AlertPage {
  protected readonly saved = signal(false);

  protected readonly variantsCode = `<gestio-alert title="Nouvelle version">La facturation récurrente est disponible.</gestio-alert>
<gestio-alert variant="warning" title="Période d’essai">
  Il vous reste 3 jours d’essai.
  <div gestioAlertActions>
    <button gestioButton size="sm">Choisir une offre</button>
  </div>
</gestio-alert>`;

  protected readonly dynamicCode = `@if (saved()) {
  <gestio-alert variant="success" live="polite" dismissible (dismissed)="saved.set(false)">
    Les modifications ont été enregistrées.
  </gestio-alert>
}`;

  protected readonly api: ApiRow[] = [
    {
      name: 'variant',
      type: "'info' | 'success' | 'warning' | 'danger'",
      default: "'info'",
      description: 'Couleur et icône.',
    },
    { name: 'title', type: 'string', description: 'Titre en gras.' },
    {
      name: 'live',
      type: "'off' | 'polite' | 'assertive'",
      default: "'off'",
      description: 'Annonce : aucune, role="status" ou role="alert".',
    },
    { name: 'dismissible', type: 'boolean', default: 'false', description: 'Bouton de fermeture.' },
    {
      name: 'dismissLabel',
      type: 'string',
      default: "'Fermer le message'",
      description: 'Nom du bouton de fermeture.',
    },
    {
      name: 'variantLabel',
      type: 'string',
      description: 'Préfixe lu par les lecteurs d’écran.',
    },
    { name: '(dismissed)', type: 'void', description: 'Clic sur fermer.' },
  ];
}
