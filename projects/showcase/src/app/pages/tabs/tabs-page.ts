import { Component, signal } from '@angular/core';
import { GestioBadge } from '@gestiolabs336/ui/badge';
import { GestioTab, GestioTabs } from '@gestiolabs336/ui/tabs';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-tabs-page',
  imports: [GestioTabs, GestioTab, GestioBadge, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Onglets" eyebrow="Composants">
      <code>gestio-tabs</code> suit le motif ARIA « Tabs » : un seul arrêt de tabulation pour la
      liste, flèches gauche/droite, <kbd>Début</kbd> et <kbd>Fin</kbd> pour se déplacer. Les onglets
      désactivés sont ignorés.
    </sc-page-header>

    <sc-example
      heading="Style underline"
      description="Placez le focus sur un onglet puis utilisez les flèches."
      [code]="underlineCode"
      stacked
    >
      <gestio-tabs ariaLabel="Fiche client" [(selectedIndex)]="selected">
        <gestio-tab label="Informations">
          <p style="margin: 0">Atelier Moreau SARL — 14 rue des Tanneurs, 69002 Lyon.</p>
        </gestio-tab>
        <gestio-tab label="Factures">
          <p style="margin: 0">
            18 factures, dont 2 en attente de règlement
            <gestio-badge variant="warning" size="sm">2 en attente</gestio-badge>
          </p>
        </gestio-tab>
        <gestio-tab label="Contrats" disabled>
          <p style="margin: 0">Module non activé.</p>
        </gestio-tab>
        <gestio-tab label="Historique">
          <p style="margin: 0">Dernière modification le 12 octobre par Claire Moreau.</p>
        </gestio-tab>
      </gestio-tabs>
      <p class="sc-result" aria-live="polite">
        selectedIndex : <strong>{{ selected() }}</strong>
      </p>
    </sc-example>

    <sc-example heading="Style pills" [code]="pillsCode" stacked>
      <gestio-tabs
        variant="pills"
        ariaLabel="Période"
        (selectedIndexChange)="period.set(periods[$event])"
      >
        <gestio-tab label="Jour"
          ><p style="margin: 0">Chiffre d’affaires du jour : 1 240 €</p></gestio-tab
        >
        <gestio-tab label="Semaine"
          ><p style="margin: 0">Chiffre d’affaires de la semaine : 9 870 €</p></gestio-tab
        >
        <gestio-tab label="Mois"
          ><p style="margin: 0">Chiffre d’affaires du mois : 48 250 €</p></gestio-tab
        >
      </gestio-tabs>
      <p class="sc-result" aria-live="polite">
        Événement selectedIndexChange : <strong>{{ period() ?? 'aucun' }}</strong>
      </p>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-tabs et gestio-tab" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Activation automatique : déplacer le focus sélectionne l’onglet. Les panneaux inactifs
          portent l’attribut <code>hidden</code> ; leur contenu reste instancié mais n’est ni
          visible ni atteignable au clavier.
        </p>
      </div>
    </section>
  `,
})
export class TabsPage {
  protected readonly selected = signal(0);
  protected readonly periods = ['Jour', 'Semaine', 'Mois'];
  protected readonly period = signal<string | null>(null);

  protected readonly underlineCode = `<gestio-tabs ariaLabel="Fiche client" [(selectedIndex)]="selected">
  <gestio-tab label="Informations">…</gestio-tab>
  <gestio-tab label="Factures">…</gestio-tab>
  <gestio-tab label="Contrats" disabled>…</gestio-tab>
  <gestio-tab label="Historique">…</gestio-tab>
</gestio-tabs>`;

  protected readonly pillsCode = `<gestio-tabs variant="pills" ariaLabel="Période" (selectedIndexChange)="onChange($event)">
  <gestio-tab label="Jour">…</gestio-tab>
  <gestio-tab label="Semaine">…</gestio-tab>
  <gestio-tab label="Mois">…</gestio-tab>
</gestio-tabs>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'selectedIndex',
      type: 'model<number>',
      default: '0',
      description: 'Onglet actif ; [(selectedIndex)] ou (selectedIndexChange).',
    },
    {
      name: 'variant',
      type: `'underline' | 'pills'`,
      default: `'underline'`,
      description: 'Style.',
    },
    { name: 'ariaLabel', type: 'string', description: 'Nom accessible de la liste d’onglets.' },
    {
      name: 'stretch',
      type: 'boolean',
      default: 'false',
      description: 'Onglets sur toute la largeur.',
    },
    { name: 'gestio-tab · label', type: 'string', description: 'Libellé (obligatoire).' },
    {
      name: 'gestio-tab · disabled',
      type: 'boolean',
      default: 'false',
      description: 'Onglet non sélectionnable.',
    },
  ];
}
