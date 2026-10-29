import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  GestioBreadcrumb,
  GestioBreadcrumbEntry,
  GestioBreadcrumbLink,
} from '@gestiolabs336/ui/breadcrumb';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-breadcrumb-page',
  imports: [
    GestioBreadcrumb,
    GestioBreadcrumbEntry,
    GestioBreadcrumbLink,
    RouterLink,
    Example,
    ApiTable,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="Fil d’Ariane" eyebrow="Composants">
      <code>gestio-breadcrumb</code> situe la page dans l’arborescence : zone
      <code>&lt;nav&gt;</code> nommée « Fil d’Ariane », liste ordonnée, séparateurs décoratifs et
      <code>aria-current="page"</code> sur le dernier élément.
    </sc-page-header>

    <sc-example
      heading="Avec le routeur Angular"
      description="Le lien a[gestioBreadcrumbLink] accepte routerLink comme href."
      [code]="routerCode"
    >
      <gestio-breadcrumb ariaLabel="Fil d’Ariane de la documentation">
        <gestio-breadcrumb-entry>
          <a gestioBreadcrumbLink routerLink="/">Accueil</a>
        </gestio-breadcrumb-entry>
        <gestio-breadcrumb-entry>
          <a gestioBreadcrumbLink routerLink="/composants">Composants</a>
        </gestio-breadcrumb-entry>
        <gestio-breadcrumb-entry>Fil d’Ariane</gestio-breadcrumb-entry>
      </gestio-breadcrumb>
    </sc-example>

    <sc-example
      heading="Arborescence profonde repliée"
      description="Au-delà de maxItems, les niveaux du milieu sont remplacés par un bouton « … » ; l’activer les affiche et place le focus sur le premier niveau révélé."
      [code]="collapseCode"
    >
      <gestio-breadcrumb [maxItems]="4" [itemsAfterCollapse]="2" ariaLabel="Fil d’Ariane facture">
        <gestio-breadcrumb-entry>
          <a gestioBreadcrumbLink href="#tableau-de-bord">Tableau de bord</a>
        </gestio-breadcrumb-entry>
        <gestio-breadcrumb-entry>
          <a gestioBreadcrumbLink href="#ventes">Ventes</a>
        </gestio-breadcrumb-entry>
        <gestio-breadcrumb-entry>
          <a gestioBreadcrumbLink href="#clients">Clients</a>
        </gestio-breadcrumb-entry>
        <gestio-breadcrumb-entry>
          <a gestioBreadcrumbLink href="#atelier-moreau">Atelier Moreau SARL</a>
        </gestio-breadcrumb-entry>
        <gestio-breadcrumb-entry>
          <a gestioBreadcrumbLink href="#factures">Factures</a>
        </gestio-breadcrumb-entry>
        <gestio-breadcrumb-entry>F-2026-0142</gestio-breadcrumb-entry>
      </gestio-breadcrumb>
    </sc-example>

    <sc-example
      heading="Séparateur barre oblique et libellés traduits"
      description='separator="slash" ; labels surcharge les textes par défaut (ici en anglais).'
      [code]="slashCode"
    >
      <gestio-breadcrumb
        separator="slash"
        [maxItems]="3"
        [labels]="{ navigation: 'Breadcrumb', showHidden: 'Show {count} hidden levels' }"
        lang="en"
      >
        <gestio-breadcrumb-entry>
          <a gestioBreadcrumbLink href="#settings">Settings</a>
        </gestio-breadcrumb-entry>
        <gestio-breadcrumb-entry>
          <a gestioBreadcrumbLink href="#company">Company</a>
        </gestio-breadcrumb-entry>
        <gestio-breadcrumb-entry>
          <a gestioBreadcrumbLink href="#billing">Billing</a>
        </gestio-breadcrumb-entry>
        <gestio-breadcrumb-entry>Tax rates</gestio-breadcrumb-entry>
      </gestio-breadcrumb>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-breadcrumb" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Le dernier élément représente la page courante : laissez-le en texte simple (ou en lien,
          qui reçoit alors <code>aria-current="page"</code>). Une ellipse ne remplace jamais un seul
          niveau. Avec plusieurs fils d’Ariane dans la page, donnez à chacun un
          <code>ariaLabel</code> distinct.
        </p>
      </div>
    </section>
  `,
})
export class BreadcrumbPage {
  protected readonly routerCode = `<gestio-breadcrumb>
  <gestio-breadcrumb-entry>
    <a gestioBreadcrumbLink routerLink="/">Accueil</a>
  </gestio-breadcrumb-entry>
  <gestio-breadcrumb-entry>
    <a gestioBreadcrumbLink routerLink="/composants">Composants</a>
  </gestio-breadcrumb-entry>
  <gestio-breadcrumb-entry>Fil d’Ariane</gestio-breadcrumb-entry>
</gestio-breadcrumb>`;

  protected readonly collapseCode = `<gestio-breadcrumb [maxItems]="4" [itemsAfterCollapse]="2">
  <gestio-breadcrumb-entry><a gestioBreadcrumbLink routerLink="/">Tableau de bord</a></gestio-breadcrumb-entry>
  <gestio-breadcrumb-entry><a gestioBreadcrumbLink routerLink="/ventes">Ventes</a></gestio-breadcrumb-entry>
  <gestio-breadcrumb-entry><a gestioBreadcrumbLink routerLink="/ventes/clients">Clients</a></gestio-breadcrumb-entry>
  <gestio-breadcrumb-entry><a gestioBreadcrumbLink [routerLink]="['/ventes/clients', client.id]">{{ client.nom }}</a></gestio-breadcrumb-entry>
  <gestio-breadcrumb-entry><a gestioBreadcrumbLink routerLink="factures">Factures</a></gestio-breadcrumb-entry>
  <gestio-breadcrumb-entry>{{ facture.numero }}</gestio-breadcrumb-entry>
</gestio-breadcrumb>`;

  protected readonly slashCode = `<gestio-breadcrumb
  separator="slash"
  [maxItems]="3"
  [labels]="{ navigation: 'Breadcrumb', showHidden: 'Show {count} hidden levels' }"
>
  …
</gestio-breadcrumb>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'maxItems',
      type: 'number',
      default: '8',
      description: 'Au-delà, les éléments du milieu sont repliés ; 0 désactive le repli.',
    },
    {
      name: 'itemsBeforeCollapse',
      type: 'number',
      default: '1',
      description: 'Éléments toujours visibles au début en cas de repli.',
    },
    {
      name: 'itemsAfterCollapse',
      type: 'number',
      default: '1',
      description: 'Éléments toujours visibles à la fin en cas de repli.',
    },
    {
      name: 'separator',
      type: `'chevron' | 'slash'`,
      default: `'chevron'`,
      description: 'Séparateur décoratif (masqué aux lecteurs d’écran).',
    },
    {
      name: 'labels',
      type: 'Partial<GestioBreadcrumbLabels>',
      default: '{}',
      description: 'Textes : navigation, showHidden ({count}).',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      description: 'Nom de la navigation (défaut : labels.navigation).',
    },
  ];
}
