import { Component, signal } from '@angular/core';
import { GestioBadge } from '@gestiolabs336/ui/badge';
import {
  GESTIO_PAGE_HEADER_IMPORTS,
  GestioBreadcrumbClick,
  GestioBreadcrumbItem,
} from '@gestiolabs336/ui/blocks/page-header';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioTab, GestioTabs } from '@gestiolabs336/ui/tabs';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-page-header-page',
  imports: [
    GESTIO_PAGE_HEADER_IMPORTS,
    GestioBadge,
    GestioButton,
    GestioTabs,
    GestioTab,
    Example,
    ApiTable,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="En-tête de page" eyebrow="Blocs">
      <code>gestio-page-header</code> ouvre une page d’application : fil d’Ariane, retour, titre
      <code>h1</code>, statut et actions. Les actions passent sous le titre quand la place manque.
    </sc-page-header>

    <div class="sc-note" role="note">
      <strong>Aperçus</strong>
      <p>
        Chaque exemple ci-dessous contient un <code>h1</code> pour illustrer le bloc ; dans une
        application, utilisez un seul <code>gestio-page-header</code> par page.
      </p>
    </div>

    <sc-example
      heading="Fiche client"
      description="Fil d’Ariane interceptable, statut, actions et onglets dans la zone basse."
      [code]="fullCode"
      stacked
    >
      <gestio-page-header
        heading="Atelier Moreau SARL"
        subheading="Client depuis mars 2021 · Lyon"
        [breadcrumbs]="crumbs"
        (breadcrumbClick)="onCrumb($event)"
        divider
      >
        <gestio-badge gestioPageHeaderStatus variant="success" dot>Actif</gestio-badge>
        <div gestioPageHeaderActions>
          <button gestioButton variant="outline">Modifier</button>
          <button gestioButton>Nouvelle facture</button>
        </div>
        <div gestioPageHeaderFooter>
          <gestio-tabs ariaLabel="Sections de la fiche client">
            <gestio-tab label="Informations"><span></span></gestio-tab>
            <gestio-tab label="Factures"><span></span></gestio-tab>
            <gestio-tab label="Contrats"><span></span></gestio-tab>
          </gestio-tabs>
        </div>
      </gestio-page-header>
      <p class="sc-result" aria-live="polite">
        breadcrumbClick : <strong>{{ lastCrumb() ?? 'aucun' }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Retour et métadonnées"
      description="Bouton de retour sans adresse (événement back) et contenu projeté sous le sous-titre."
      [code]="backCode"
      stacked
    >
      <gestio-page-header
        heading="Facture F-2026-0142"
        showBack
        backLabel="Retour aux factures"
        (back)="backs.set(backs() + 1)"
      >
        <gestio-badge gestioPageHeaderStatus variant="warning">En attente</gestio-badge>
        <span>Émise le 12 octobre 2026 · échéance le 11 novembre 2026 · 1 840,00 €</span>
        <div gestioPageHeaderActions>
          <button gestioButton variant="ghost">Télécharger</button>
          <button gestioButton variant="secondary">Relancer</button>
        </div>
      </gestio-page-header>
      <p class="sc-result" aria-live="polite">
        Événements back : <strong>{{ backs() }}</strong>
      </p>
    </sc-example>

    <sc-example heading="Minimal" [code]="minimalCode" stacked>
      <gestio-page-header heading="Tableau de bord" subheading="Activité des 30 derniers jours" />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-page-header" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Les liens du fil d’Ariane sont des <code>href</code> natifs. Avec le routeur Angular,
          écoutez <code>(breadcrumbClick)</code>, appelez <code>event.preventDefault()</code> puis
          naviguez avec <code>Router</code>. Le dernier élément est la page courante
          (<code>aria-current="page"</code>) et n’est jamais un lien.
        </p>
      </div>
    </section>
  `,
})
export class PageHeaderPage {
  protected readonly crumbs: GestioBreadcrumbItem[] = [
    { label: 'Accueil', href: '#accueil' },
    { label: 'Clients', href: '#clients' },
    { label: 'Atelier Moreau SARL' },
  ];
  protected readonly lastCrumb = signal<string | null>(null);
  protected readonly backs = signal(0);

  protected onCrumb(click: GestioBreadcrumbClick): void {
    click.event.preventDefault();
    this.lastCrumb.set(`${click.item.label} (index ${click.index})`);
  }

  protected readonly fullCode = `<gestio-page-header
  heading="Atelier Moreau SARL"
  subheading="Client depuis mars 2021 · Lyon"
  [breadcrumbs]="crumbs"
  (breadcrumbClick)="onCrumb($event)"
  divider
>
  <gestio-badge gestioPageHeaderStatus variant="success" dot>Actif</gestio-badge>
  <div gestioPageHeaderActions>
    <button gestioButton variant="outline">Modifier</button>
    <button gestioButton>Nouvelle facture</button>
  </div>
  <div gestioPageHeaderFooter>
    <gestio-tabs ariaLabel="Sections de la fiche client">…</gestio-tabs>
  </div>
</gestio-page-header>

// TS
crumbs: GestioBreadcrumbItem[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Clients', href: '/clients' },
  { label: 'Atelier Moreau SARL' },
];
onCrumb({ item, event }: GestioBreadcrumbClick) {
  event.preventDefault();
  this.router.navigateByUrl(item.href!);
}`;

  protected readonly backCode = `<gestio-page-header
  heading="Facture F-2026-0142"
  showBack
  backLabel="Retour aux factures"
  (back)="router.navigate(['/factures'])"
>
  <gestio-badge gestioPageHeaderStatus variant="warning">En attente</gestio-badge>
  <span>Émise le 12 octobre 2026 · échéance le 11 novembre 2026 · 1 840,00 €</span>
  <div gestioPageHeaderActions>
    <button gestioButton variant="ghost">Télécharger</button>
    <button gestioButton variant="secondary">Relancer</button>
  </div>
</gestio-page-header>`;

  protected readonly minimalCode = `<gestio-page-header heading="Tableau de bord" subheading="Activité des 30 derniers jours" />`;

  protected readonly api: ApiRow[] = [
    { name: 'heading', type: 'string', description: 'Titre rendu dans un <h1> (obligatoire).' },
    { name: 'subheading', type: 'string', description: 'Texte secondaire sous le titre.' },
    {
      name: 'breadcrumbs',
      type: 'GestioBreadcrumbItem[]',
      default: '[]',
      description: 'Fil d’Ariane { label, href? } ; le dernier élément est la page courante.',
    },
    { name: 'backHref', type: 'string', description: 'Adresse du lien de retour.' },
    {
      name: 'showBack',
      type: 'boolean',
      default: 'false',
      description: 'Bouton de retour sans adresse ; écouter (back).',
    },
    {
      name: 'backLabel',
      type: 'string',
      default: `'Retour'`,
      description: 'Texte du lien ou bouton de retour.',
    },
    {
      name: 'divider',
      type: 'boolean',
      default: 'false',
      description: 'Trait de séparation sous l’en-tête.',
    },
    {
      name: 'labels',
      type: 'Partial<GestioPageHeaderLabels>',
      default: '{}',
      description: 'Libellés : breadcrumb (nom de la navigation), back.',
    },
    { name: '(back)', type: 'void', description: 'Clic sur le bouton de retour.' },
    {
      name: '(breadcrumbClick)',
      type: 'GestioBreadcrumbClick',
      description: 'Clic sur un lien du fil d’Ariane : { item, index, event }.',
    },
  ];
}
