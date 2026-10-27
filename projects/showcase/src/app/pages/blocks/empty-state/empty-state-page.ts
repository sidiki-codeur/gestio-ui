import { Component, signal } from '@angular/core';
import { GESTIO_EMPTY_STATE_IMPORTS } from '@gestiolabs336/ui/blocks/empty-state';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'sc-empty-state-page',
  imports: [GESTIO_EMPTY_STATE_IMPORTS, GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="État vide" eyebrow="Blocs">
      <code>gestio-empty-state</code> remplace une liste sans élément, une recherche sans résultat
      ou un chargement en échec par un message clair et une action pour avancer. Le niveau du titre
      s’adapte à la hiérarchie de la page.
    </sc-page-header>

    <sc-example
      heading="Liste vide"
      description="Premier usage : expliquer ce qui apparaîtra ici et proposer de créer le premier élément."
      [code]="emptyCode"
      stacked
    >
      <gestio-empty-state
        heading="Aucune facture"
        description="Les factures émises apparaîtront ici, avec leur statut de règlement."
        headingLevel="3"
        bordered
      >
        <div gestioEmptyStateActions>
          <button gestioButton variant="outline">Importer</button>
          <button gestioButton (click)="created.set(created() + 1)">Créer une facture</button>
        </div>
      </gestio-empty-state>
      <p class="sc-result" aria-live="polite">
        Factures créées : <strong>{{ created() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Variantes"
      description="Recherche sans résultat, erreur de chargement et action réussie."
      [code]="variantsCode"
    >
      <gestio-empty-state
        variant="search"
        size="sm"
        headingLevel="3"
        heading="Aucun client trouvé"
        description="Vérifiez l’orthographe ou retirez des filtres."
      >
        <div gestioEmptyStateActions>
          <button gestioButton variant="ghost" size="sm">Effacer les filtres</button>
        </div>
      </gestio-empty-state>
      <gestio-empty-state
        variant="error"
        size="sm"
        headingLevel="3"
        heading="Chargement impossible"
        description="Le serveur ne répond pas. Réessayez dans un instant."
      >
        <div gestioEmptyStateActions>
          <button gestioButton variant="outline" size="sm">Réessayer</button>
        </div>
      </gestio-empty-state>
      <gestio-empty-state
        variant="success"
        size="sm"
        headingLevel="3"
        heading="Tout est à jour"
        description="Aucune relance en attente cette semaine."
      />
    </sc-example>

    <sc-example
      heading="Icône et contenu personnalisés"
      description="Remplacez l’icône par une illustration et projetez du contenu riche sous la description."
      [code]="customCode"
      stacked
    >
      <gestio-empty-state heading="Invitez votre équipe" headingLevel="3" size="lg">
        <svg
          gestioEmptyStateIcon
          class="sc-empty-illustration"
          viewBox="0 0 64 64"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="24" cy="24" r="10" />
          <circle cx="44" cy="28" r="8" />
          <path d="M8 54c0-9 7-16 16-16s16 7 16 16" />
          <path d="M36 54c0-7 4-12 8-12s12 5 12 12" />
        </svg>
        <p style="margin: 0">
          Partagez l’accès au dossier client avec vos collaborateurs. Ils recevront un e-mail
          d’invitation valable <strong>7 jours</strong>.
        </p>
        <div gestioEmptyStateActions>
          <button gestioButton>Inviter des membres</button>
        </div>
      </gestio-empty-state>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-empty-state" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Importez <code>GESTIO_EMPTY_STATE_IMPORTS</code> pour la mise en page des actions. Le bloc
          n’est pas une région live : quand il remplace des résultats de recherche, annoncez le
          nombre de résultats ailleurs.
        </p>
      </div>
    </section>
  `,
  styles: `
    .sc-empty-illustration {
      width: 4rem;
      height: 4rem;
      fill: none;
      stroke: var(--gestio-color-primary);
      stroke-width: 3;
      stroke-linecap: round;
    }
  `,
})
export class EmptyStatePage {
  protected readonly created = signal(0);

  protected readonly emptyCode = `<gestio-empty-state
  heading="Aucune facture"
  description="Les factures émises apparaîtront ici, avec leur statut de règlement."
  headingLevel="3"
  bordered
>
  <div gestioEmptyStateActions>
    <button gestioButton variant="outline">Importer</button>
    <button gestioButton (click)="create()">Créer une facture</button>
  </div>
</gestio-empty-state>`;

  protected readonly variantsCode = `<gestio-empty-state variant="search" size="sm" headingLevel="3"
  heading="Aucun client trouvé" description="Vérifiez l’orthographe ou retirez des filtres." />
<gestio-empty-state variant="error" size="sm" headingLevel="3"
  heading="Chargement impossible" description="Le serveur ne répond pas." />
<gestio-empty-state variant="success" size="sm" headingLevel="3"
  heading="Tout est à jour" description="Aucune relance en attente cette semaine." />`;

  protected readonly customCode = `<gestio-empty-state heading="Invitez votre équipe" headingLevel="3" size="lg">
  <svg gestioEmptyStateIcon viewBox="0 0 64 64" aria-hidden="true">…</svg>
  <p>Partagez l’accès au dossier client avec vos collaborateurs.</p>
  <div gestioEmptyStateActions>
    <button gestioButton>Inviter des membres</button>
  </div>
</gestio-empty-state>`;

  protected readonly api: ApiRow[] = [
    { name: 'heading', type: 'string', description: 'Titre (obligatoire).' },
    {
      name: 'headingLevel',
      type: '2 | 3 | 4 | 5 | 6',
      default: '2',
      description: 'Niveau du titre selon la hiérarchie de la page.',
    },
    {
      name: 'description',
      type: 'string',
      description: 'Texte sous le titre ; du contenu riche peut aussi être projeté.',
    },
    {
      name: 'variant',
      type: `'empty' | 'search' | 'error' | 'success'`,
      default: `'empty'`,
      description: 'Icône par défaut et couleur associée.',
    },
    {
      name: 'size',
      type: `'sm' | 'md' | 'lg'`,
      default: `'md'`,
      description: 'Taille de l’icône, du titre et des espacements.',
    },
    {
      name: 'bordered',
      type: 'boolean',
      default: 'false',
      description: 'Bordure en pointillés (zone à remplir).',
    },
  ];
}
