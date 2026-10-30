import { Component, WritableSignal, signal } from '@angular/core';
import { GestioBadge } from '@gestiolabs336/ui/badge';
import { GESTIO_NAVMENU_IMPORTS } from '@gestiolabs336/ui/navigation';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';
import { DEMO_ICONS } from '../layout-examples/demo-parts';

@Component({
  selector: 'sc-navmenu-page',
  imports: [GESTIO_NAVMENU_IMPORTS, GestioBadge, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Menu de navigation" eyebrow="Composants">
      <code>nav[gestioNavmenu]</code> assemble des liens (<code>gestioNavItem</code>), des groupes
      titrés (<code>gestio-nav-group</code>) et des sous-menus dépliables
      (<code>gestio-nav-submenu</code>). Le même contenu s’affiche en menu vertical, en rail
      d’icônes ou en menu horizontal.
    </sc-page-header>

    <sc-example
      heading="Menu vertical"
      description="Groupes titrés, compteur et sous-menu en accordéon (bouton avec aria-expanded)."
      [code]="verticalCode"
    >
      <div class="demo-box demo-box--vertical">
        <nav gestioNavmenu aria-label="Exemple : menu vertical">
          <gestio-nav-group label="Général">
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="vertical() === 'Tableau de bord' ? 'page' : null"
              (click)="go($event, vertical, 'Tableau de bord')"
            >
              <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
                <path [attr.d]="icons.home" />
              </svg>
              Tableau de bord
            </a>
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="vertical() === 'Projets' ? 'page' : null"
              (click)="go($event, vertical, 'Projets')"
            >
              <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
                <path [attr.d]="icons.grid" />
              </svg>
              Projets
              <gestio-badge gestioNavBadge size="sm" variant="primary">12</gestio-badge>
            </a>
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="vertical() === 'Tâches' ? 'page' : null"
              (click)="go($event, vertical, 'Tâches')"
            >
              <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
                <path [attr.d]="icons.tasks" />
              </svg>
              Tâches
            </a>
          </gestio-nav-group>
          <gestio-nav-group label="Analyse">
            <gestio-nav-submenu label="Rapports">
              <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
                <path [attr.d]="icons.chart" />
              </svg>
              @for (report of reports; track report) {
                <a
                  gestioNavItem
                  href="#"
                  [attr.aria-current]="vertical() === report ? 'page' : null"
                  (click)="go($event, vertical, report)"
                  >{{ report }}</a
                >
              }
            </gestio-nav-submenu>
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="vertical() === 'Calendrier' ? 'page' : null"
              (click)="go($event, vertical, 'Calendrier')"
            >
              <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
                <path [attr.d]="icons.calendar" />
              </svg>
              Calendrier
            </a>
          </gestio-nav-group>
        </nav>
      </div>
      <p class="sc-result" aria-live="polite">
        Page courante : <strong>{{ vertical() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Rail d’icônes"
      description="collapsed réduit le menu vertical à ses icônes : le libellé apparaît en bulle au survol et au focus (Échap la masque), le sous-menu s’ouvre en panneau latéral."
      [code]="railCode"
    >
      <div class="demo-box demo-box--rail">
        <nav gestioNavmenu collapsed aria-label="Exemple : rail d’icônes">
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="rail() === 'Tableau de bord' ? 'page' : null"
            (click)="go($event, rail, 'Tableau de bord')"
          >
            <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
              <path [attr.d]="icons.home" />
            </svg>
            Tableau de bord
          </a>
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="rail() === 'Projets' ? 'page' : null"
            (click)="go($event, rail, 'Projets')"
          >
            <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
              <path [attr.d]="icons.grid" />
            </svg>
            Projets
          </a>
          <gestio-nav-submenu label="Rapports">
            <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
              <path [attr.d]="icons.chart" />
            </svg>
            @for (report of reports; track report) {
              <a
                gestioNavItem
                href="#"
                [attr.aria-current]="rail() === report ? 'page' : null"
                (click)="go($event, rail, report)"
                >{{ report }}</a
              >
            }
          </gestio-nav-submenu>
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="rail() === 'Paramètres' ? 'page' : null"
            (click)="go($event, rail, 'Paramètres')"
          >
            <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
              <path [attr.d]="icons.settings" />
            </svg>
            Paramètres
          </a>
        </nav>
      </div>
      <p class="sc-result" aria-live="polite">
        Page courante : <strong>{{ rail() }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Menu horizontal"
      description='orientation="horizontal" : le sous-menu devient une liste déroulante, fermée par Échap, un clic extérieur ou l’activation d’un lien.'
      [code]="horizontalCode"
      stacked
    >
      <div class="demo-horizontal">
        <nav gestioNavmenu orientation="horizontal" aria-label="Exemple : menu horizontal">
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="horizontal() === 'Accueil' ? 'page' : null"
            (click)="go($event, horizontal, 'Accueil')"
            >Accueil</a
          >
          <gestio-nav-submenu label="Rapports">
            @for (report of reports; track report) {
              <a
                gestioNavItem
                href="#"
                [attr.aria-current]="horizontal() === report ? 'page' : null"
                (click)="go($event, horizontal, report)"
                >{{ report }}</a
              >
            }
          </gestio-nav-submenu>
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="horizontal() === 'Projets' ? 'page' : null"
            (click)="go($event, horizontal, 'Projets')"
            >Projets</a
          >
        </nav>
      </div>
      <p class="sc-result" aria-live="polite">
        Page courante : <strong>{{ horizontal() }}</strong>
      </p>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de nav[gestioNavmenu]" [rows]="menuApi" />
      <sc-api-table caption="Lien gestioNavItem" [rows]="itemApi" />
      <sc-api-table caption="Groupe gestio-nav-group" [rows]="groupApi" />
      <sc-api-table caption="Sous-menu gestio-nav-submenu" [rows]="submenuApi" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Avec le routeur, posez <code>routerLinkActive</code> et
          <code>ariaCurrentWhenActive="page"</code> sur chaque lien : <code>aria-current</code> met
          en avant la page courante et ouvre d’office le sous-menu qui la contient. Donnez à chaque
          <code>&lt;nav&gt;</code> de la page un <code>aria-label</code> distinct. Dans un layout ou
          une navbar Gestio, l’orientation et le mode rail viennent du conteneur.
        </p>
      </div>
    </section>
  `,
  styles: `
    .demo-icon {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .demo-box {
      box-sizing: border-box;
      padding: var(--gestio-space-2);
      border: 1px solid var(--gestio-color-border);
      border-radius: var(--gestio-radius-lg);
      background: var(--gestio-color-surface);
    }

    .demo-box--vertical {
      width: min(16rem, 100%);
    }

    .demo-box--rail {
      width: 4.5rem;
    }

    /* Réserve la place de la liste déroulante : l’aperçu masque ce qui dépasse. */
    .demo-horizontal {
      min-height: 11rem;
    }
  `,
})
export class NavmenuPage {
  protected readonly icons = DEMO_ICONS;
  protected readonly reports = ['Ventes', 'Dépenses', 'Bilan annuel'] as const;

  protected readonly vertical = signal('Tableau de bord');
  protected readonly rail = signal('Tableau de bord');
  protected readonly horizontal = signal('Accueil');

  protected go(event: Event, current: WritableSignal<string>, label: string): void {
    event.preventDefault();
    current.set(label);
  }

  protected readonly verticalCode = `<nav gestioNavmenu aria-label="Navigation principale">
  <gestio-nav-group label="Général">
    <a gestioNavItem routerLink="/tableau-de-bord" routerLinkActive ariaCurrentWhenActive="page">
      <svg gestioNavIcon viewBox="0 0 20 20" aria-hidden="true"><path d="…" /></svg>
      Tableau de bord
    </a>
    <a gestioNavItem routerLink="/projets" routerLinkActive ariaCurrentWhenActive="page">
      <svg gestioNavIcon viewBox="0 0 20 20" aria-hidden="true"><path d="…" /></svg>
      Projets
      <gestio-badge gestioNavBadge size="sm" variant="primary">12</gestio-badge>
    </a>
  </gestio-nav-group>
  <gestio-nav-group label="Analyse">
    <gestio-nav-submenu label="Rapports">
      <svg gestioNavIcon viewBox="0 0 20 20" aria-hidden="true"><path d="…" /></svg>
      <a gestioNavItem routerLink="/rapports/ventes" routerLinkActive ariaCurrentWhenActive="page">Ventes</a>
      <a gestioNavItem routerLink="/rapports/depenses" routerLinkActive ariaCurrentWhenActive="page">Dépenses</a>
    </gestio-nav-submenu>
  </gestio-nav-group>
</nav>

// imports: [GESTIO_NAVMENU_IMPORTS, GestioBadge, RouterLink, RouterLinkActive]
// Icônes : fill: none; stroke: currentColor; stroke-width: 1.6;`;

  protected readonly railCode = `<nav gestioNavmenu collapsed aria-label="Navigation principale">
  <a gestioNavItem routerLink="/tableau-de-bord" routerLinkActive ariaCurrentWhenActive="page">
    <svg gestioNavIcon viewBox="0 0 20 20" aria-hidden="true"><path d="…" /></svg>
    Tableau de bord
  </a>
  <gestio-nav-submenu label="Rapports">
    <svg gestioNavIcon viewBox="0 0 20 20" aria-hidden="true"><path d="…" /></svg>
    <a gestioNavItem routerLink="/rapports/ventes">Ventes</a>
  </gestio-nav-submenu>
</nav>`;

  protected readonly horizontalCode = `<nav gestioNavmenu orientation="horizontal" aria-label="Navigation principale">
  <a gestioNavItem routerLink="/" routerLinkActive ariaCurrentWhenActive="page">Accueil</a>
  <gestio-nav-submenu label="Rapports" [(expanded)]="reportsOpen">
    <a gestioNavItem routerLink="/rapports/ventes">Ventes</a>
    <a gestioNavItem routerLink="/rapports/depenses">Dépenses</a>
  </gestio-nav-submenu>
  <a gestioNavItem routerLink="/projets" routerLinkActive ariaCurrentWhenActive="page">Projets</a>
</nav>`;

  protected readonly menuApi: ApiRow[] = [
    {
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      description:
        'Orientation ; par défaut celle du conteneur (layout : vertical ; navbar : horizontal), sinon vertical.',
    },
    {
      name: 'collapsed',
      type: 'boolean',
      description: 'Rail d’icônes (menu vertical seulement) ; par défaut l’état du layout.',
    },
    {
      name: 'aria-label',
      type: 'string',
      description: 'Nom du repère de navigation, distinct pour chaque <nav> de la page.',
    },
  ];

  protected readonly itemApi: ApiRow[] = [
    {
      name: 'a[gestioNavItem], button[gestioNavItem]',
      type: 'élément',
      description: 'Lien ou bouton de navigation (type="button" posé d’office).',
    },
    {
      name: 'aria-current="page" ou .is-active',
      type: 'attribut',
      description: 'Met en avant la page courante.',
    },
    {
      name: '[gestioNavIcon]',
      type: 'zone',
      description: 'Icône SVG avant le libellé (1,25 rem), seule visible en mode rail.',
    },
    { name: '(contenu)', type: 'zone', description: 'Libellé du lien.' },
    {
      name: '[gestioNavBadge]',
      type: 'zone',
      description: 'Compteur après le libellé (gestio-badge par exemple).',
    },
  ];

  protected readonly groupApi: ApiRow[] = [
    {
      name: 'label',
      type: 'string (requis)',
      description: 'Titre du groupe (role="group"), remplacé par un séparateur en mode rail.',
    },
  ];

  protected readonly submenuApi: ApiRow[] = [
    { name: 'label', type: 'string (requis)', description: 'Libellé du bouton.' },
    {
      name: 'expanded',
      type: 'model<boolean>',
      default: 'false',
      description:
        'Sous-menu déplié ; [(expanded)]. Accordéon (vertical), liste déroulante (horizontal) ou panneau latéral (rail).',
    },
    {
      name: '[gestioNavIcon]',
      type: 'zone',
      description: 'Icône du bouton (enfant direct du sous-menu).',
    },
  ];
}
