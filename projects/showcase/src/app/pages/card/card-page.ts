import { Component } from '@angular/core';
import { GESTIO_CARD_IMPORTS, GestioBadge, GestioButton } from '@gestiolabs/ui';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-card-page',
  imports: [GESTIO_CARD_IMPORTS, GestioButton, GestioBadge, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Carte" eyebrow="Composants">
      <code>gestio-card</code> regroupe un contenu avec en-tête, actions et pied facultatifs. C’est
      un simple conteneur : aucune sémantique interactive n’est ajoutée.
    </sc-page-header>

    <sc-example heading="Variantes" [code]="variantsCode">
      <div class="sc-grid">
        <gestio-card variant="bordered">
          <h3 gestioCardHeader class="sc-card-title">Chiffre d’affaires</h3>
          <p class="sc-kpi">48 250 €</p>
          <p class="sc-muted" style="margin: 0">Bordée (par défaut)</p>
        </gestio-card>
        <gestio-card variant="elevated">
          <h3 gestioCardHeader class="sc-card-title">Factures en attente</h3>
          <p class="sc-kpi">12</p>
          <p class="sc-muted" style="margin: 0">Élevée</p>
        </gestio-card>
        <gestio-card variant="flat">
          <h3 gestioCardHeader class="sc-card-title">Clients actifs</h3>
          <p class="sc-kpi">326</p>
          <p class="sc-muted" style="margin: 0">À plat</p>
        </gestio-card>
      </div>
    </sc-example>

    <sc-example heading="En-tête, actions et pied" [code]="slotsCode" stacked>
      <gestio-card>
        <div gestioCardHeader>
          <h3 class="sc-card-title">Atelier Moreau SARL</h3>
          <p class="sc-card-subtitle">Client depuis mars 2021 · Lyon</p>
        </div>
        <div gestioCardActions>
          <gestio-badge variant="success" dot>À jour</gestio-badge>
        </div>
        <p style="margin: 0">
          Dernière facture réglée le 12 octobre. Prochaine échéance : 1 840,00 € le 30 novembre.
        </p>
        <div gestioCardFooter>
          <button gestioButton variant="ghost" size="sm">Historique</button>
          <button gestioButton size="sm">Nouvelle facture</button>
        </div>
      </gestio-card>
    </sc-example>

    <sc-example heading="Espacement" [code]="paddingCode">
      <div class="sc-grid">
        <gestio-card padding="sm"><p style="margin: 0">padding="sm"</p></gestio-card>
        <gestio-card padding="md"><p style="margin: 0">padding="md"</p></gestio-card>
        <gestio-card padding="lg"><p style="margin: 0">padding="lg"</p></gestio-card>
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <p>
        Zones de projection : <code>[gestioCardHeader]</code>, <code>[gestioCardActions]</code>,
        contenu par défaut et <code>[gestioCardFooter]</code>. Les zones vides ne sont pas
        affichées. <code>gestioCardActions</code> et <code>gestioCardFooter</code> sont des
        composants (alignement et espacement des boutons) : importez
        <code>GESTIO_CARD_IMPORTS</code> et placez-les sur un conteneur, pas sur un autre composant.
      </p>
      <sc-api-table caption="Entrées de la carte" [rows]="api" />
    </section>
  `,
})
export class CardPage {
  protected readonly variantsCode = `<gestio-card variant="bordered">…</gestio-card>
<gestio-card variant="elevated">…</gestio-card>
<gestio-card variant="flat">…</gestio-card>`;

  protected readonly slotsCode = `// imports: [GESTIO_CARD_IMPORTS, GestioBadge, GestioButton]
// GESTIO_CARD_IMPORTS = GestioCard + GestioCardActions + GestioCardFooter

<gestio-card>
  <div gestioCardHeader>
    <h3>Atelier Moreau SARL</h3>
    <p>Client depuis mars 2021 · Lyon</p>
  </div>
  <div gestioCardActions>
    <gestio-badge variant="success" dot>À jour</gestio-badge>
  </div>

  <p>Dernière facture réglée le 12 octobre.</p>

  <div gestioCardFooter>
    <button gestioButton variant="ghost" size="sm">Historique</button>
    <button gestioButton size="sm">Nouvelle facture</button>
  </div>
</gestio-card>`;

  protected readonly paddingCode = `<gestio-card padding="none | sm | md | lg">…</gestio-card>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'variant',
      type: `'bordered' | 'elevated' | 'flat'`,
      default: `'bordered'`,
      description: 'Bordure fine, ombre légère ou fond atténué.',
    },
    {
      name: 'padding',
      type: `'none' | 'sm' | 'md' | 'lg'`,
      default: `'md'`,
      description: 'Espacement intérieur des zones.',
    },
  ];
}
