import { Component, WritableSignal, signal } from '@angular/core';
import { GestioAvatar } from '@gestiolabs336/ui/avatar';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GESTIO_NAVMENU_IMPORTS, GestioNavbar } from '@gestiolabs336/ui/navigation';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';
import { DEMO_ICONS } from '../layout-examples/demo-parts';

@Component({
  selector: 'sc-navbar-page',
  imports: [
    GestioNavbar,
    GESTIO_NAVMENU_IMPORTS,
    GestioButton,
    GestioAvatar,
    Example,
    ApiTable,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="Barre de navigation" eyebrow="Composants">
      <code>gestio-navbar</code> réunit la marque, un menu horizontal, un contenu libre (recherche)
      et des actions. Sous le point de rupture <code>collapseBelow</code> (768 px par défaut, mesuré
      sur la largeur de la fenêtre), le menu passe dans un panneau ouvert par le bouton « Menu » :
      réduisez la fenêtre pour le voir.
    </sc-page-header>

    <sc-example
      heading="Barre claire"
      description="Ton surface par défaut : marque, menu avec sous-menu déroulant et actions."
      [code]="lightCode"
      stacked
    >
      <div class="demo-frame">
        <header>
          <gestio-navbar>
            <a gestioNavbarBrand class="demo-brand" href="#" (click)="go($event, light, 'Accueil')">
              <span class="demo-brand__mark" aria-hidden="true">G</span>
              Gestio ERP
            </a>
            <nav gestioNavmenu gestioNavbarMenu aria-label="Exemple : barre claire">
              @for (link of links; track link) {
                <a
                  gestioNavItem
                  href="#"
                  [attr.aria-current]="light() === link ? 'page' : null"
                  (click)="go($event, light, link)"
                  >{{ link }}</a
                >
              }
              <gestio-nav-submenu label="Rapports">
                @for (report of reports; track report) {
                  <a
                    gestioNavItem
                    href="#"
                    [attr.aria-current]="light() === report ? 'page' : null"
                    (click)="go($event, light, report)"
                    >{{ report }}</a
                  >
                }
              </gestio-nav-submenu>
            </nav>
            <div gestioNavbarEnd class="demo-end">
              <button gestioButton variant="ghost" size="sm" aria-label="Notifications">
                <svg class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
                  <path [attr.d]="icons.bell" />
                </svg>
              </button>
              <gestio-avatar name="Awa Traoré" size="sm" />
            </div>
          </gestio-navbar>
        </header>
        <p class="sc-result demo-body" aria-live="polite">
          Page courante : <strong>{{ light() }}</strong>
        </p>
      </div>
    </sc-example>

    <sc-example
      heading="Barre sombre (inverse)"
      description='tone="inverse" : fond bleu nuit, le contenu de la barre reçoit les tokens du thème sombre.'
      [code]="inverseCode"
      stacked
    >
      <div class="demo-frame">
        <header>
          <gestio-navbar tone="inverse">
            <a gestioNavbarBrand class="demo-brand" href="#" (click)="go($event, dark, 'Accueil')">
              <span class="demo-brand__mark" aria-hidden="true">G</span>
              Gestio ERP
            </a>
            <nav gestioNavmenu gestioNavbarMenu aria-label="Exemple : barre sombre">
              @for (link of links; track link) {
                <a
                  gestioNavItem
                  href="#"
                  [attr.aria-current]="dark() === link ? 'page' : null"
                  (click)="go($event, dark, link)"
                  >{{ link }}</a
                >
              }
            </nav>
            <div gestioNavbarEnd class="demo-end">
              <button gestioButton variant="ghost" size="sm" aria-label="Notifications">
                <svg class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
                  <path [attr.d]="icons.bell" />
                </svg>
              </button>
              <gestio-avatar name="Karim Benali" size="sm" />
            </div>
          </gestio-navbar>
        </header>
        <p class="sc-result demo-body" aria-live="polite">
          Page courante : <strong>{{ dark() }}</strong>
        </p>
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et zones de gestio-navbar" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          La navbar n’est pas un repère : placez-la dans un <code>&lt;header&gt;</code> (les layouts
          Gestio en fournissent un). Dans <code>gestio-sidebar-layout</code> ou
          <code>gestio-rail-layout</code>, elle affiche sur petit écran le bouton qui ouvre le
          tiroir de navigation. Le menu se configure avec <code>nav[gestioNavmenu]</code> : voir la
          page « Menu de navigation ».
        </p>
      </div>
    </section>
  `,
  styles: `
    .demo-frame {
      min-height: 17rem;
      overflow: clip;
      border: 1px solid var(--gestio-color-border);
      border-radius: var(--gestio-radius-lg);
      background: var(--gestio-color-background);
    }

    /* Place du panneau du menu (sous-menu déplié compris) sur petit écran. */
    @media (max-width: 47.98rem) {
      .demo-frame {
        min-height: 22rem;
      }
    }

    .demo-body {
      padding: var(--gestio-space-4);
    }

    .demo-brand {
      display: inline-flex;
      gap: var(--gestio-space-2);
      align-items: center;
      border-radius: var(--gestio-radius-md);
      color: inherit;
      font-weight: var(--gestio-font-weight-bold);
      text-decoration: none;
      white-space: nowrap;

      &:focus-visible {
        outline: 2px solid var(--gestio-color-focus-ring);
        outline-offset: 2px;
      }
    }

    .demo-brand__mark {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border-radius: var(--gestio-radius-md);
      background: var(--gestio-color-primary);
      color: var(--gestio-color-on-primary);
    }

    .demo-end {
      display: flex;
      gap: var(--gestio-space-2);
      align-items: center;
    }

    .demo-icon {
      width: 1.25rem;
      height: 1.25rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linejoin: round;
    }
  `,
})
export class NavbarPage {
  protected readonly icons = DEMO_ICONS;
  protected readonly links = ['Accueil', 'Projets', 'Équipe'] as const;
  protected readonly reports = ['Ventes', 'Dépenses'] as const;

  protected readonly light = signal('Accueil');
  protected readonly dark = signal('Accueil');

  protected go(event: Event, current: WritableSignal<string>, label: string): void {
    event.preventDefault();
    current.set(label);
  }

  protected readonly lightCode = `<header>
  <gestio-navbar>
    <a gestioNavbarBrand routerLink="/">Gestio ERP</a>
    <nav gestioNavmenu gestioNavbarMenu aria-label="Navigation principale">
      <a gestioNavItem routerLink="/" routerLinkActive ariaCurrentWhenActive="page">Accueil</a>
      <a gestioNavItem routerLink="/projets" routerLinkActive ariaCurrentWhenActive="page">Projets</a>
      <gestio-nav-submenu label="Rapports">
        <a gestioNavItem routerLink="/rapports/ventes">Ventes</a>
      </gestio-nav-submenu>
    </nav>
    <div gestioNavbarEnd>
      <button gestioButton variant="ghost" size="sm" aria-label="Notifications">…</button>
      <gestio-avatar name="Awa Traoré" size="sm" />
    </div>
  </gestio-navbar>
</header>

// imports: [GestioNavbar, GESTIO_NAVMENU_IMPORTS, GestioButton, GestioAvatar, RouterLink, RouterLinkActive]`;

  protected readonly inverseCode = `<gestio-navbar tone="inverse" collapseBelow="lg" [(menuOpen)]="menuOpen">
  <a gestioNavbarBrand routerLink="/">Gestio ERP</a>
  <nav gestioNavmenu gestioNavbarMenu aria-label="Navigation principale">…</nav>
  <div gestioNavbarEnd>…</div>
</gestio-navbar>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'tone',
      type: "'surface' | 'inverse'",
      default: "'surface'",
      description: 'Teinte de la barre ; inverse applique les tokens du thème sombre.',
    },
    {
      name: 'sticky',
      type: 'boolean',
      default: 'false',
      description: 'Barre fixée en haut au défilement (inutile dans un layout Gestio).',
    },
    {
      name: 'collapseBelow',
      type: "'sm' | 'md' | 'lg' | 'xl' | 'never'",
      default: "'md'",
      description:
        'Sous ce point de rupture (largeur de la fenêtre), le menu passe dans un panneau ; never le garde en ligne.',
    },
    {
      name: 'menuOpen',
      type: 'model<boolean>',
      default: 'false',
      description: 'Panneau du menu ouvert (petits écrans) ; [(menuOpen)]. Échap le ferme.',
    },
    {
      name: 'menuLabel',
      type: 'string',
      default: "'Menu'",
      description: 'Nom accessible du bouton du menu.',
    },
    { name: '[gestioNavbarBrand]', type: 'zone', description: 'Logo et nom, à gauche.' },
    {
      name: '[gestioNavbarMenu]',
      type: 'zone',
      description: 'Menu : <nav gestioNavmenu gestioNavbarMenu aria-label="…">.',
    },
    { name: '(contenu)', type: 'zone', description: 'Contenu central (recherche).' },
    {
      name: '[gestioNavbarEnd]',
      type: 'zone',
      description: 'Actions à droite (notifications, profil).',
    },
  ];
}
