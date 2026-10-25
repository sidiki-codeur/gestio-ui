import { Component, inject, signal } from '@angular/core';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GESTIO_MENU_IMPORTS } from '@gestiolabs336/ui/menu';
import { GestioTable } from '@gestiolabs336/ui/table';
import { GestioToastService } from '@gestiolabs336/ui/toast';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

interface Invoice {
  readonly number: string;
  readonly client: string;
}

@Component({
  selector: 'sc-menu-page',
  imports: [GESTIO_MENU_IMPORTS, GestioButton, GestioTable, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Menu déroulant" eyebrow="Composants">
      Basé sur <code>@angular/cdk/menu</code> : flèches haut et bas, Début et Fin, première lettre,
      Échap rend le focus au déclencheur. Le menu est un <code>&lt;ng-template&gt;</code> affiché
      dans un overlay.
    </sc-page-header>

    <sc-example heading="Menu d’actions" [code]="basicCode">
      <button gestioButton variant="outline" [gestioMenuTriggerFor]="actions">
        Actions
        <svg gestioButtonIconEnd viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.75" />
        </svg>
      </button>
      <ng-template #actions>
        <gestio-menu>
          <button gestioMenuItem hint="Ctrl+E" (triggered)="notify('Modifier')">Modifier</button>
          <button gestioMenuItem (triggered)="notify('Dupliquer')">Dupliquer</button>
          <button gestioMenuItem disabled>Envoyer par e-mail</button>
          <gestio-menu-divider />
          <button gestioMenuItem variant="danger" (triggered)="notify('Supprimer')">
            Supprimer
          </button>
        </gestio-menu>
      </ng-template>
      <p class="sc-result" aria-live="polite">
        Dernière action : <strong>{{ last() ?? 'aucune' }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Dans un tableau, avec données"
      description="gestioMenuTriggerData transmet la ligne au menu ; menuPlacement aligne le menu à droite."
      [code]="rowCode"
    >
      <div class="sc-table-wrap" tabindex="0" role="region" aria-label="Factures récentes">
        <table gestioTable>
          <caption class="sc-sr-only">
            Factures récentes
          </caption>
          <thead>
            <tr>
              <th scope="col">Numéro</th>
              <th scope="col">Client</th>
              <th scope="col"><span class="sc-sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            @for (invoice of invoices; track invoice.number) {
              <tr>
                <td>{{ invoice.number }}</td>
                <td>{{ invoice.client }}</td>
                <td class="gestio-table-numeric">
                  <button
                    gestioButton
                    variant="ghost"
                    size="sm"
                    [attr.aria-label]="'Actions pour ' + invoice.number"
                    [gestioMenuTriggerFor]="rowMenu"
                    [gestioMenuTriggerData]="{ $implicit: invoice }"
                    menuPlacement="bottom-end"
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                      <circle cx="3.5" cy="8" r="1.25" fill="currentColor" />
                      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
                      <circle cx="12.5" cy="8" r="1.25" fill="currentColor" />
                    </svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <ng-template #rowMenu let-invoice>
        <gestio-menu>
          <a gestioMenuItem href="#" (click)="$event.preventDefault()"
            >Ouvrir {{ invoice.number }}</a
          >
          <button gestioMenuItem (triggered)="notify('Relancer ' + invoice.client)">
            Relancer le client
          </button>
          <gestio-menu-divider />
          <button gestioMenuItem variant="danger" (triggered)="notify('Annuler ' + invoice.number)">
            Annuler la facture
          </button>
        </gestio-menu>
      </ng-template>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties du menu" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Utilisez <code>(triggered)</code> plutôt que <code>(click)</code> : il couvre aussi Entrée
          et Espace. Hors périmètre : sous-menus et éléments à cocher.
        </p>
      </div>
    </section>
  `,
})
export class MenuPage {
  private readonly toast = inject(GestioToastService);
  protected readonly last = signal<string | null>(null);

  protected readonly invoices: readonly Invoice[] = [
    { number: 'F-2024-118', client: 'Atelier Durand' },
    { number: 'F-2024-119', client: 'Boulangerie Kaboré' },
  ];

  protected notify(action: string): void {
    this.last.set(action);
    this.toast.info(`Action : ${action}`);
  }

  protected readonly basicCode = `<button gestioButton variant="outline" [gestioMenuTriggerFor]="actions">Actions</button>
<ng-template #actions>
  <gestio-menu>
    <button gestioMenuItem hint="Ctrl+E" (triggered)="edit()">Modifier</button>
    <button gestioMenuItem (triggered)="duplicate()">Dupliquer</button>
    <button gestioMenuItem disabled>Envoyer par e-mail</button>
    <gestio-menu-divider />
    <button gestioMenuItem variant="danger" (triggered)="remove()">Supprimer</button>
  </gestio-menu>
</ng-template>

// imports: [GESTIO_MENU_IMPORTS, GestioButton]`;

  protected readonly rowCode = `<button gestioButton variant="ghost" size="sm" [attr.aria-label]="'Actions pour ' + invoice.number"
  [gestioMenuTriggerFor]="rowMenu" [gestioMenuTriggerData]="{ $implicit: invoice }"
  menuPlacement="bottom-end">⋯</button>

<ng-template #rowMenu let-invoice>
  <gestio-menu>
    <button gestioMenuItem (triggered)="remind(invoice)">Relancer le client</button>
  </gestio-menu>
</ng-template>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'gestioMenuTriggerFor',
      type: 'TemplateRef',
      description: 'Déclencheur : le template contenant gestio-menu.',
    },
    {
      name: 'gestioMenuTriggerData',
      type: 'unknown',
      description: 'Contexte du template (let-x).',
    },
    {
      name: 'menuPlacement',
      type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'",
      default: "'bottom-start'",
      description: 'Position préférée, repli automatique.',
    },
    {
      name: '(menuOpened), (menuClosed)',
      type: 'void',
      description: 'Ouverture et fermeture.',
    },
    { name: 'gestio-menu : ariaLabel', type: 'string', description: 'Nom du menu.' },
    {
      name: 'gestioMenuItem : variant',
      type: "'default' | 'danger'",
      default: "'default'",
      description: 'Action destructive en rouge.',
    },
    {
      name: 'gestioMenuItem : hint',
      type: 'string',
      description: 'Texte secondaire (raccourci).',
    },
    {
      name: 'gestioMenuItem : disabled',
      type: 'boolean',
      default: 'false',
      description: 'Inactif mais focalisable (aria-disabled).',
    },
    { name: 'gestioMenuItem : (triggered)', type: 'void', description: 'Activation.' },
  ];
}
