import { Component, signal } from '@angular/core';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GESTIO_CARD_IMPORTS } from '@gestiolabs336/ui/card';
import { GestioSkeleton } from '@gestiolabs336/ui/skeleton';
import { GestioSpinner } from '@gestiolabs336/ui/spinner';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-loading-page',
  imports: [
    GestioSkeleton,
    GestioSpinner,
    GestioButton,
    GESTIO_CARD_IMPORTS,
    Example,
    ApiTable,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="Skeleton et spinner" eyebrow="Composants">
      Le skeleton dessine la forme du contenu à venir ; il est masqué aux lecteurs d’écran. Le
      spinner annonce le chargement (<code>role="status"</code>). L’animation s’arrête ou ralentit
      avec <code>prefers-reduced-motion</code>.
    </sc-page-header>

    <sc-example
      heading="Carte en chargement"
      description="aria-busy sur le conteneur pendant le chargement."
      [code]="cardCode"
      stacked
    >
      <div class="sc-row">
        <button gestioButton variant="outline" (click)="loading.set(!loading())">
          {{ loading() ? 'Afficher le contenu' : 'Simuler un chargement' }}
        </button>
      </div>
      <gestio-card class="sc-loading-card" [attr.aria-busy]="loading()">
        @if (loading()) {
          <div class="sc-loading-head">
            <gestio-skeleton shape="circle" width="2.5rem" />
            <gestio-skeleton width="10rem" />
          </div>
          <gestio-skeleton [lines]="3" />
        } @else {
          <div class="sc-loading-head">
            <span class="sc-avatar" aria-hidden="true">AD</span>
            <p class="sc-card-title">Atelier Durand</p>
          </div>
          <p>Client depuis 2019 · 42 factures · encours de 3 480 €.</p>
        }
      </gestio-card>
    </sc-example>

    <sc-example heading="Formes" [code]="shapesCode" stacked>
      <gestio-skeleton shape="rect" height="5rem" />
      <gestio-skeleton width="60%" />
    </sc-example>

    <sc-example heading="Spinner" [code]="spinnerCode">
      <gestio-spinner size="sm" label="Chargement des factures" />
      <gestio-spinner label="Chargement des factures" />
      <gestio-spinner size="lg" label="Chargement des factures" />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées du skeleton" [rows]="skeletonApi" />
      <sc-api-table caption="Entrées du spinner" [rows]="spinnerApi" />
    </section>
  `,
  styles: `
    .sc-loading-card {
      max-width: 26rem;
    }

    .sc-loading-head {
      display: flex;
      gap: var(--gestio-space-3);
      align-items: center;
      margin-block-end: var(--gestio-space-3);
    }

    .sc-avatar {
      display: inline-grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: var(--gestio-color-primary-subtle);
      color: var(--gestio-color-primary-text);
      font-weight: var(--gestio-font-weight-semibold);
    }
  `,
})
export class LoadingPage {
  protected readonly loading = signal(true);

  protected readonly cardCode = `<gestio-card [attr.aria-busy]="loading()">
  @if (loading()) {
    <gestio-skeleton shape="circle" width="2.5rem" />
    <gestio-skeleton [lines]="3" />
  } @else { … }
</gestio-card>

// imports: [GestioSkeleton]`;

  protected readonly shapesCode = `<gestio-skeleton shape="rect" height="5rem" />
<gestio-skeleton width="60%" />`;

  protected readonly spinnerCode = `<gestio-spinner size="sm" label="Chargement des factures" />
<gestio-spinner label="Chargement des factures" />
<gestio-spinner size="lg" label="Chargement des factures" />

// imports: [GestioSpinner]`;

  protected readonly skeletonApi: ApiRow[] = [
    {
      name: 'shape',
      type: "'text' | 'circle' | 'rect'",
      default: "'text'",
      description: 'Forme.',
    },
    { name: 'width, height', type: 'string', description: 'Dimensions CSS.' },
    {
      name: 'lines',
      type: 'number',
      default: '1',
      description: 'Lignes de texte ; la dernière est plus courte.',
    },
  ];

  protected readonly spinnerApi: ApiRow[] = [
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Taille.' },
    {
      name: 'label',
      type: 'string',
      default: "'Chargement en cours'",
      description: 'Texte annoncé.',
    },
    {
      name: 'decorative',
      type: 'boolean',
      default: 'false',
      description: 'Masqué aux technologies d’assistance.',
    },
  ];
}
