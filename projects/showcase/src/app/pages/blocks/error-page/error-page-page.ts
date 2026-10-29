import { Component, signal } from '@angular/core';
import {
  GESTIO_ERROR_PAGE_IMPORTS,
  GestioErrorPageCode,
} from '@gestiolabs336/ui/blocks/error-page';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

interface CodeChoice {
  readonly value: GestioErrorPageCode;
  readonly label: string;
}

@Component({
  selector: 'sc-error-page-page',
  imports: [GESTIO_ERROR_PAGE_IMPORTS, GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Page d’erreur" eyebrow="Blocs">
      <code>gestio-error-page</code> affiche une page 404, 403, 500, de maintenance ou hors ligne :
      illustration décorative, surtitre, titre, message par défaut adapté au code et actions.
    </sc-page-header>

    <sc-example
      heading="Types d’erreur"
      description='Chaque code a son illustration et ses textes par défaut. Ici en variante intégrée (variant="inline").'
      [code]="typesCode"
      stacked
    >
      <div class="sc-row" role="group" aria-label="Type d’erreur affiché">
        @for (choice of codes; track choice.value) {
          <button
            gestioButton
            size="sm"
            [variant]="code() === choice.value ? 'primary' : 'outline'"
            [attr.aria-pressed]="code() === choice.value"
            (click)="code.set(choice.value)"
          >
            {{ choice.label }}
          </button>
        }
      </div>
      <div class="ep-frame">
        <gestio-error-page [code]="code()" variant="inline" [headingLevel]="3">
          <div gestioErrorPageActions>
            <a gestioButton href="#accueil">Retour à l’accueil</a>
            @if (code() === 500 || code() === 'offline') {
              <button gestioButton variant="outline" (click)="retries.set(retries() + 1)">
                Réessayer
              </button>
            }
          </div>
        </gestio-error-page>
      </div>
      @if (retries()) {
        <p class="sc-muted" aria-live="polite">Nouvelle tentative n° {{ retries() }}.</p>
      }
    </sc-example>

    <sc-example
      heading="Erreur serveur avec référence"
      description="Titre et message remplacés, contenu projeté sous le message (référence d’incident pour le support)."
      [code]="serverCode"
    >
      <div class="ep-frame">
        <gestio-error-page
          [code]="500"
          variant="inline"
          [headingLevel]="3"
          heading="Impossible d’enregistrer la facture"
          message="Vos modifications sont conservées sur cet appareil. Réessayez dans quelques instants."
        >
          <p>Référence de l’incident : <code>INC-2026-10-2048</code></p>
          <div gestioErrorPageActions>
            <button gestioButton>Réessayer</button>
            <a gestioButton variant="ghost" href="#support">Contacter le support</a>
          </div>
        </gestio-error-page>
      </div>
    </sc-example>

    <sc-example
      heading="Route « page introuvable »"
      description="Variante plein écran (par défaut) avec un h1 : à utiliser comme composant de la route **."
      [code]="routeCode"
      language="typescript"
    >
      <p class="sc-muted">
        En plein écran, le bloc occupe toute la hauteur de la fenêtre et centre son contenu sur le
        fond de l’application.
      </p>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-error-page" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          L’illustration est décorative (<code>aria-hidden</code>) et colorée par les tokens du
          thème. Gardez un seul <code>h1</code> par page : en variante intégrée sous un titre de
          page, réglez <code>headingLevel</code> à 2 ou 3. Mettez à jour le titre du document (<code
            >Title</code
          >
          du routeur) pour que l’erreur soit aussi annoncée par l’onglet.
        </p>
      </div>
    </section>
  `,
  styles: `
    .ep-frame {
      width: 100%;
      border: var(--gestio-border-width) dashed var(--gestio-color-border);
      border-radius: var(--gestio-radius-lg);
      background: var(--gestio-color-surface);
    }
  `,
})
export class ErrorPagePage {
  protected readonly code = signal<GestioErrorPageCode>(404);
  protected readonly retries = signal(0);
  protected readonly codes: readonly CodeChoice[] = [
    { value: 404, label: '404' },
    { value: 403, label: '403' },
    { value: 500, label: '500' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'offline', label: 'Hors ligne' },
  ];

  protected readonly typesCode = `// imports: [GESTIO_ERROR_PAGE_IMPORTS, GestioButton, RouterLink]
<gestio-error-page code="403" variant="inline" headingLevel="2">
  <div gestioErrorPageActions>
    <a gestioButton routerLink="/">Retour à l’accueil</a>
  </div>
</gestio-error-page>

<gestio-error-page code="offline" variant="inline" headingLevel="2">
  <div gestioErrorPageActions>
    <button gestioButton variant="outline" (click)="reessayer()">Réessayer</button>
  </div>
</gestio-error-page>`;

  protected readonly serverCode = `<gestio-error-page
  [code]="500"
  variant="inline"
  headingLevel="3"
  heading="Impossible d’enregistrer la facture"
  message="Vos modifications sont conservées sur cet appareil. Réessayez dans quelques instants."
>
  <p>Référence de l’incident : <code>{{ incidentId }}</code></p>
  <div gestioErrorPageActions>
    <button gestioButton (click)="reessayer()">Réessayer</button>
    <a gestioButton variant="ghost" routerLink="/support">Contacter le support</a>
  </div>
</gestio-error-page>`;

  protected readonly routeCode = `// not-found.page.ts
@Component({
  imports: [GESTIO_ERROR_PAGE_IMPORTS, GestioButton, RouterLink],
  template: \`
    <gestio-error-page code="404">
      <div gestioErrorPageActions>
        <a gestioButton routerLink="/">Retour à l’accueil</a>
      </div>
    </gestio-error-page>
  \`,
})
export class NotFoundPage {}

// app.routes.ts
{ path: '**', title: 'Page introuvable', loadComponent: () => import('./not-found.page').then((m) => m.NotFoundPage) }`;

  protected readonly api: ApiRow[] = [
    {
      name: 'code',
      type: `404 | 403 | 500 | 'maintenance' | 'offline'`,
      default: '404',
      description: 'Type d’erreur : illustration, surtitre et textes par défaut.',
    },
    { name: 'heading', type: 'string', description: 'Remplace le titre par défaut du code.' },
    { name: 'message', type: 'string', description: 'Remplace le message par défaut du code.' },
    {
      name: 'headingLevel',
      type: '1 | 2 | 3 | 4 | 5 | 6',
      default: '1',
      description: 'Niveau du titre (borné à 1–6).',
    },
    {
      name: 'variant',
      type: `'fullscreen' | 'inline'`,
      default: `'fullscreen'`,
      description: 'Plein écran centré ou intégré dans une zone de contenu.',
    },
    {
      name: 'labels',
      type: 'Partial<GestioErrorPageLabels>',
      default: '{}',
      description: 'Surtitres, titres et messages par défaut de chaque code.',
    },
  ];
}
