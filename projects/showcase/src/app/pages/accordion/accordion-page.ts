import { Component, signal } from '@angular/core';
import { GestioAccordion, GestioAccordionItem } from '@gestiolabs336/ui/accordion';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-accordion-page',
  imports: [GestioAccordion, GestioAccordionItem, GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Accordéon" eyebrow="Composants">
      <code>gestio-accordion</code> suit le motif ARIA « Accordion » : chaque en-tête est un bouton
      placé dans un titre, relié à sa région par <code>aria-expanded</code> et
      <code>aria-controls</code>. Flèches haut/bas, <kbd>Début</kbd> et <kbd>Fin</kbd> passent d’un
      en-tête à l’autre.
    </sc-page-header>

    <sc-example
      heading="Fiche fournisseur"
      description="Une seule section ouverte à la fois (comportement par défaut)."
      [code]="defaultCode"
      stacked
    >
      <gestio-accordion>
        <gestio-accordion-item heading="Coordonnées" [(expanded)]="contactOpen">
          <svg gestioAccordionIcon viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path
              d="M10 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.5 6c.8-2.6 2.9-4 5.5-4s4.7 1.4 5.5 4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
          Papeterie Lambert — 8 avenue Jean-Jaurès, 31000 Toulouse. Contact : Marc Lambert, 05 61 00
          00 00.
        </gestio-accordion-item>
        <gestio-accordion-item heading="Conditions de paiement">
          Paiement à 45 jours fin de mois, par virement. Escompte de 2 % pour paiement sous 10
          jours.
        </gestio-accordion-item>
        <gestio-accordion-item heading="Coordonnées bancaires">
          IBAN FR76 3000 4000 0500 0012 3456 789 — BIC BNPAFRPP.
        </gestio-accordion-item>
        <gestio-accordion-item heading="Contrat-cadre" disabled>
          Aucun contrat-cadre signé.
        </gestio-accordion-item>
      </gestio-accordion>
      <p class="sc-result" aria-live="polite">
        Coordonnées : <strong>{{ contactOpen() ? 'ouvertes' : 'fermées' }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Sections séparées et ouverture multiple"
      description="Avec multi, plusieurs sections peuvent être ouvertes ; openAll() et closeAll() agissent sur toutes."
      [code]="multiCode"
      stacked
    >
      <div class="sc-row">
        <button gestioButton variant="outline" size="sm" (click)="faq.openAll()">
          Tout déplier
        </button>
        <button gestioButton variant="outline" size="sm" (click)="faq.closeAll()">
          Tout replier
        </button>
      </div>
      <gestio-accordion #faq="gestioAccordion" variant="separated" multi>
        <gestio-accordion-item heading="Comment émettre un avoir ?" [expanded]="true">
          Depuis la facture concernée, choisissez « Créer un avoir ». Le montant est repris et peut
          être ajusté ligne par ligne.
        </gestio-accordion-item>
        <gestio-accordion-item heading="Puis-je modifier une facture validée ?">
          Non : une facture validée est figée. Émettez un avoir puis une nouvelle facture.
        </gestio-accordion-item>
        <gestio-accordion-item heading="Comment relancer un client ?">
          Le menu « Relances » propose des modèles d’e-mail et planifie les rappels automatiques.
        </gestio-accordion-item>
      </gestio-accordion>
    </sc-example>

    <sc-example
      heading="Sans cadre (flush)"
      description="Pour un panneau latéral ou une carte : simples filets entre les sections. headingLevel adapte le titre à la hiérarchie de la page."
      [code]="flushCode"
      stacked
    >
      <gestio-accordion variant="flush">
        <gestio-accordion-item heading="Statut" [expanded]="true">
          Brouillon, envoyée, payée, en retard.
        </gestio-accordion-item>
        <gestio-accordion-item heading="Période">
          Ce mois-ci, trimestre en cours, année fiscale.
        </gestio-accordion-item>
      </gestio-accordion>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table
        caption="Entrées et sorties de gestio-accordion et gestio-accordion-item"
        [rows]="api"
      />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Choisissez <code>headingLevel</code> selon la hiérarchie de la page (niveau du titre qui
          précède l’accordéon + 1). Les sections fermées portent l’attribut <code>hidden</code> :
          leur contenu reste instancié mais n’est ni visible ni atteignable au clavier.
        </p>
      </div>
    </section>
  `,
})
export class AccordionPage {
  protected readonly contactOpen = signal(true);

  protected readonly defaultCode = `<gestio-accordion>
  <gestio-accordion-item heading="Coordonnées" [(expanded)]="contactOpen">
    <svg gestioAccordionIcon aria-hidden="true">…</svg>
    Papeterie Lambert — 8 avenue Jean-Jaurès, 31000 Toulouse.
  </gestio-accordion-item>
  <gestio-accordion-item heading="Conditions de paiement">…</gestio-accordion-item>
  <gestio-accordion-item heading="Coordonnées bancaires">…</gestio-accordion-item>
  <gestio-accordion-item heading="Contrat-cadre" disabled>…</gestio-accordion-item>
</gestio-accordion>`;

  protected readonly multiCode = `<button gestioButton variant="outline" size="sm" (click)="faq.openAll()">Tout déplier</button>
<button gestioButton variant="outline" size="sm" (click)="faq.closeAll()">Tout replier</button>

<gestio-accordion #faq="gestioAccordion" variant="separated" multi>
  <gestio-accordion-item heading="Comment émettre un avoir ?" [expanded]="true">…</gestio-accordion-item>
  <gestio-accordion-item heading="Puis-je modifier une facture validée ?">…</gestio-accordion-item>
  <gestio-accordion-item heading="Comment relancer un client ?">…</gestio-accordion-item>
</gestio-accordion>`;

  protected readonly flushCode = `<!-- Sous un titre h2 : headingLevel 3 (défaut) -->
<gestio-accordion variant="flush">
  <gestio-accordion-item heading="Statut" [expanded]="true">…</gestio-accordion-item>
  <gestio-accordion-item heading="Période">…</gestio-accordion-item>
</gestio-accordion>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'multi',
      type: 'boolean',
      default: 'false',
      description: 'Autorise plusieurs sections ouvertes simultanément.',
    },
    {
      name: 'variant',
      type: `'bordered' | 'separated' | 'flush'`,
      default: `'bordered'`,
      description: 'Bloc encadré, cartes séparées ou filets sans cadre.',
    },
    {
      name: 'openAll() / closeAll()',
      type: 'méthodes',
      description:
        'Ouvre (si multi) ou ferme toutes les sections actives ; exportAs « gestioAccordion ».',
    },
    {
      name: 'gestio-accordion-item · heading',
      type: 'string',
      description: 'Texte de l’en-tête (obligatoire).',
    },
    {
      name: 'gestio-accordion-item · expanded',
      type: 'model<boolean>',
      default: 'false',
      description: 'Section ouverte ; [(expanded)] ou (expandedChange).',
    },
    {
      name: 'gestio-accordion-item · disabled',
      type: 'boolean',
      default: 'false',
      description: 'Section impossible à ouvrir ou fermer.',
    },
    {
      name: 'gestio-accordion-item · headingLevel',
      type: '2 | 3 | 4 | 5 | 6',
      default: '3',
      description: 'Niveau du titre qui contient le bouton d’en-tête.',
    },
    {
      name: 'gestio-accordion-item · (opened) / (closed)',
      type: 'void',
      description: 'Émis à l’ouverture et à la fermeture.',
    },
  ];
}
