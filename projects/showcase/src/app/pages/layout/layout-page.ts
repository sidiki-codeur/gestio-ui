import { Component, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { GestioBadge } from '@gestiolabs336/ui/badge';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioCard } from '@gestiolabs336/ui/card';
import { GestioInput } from '@gestiolabs336/ui/input';
import {
  GESTIO_BREAKPOINTS,
  GestioBreakpoints,
  GestioContainer,
  GestioGrid,
  GestioGridItem,
  GestioStack,
} from '@gestiolabs336/ui/layout';
import { GestioTextarea } from '@gestiolabs336/ui/textarea';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { CodeBlock } from '../../shared/code-block';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

interface FrameWidth {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'sc-layout-page',
  imports: [
    GestioBadge,
    GestioButton,
    GestioCard,
    GestioContainer,
    GestioGrid,
    GestioGridItem,
    GestioInput,
    GestioStack,
    GestioTextarea,
    RouterLink,
    ApiTable,
    CodeBlock,
    Example,
    PageHeader,
  ],
  template: `
    <sc-page-header heading="Mises en page" eyebrow="Responsive">
      Conteneur, pile, grille, coque d’application et layouts de navigation (menu latéral, menu
      vertical, menu horizontal). La grille et la pile s’adaptent à la largeur de
      <strong>leur conteneur</strong> (container queries) : elles restent correctes dans une page,
      une carte ou une colonne étroite.
    </sc-page-header>

    <section class="sc-section" aria-labelledby="bp">
      <h2 id="bp">Points de rupture</h2>
      <p>
        Approche mobile first : une valeur s’applique à partir de son point de rupture et jusqu’au
        suivant. Point de rupture actuel de la fenêtre :
        <gestio-badge variant="primary">{{ screen.current() }}</gestio-badge>
      </p>
      <div class="sc-row">
        @for (bp of breakpoints; track bp.name) {
          <gestio-badge appearance="outline">{{ bp.name }} ≥ {{ bp.px }} px</gestio-badge>
        }
      </div>
    </section>

    <sc-example
      heading="Tableau de bord responsive"
      description="Choisissez la largeur disponible : indicateurs sur 1, 2 puis 4 colonnes (sm, md), en-tête en ligne à partir de sm, carte « Encaissements » sur 2 colonnes sur 3 à partir de md."
      [code]="dashboardCode"
      stacked
    >
      <div class="sc-row" role="group" aria-label="Largeur du cadre de démonstration">
        @for (width of widths; track width.value) {
          <button
            gestioButton
            size="sm"
            [variant]="frameWidth() === width.value ? 'primary' : 'outline'"
            [attr.aria-pressed]="frameWidth() === width.value"
            (click)="frameWidth.set(width.value)"
          >
            {{ width.label }}
          </button>
        }
      </div>
      <div class="sc-frame" [style.width]="frameWidth()">
        <gestio-stack [gap]="5">
          <gestio-stack
            [direction]="{ base: 'column', sm: 'row' }"
            justify="between"
            [align]="'start'"
            [gap]="3"
          >
            <div>
              <h3 class="sc-card-title">Octobre 2024</h3>
              <p class="sc-card-subtitle">Synthèse de l’activité</p>
            </div>
            <button gestioButton size="sm">Nouvelle facture</button>
          </gestio-stack>

          <gestio-grid [columns]="{ base: 1, sm: 2, md: 4 }" [gap]="3">
            @for (kpi of kpis; track kpi.label) {
              <gestio-card padding="sm">
                <p class="sc-muted" style="margin: 0; font-size: var(--gestio-font-size-sm)">
                  {{ kpi.label }}
                </p>
                <p class="sc-kpi" style="font-size: 1.375rem">{{ kpi.value }}</p>
              </gestio-card>
            }
          </gestio-grid>

          <gestio-grid [columns]="{ base: 1, md: 3 }" [gap]="3">
            <gestio-card padding="sm" [gestioGridSpan]="{ base: 1, md: 2 }">
              <h3 gestioCardHeader class="sc-card-title">Encaissements</h3>
              <p class="sc-muted" style="margin: 0">
                Occupe 2 colonnes sur 3 à partir de md, toute la largeur en dessous.
              </p>
            </gestio-card>
            <gestio-card padding="sm">
              <h3 gestioCardHeader class="sc-card-title">À relancer</h3>
              <p class="sc-muted" style="margin: 0">3 factures en retard.</p>
            </gestio-card>
          </gestio-grid>
        </gestio-stack>
      </div>
    </sc-example>

    <sc-example
      heading="Formulaire sur deux colonnes"
      description="Une colonne sur petit écran, deux à partir de md ; la zone de texte occupe toute la largeur."
      [code]="formCode"
    >
      <gestio-grid [columns]="{ base: 1, md: 2 }" style="width: 100%">
        <gestio-input label="Prénom" autocomplete="given-name" />
        <gestio-input label="Nom" autocomplete="family-name" />
        <gestio-input label="E-mail" type="email" autocomplete="email" />
        <gestio-input label="Téléphone" type="tel" autocomplete="tel" />
        <gestio-textarea gestioGridSpan="full" label="Notes" [rows]="2" />
      </gestio-grid>
    </sc-example>

    <sc-example
      heading="Grille automatique"
      description="Autant de colonnes que possible d’au moins 12 rem, sans point de rupture."
      [code]="autoCode"
    >
      <gestio-grid minItemWidth="12rem" [gap]="3" style="width: 100%">
        @for (client of clients; track client) {
          <gestio-card padding="sm" variant="flat">{{ client }}</gestio-card>
        }
      </gestio-grid>
    </sc-example>

    <sc-example heading="Conteneur" [code]="containerCode" stacked>
      <div class="sc-frame sc-frame--fluid">
        <gestio-container size="sm">
          <gestio-card padding="sm">
            <p style="margin: 0">Contenu centré, 40 rem maximum, marges latérales adaptatives.</p>
          </gestio-card>
        </gestio-container>
      </div>
    </sc-example>

    <section class="sc-section" aria-labelledby="shell">
      <h2 id="shell">Coque d’application</h2>
      <p>
        Ce catalogue utilise <code>gestio-app-shell</code> : réduisez la fenêtre sous 1024 px pour
        voir la barre latérale devenir un tiroir (bouton de menu, focus déplacé dans le tiroir,
        Échap ou clic sur le fond pour fermer, contenu principal inerte pendant l’ouverture).
      </p>
      <sc-code-block language="html" [code]="shellCode" />
    </section>

    <section class="sc-section" aria-labelledby="nav-layouts">
      <h2 id="nav-layouts">Layouts de navigation</h2>
      <p>
        Trois layouts prêts à l’emploi, à combiner avec <code>gestio-navbar</code> et le menu
        <code>nav[gestioNavmenu]</code> (<a routerLink="/composants/barre-de-navigation"
          >barre de navigation</a
        >, <a routerLink="/composants/menu-de-navigation">menu de navigation</a>). Sous le point de
        rupture (1024 px par défaut), les menus verticaux deviennent un tiroir ouvert par le bouton
        de la navbar ; le menu horizontal passe dans un panneau.
      </p>

      @for (layout of navLayouts; track layout.path) {
        <h3>{{ layout.title }}</h3>
        <p>
          {{ layout.description }}
          <a [routerLink]="layout.path">Ouvrir l’exemple en plein écran</a>.
        </p>
        <iframe
          class="sc-layout-frame"
          [title]="'Aperçu : ' + layout.title"
          [src]="layout.src"
        ></iframe>
        <sc-code-block language="html" [code]="layout.code" />
      }

      <h3>Paramètres</h3>
      <sc-api-table caption="Entrées communes aux layouts à menu vertical" [rows]="navLayoutApi" />
      <sc-api-table caption="Zones de projection des layouts" [rows]="navLayoutSlots" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Les layouts fournissent <code>&lt;aside&gt;</code>, <code>&lt;header&gt;</code>,
          <code>&lt;main&gt;</code> et un lien d’évitement : ne pas ajouter d’autre
          <code>&lt;main&gt;</code>. Une <code>gestio-navbar</code> placée dans
          <code>gestioLayoutHeader</code> affiche elle-même le bouton du tiroir. En mode rail,
          chaque lien de premier niveau a besoin d’une icône : son libellé s’affiche en bulle au
          survol et au focus.
        </p>
      </div>
    </section>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <p>
        Valeurs responsives : une valeur fixe ou un objet <code>{{ responsiveExample }}</code
        >. Espacements : <code>0, 1, 2, 3, 4, 5, 6, 8, 10, 12</code> (tokens
        <code>--gestio-space-*</code>).
      </p>
      <h3>gestio-grid et [gestioGridSpan]</h3>
      <sc-api-table caption="Entrées de gestio-grid" [rows]="gridApi" />
      <h3>gestio-stack</h3>
      <sc-api-table caption="Entrées de gestio-stack" [rows]="stackApi" />
      <h3>gestio-container</h3>
      <sc-api-table caption="Entrées de gestio-container" [rows]="containerApi" />
      <h3>gestio-app-shell</h3>
      <sc-api-table caption="Entrées de gestio-app-shell" [rows]="shellApi" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Une étendue <code>gestioGridSpan</code> supérieure au nombre de colonnes crée des colonnes
          supplémentaires : utilisez une valeur responsive ou <code>'full'</code>.
          <code>GestioBreakpoints</code> expose des signaux <code>sm()</code> …
          <code>xl()</code> pour adapter un comportement en TypeScript (toujours
          <code>false</code> en SSR).
        </p>
      </div>
    </section>
  `,
  styles: `
    /* content-box : la largeur choisie est celle réellement disponible pour le contenu. */
    .sc-frame {
      box-sizing: content-box;
      max-width: calc(100% - 2 * var(--gestio-space-4) - 4px);
      padding: var(--gestio-space-4);
      border: 2px dashed var(--gestio-color-border-strong);
      border-radius: var(--gestio-radius-lg);
      background: var(--gestio-color-background);
      transition: width var(--gestio-duration-slow) var(--gestio-easing-standard);
    }

    .sc-frame--fluid {
      padding-inline: 0;
    }

    .sc-layout-frame {
      display: block;
      box-sizing: border-box;
      width: 100%;
      height: 34rem;
      margin-block-end: var(--gestio-space-4);
      border: var(--gestio-border-width) solid var(--gestio-color-border-strong);
      border-radius: var(--gestio-radius-lg);
      background: var(--gestio-color-background);
    }
  `,
})
export class LayoutPage {
  protected readonly screen = inject(GestioBreakpoints);
  protected readonly breakpoints = Object.entries(GESTIO_BREAKPOINTS).map(([name, px]) => ({
    name,
    px,
  }));
  protected readonly responsiveExample = '{ base: 1, md: 2, xl: 4 }';

  protected readonly widths: FrameWidth[] = [
    { label: '360 px', value: '360px' },
    { label: '680 px', value: '680px' },
    { label: '800 px', value: '800px' },
    { label: 'Toute la largeur', value: 'auto' },
  ];
  protected readonly frameWidth = signal('auto');

  protected readonly kpis = [
    { label: 'Chiffre d’affaires', value: '48 250 €' },
    { label: 'Encaissé', value: '39 120 €' },
    { label: 'En attente', value: '12' },
    { label: 'Clients actifs', value: '326' },
  ];
  protected readonly clients = [
    'Atelier Moreau',
    'Électricité Durand',
    'Boulangerie Petit',
    'Cabinet Haddad',
    'Garage Leroy',
    'Imprimerie Benali',
  ];

  protected readonly dashboardCode = `// imports: [GestioStack, GestioGrid, GestioGridItem, GestioCard, GestioButton]
<gestio-stack [gap]="5">
  <gestio-stack [direction]="{ base: 'column', sm: 'row' }" justify="between" [gap]="3">
    <h2>Octobre 2024</h2>
    <button gestioButton size="sm">Nouvelle facture</button>
  </gestio-stack>

  <gestio-grid [columns]="{ base: 1, sm: 2, md: 4 }" [gap]="3">
    <gestio-card>…</gestio-card> <!-- × 4 indicateurs -->
  </gestio-grid>

  <gestio-grid [columns]="{ base: 1, md: 3 }" [gap]="3">
    <gestio-card [gestioGridSpan]="{ base: 1, md: 2 }">Encaissements</gestio-card>
    <gestio-card>À relancer</gestio-card>
  </gestio-grid>
</gestio-stack>`;

  protected readonly formCode = `<gestio-grid [columns]="{ base: 1, md: 2 }">
  <gestio-input label="Prénom" formControlName="firstName" />
  <gestio-input label="Nom" formControlName="lastName" />
  <gestio-input label="E-mail" type="email" formControlName="email" />
  <gestio-input label="Téléphone" type="tel" formControlName="phone" />
  <gestio-textarea gestioGridSpan="full" label="Notes" formControlName="notes" />
</gestio-grid>`;

  protected readonly autoCode = `<gestio-grid minItemWidth="12rem" [gap]="3">
  @for (client of clients; track client) {
    <gestio-card padding="sm" variant="flat">{{ client }}</gestio-card>
  }
</gestio-grid>`;

  protected readonly containerCode = `<gestio-container size="sm">…</gestio-container>
<!-- sm 40rem · md 48rem · lg 64rem · xl 80rem (défaut) · full -->`;

  protected readonly shellCode = `<!-- app.html — imports: [GestioAppShell, RouterOutlet, RouterLink, GestioToaster] -->
<gestio-app-shell>
  <div gestioShellHeader class="app-header">
    <a routerLink="/">Mon ERP</a>
  </div>
  <nav gestioShellSidebar aria-label="Navigation principale">
    <a routerLink="/clients">Clients</a>
    <a routerLink="/factures">Factures</a>
  </nav>
  <router-outlet />
</gestio-app-shell>
<gestio-toaster />`;

  protected readonly gridApi: ApiRow[] = [
    {
      name: 'columns',
      type: 'GestioResponsive<number>',
      default: '1',
      description: 'Colonnes par point de rupture.',
    },
    {
      name: 'minItemWidth',
      type: 'string',
      description: 'Mode automatique (ex. 16rem), prioritaire sur columns.',
    },
    {
      name: 'gap',
      type: 'GestioResponsive<GestioSpace>',
      default: '4',
      description: 'Espacement.',
    },
    {
      name: 'align',
      type: `'start' | 'center' | 'end' | 'stretch'`,
      default: `'stretch'`,
      description: 'Alignement vertical des éléments.',
    },
    {
      name: '[gestioGridSpan]',
      type: `GestioResponsive<number | 'full'>`,
      description: 'Sur un enfant : colonnes occupées (directive GestioGridItem).',
    },
  ];

  protected readonly stackApi: ApiRow[] = [
    {
      name: 'direction',
      type: `GestioResponsive<'row' | 'column'>`,
      default: `'column'`,
      description: 'Direction, ex. { base: column, md: row }.',
    },
    {
      name: 'gap',
      type: 'GestioResponsive<GestioSpace>',
      default: '4',
      description: 'Espacement.',
    },
    {
      name: 'align',
      type: `'start' | 'center' | 'end' | 'stretch' | 'baseline'`,
      default: `'stretch'`,
      description: 'Axe secondaire.',
    },
    {
      name: 'justify',
      type: `'start' | 'center' | 'end' | 'between'`,
      default: `'start'`,
      description: 'Axe principal.',
    },
    { name: 'wrap', type: 'boolean', default: 'false', description: 'Retour à la ligne.' },
  ];

  protected readonly containerApi: ApiRow[] = [
    {
      name: 'size',
      type: `'sm' | 'md' | 'lg' | 'xl' | 'full'`,
      default: `'xl'`,
      description: 'Largeur maximale.',
    },
    {
      name: 'gutters',
      type: 'boolean',
      default: 'true',
      description: 'Marges latérales adaptatives.',
    },
  ];

  private readonly sanitizer = inject(DomSanitizer);

  /** Aperçus : les pages d'exemple chargées dans un cadre (chemin relatif à <base href>). */
  protected readonly navLayouts = [
    {
      title: 'Menu latéral : gestio-sidebar-layout',
      path: '/exemples/layout-menu-lateral',
      description:
        'Barre latérale large (marque, menu, pied), réductible en rail d’icônes avec le bouton « Réduire le menu ».',
      code: `<!-- imports: [GestioSidebarLayout, GestioNavbar, GESTIO_NAVMENU_IMPORTS, RouterOutlet, RouterLink, RouterLinkActive] -->
<gestio-sidebar-layout #layout [(collapsed)]="menuReduit">
  <a gestioLayoutBrand routerLink="/">
    <img src="logo.svg" alt="" width="32" height="32" />
    @if (!layout.railMode()) { <span>Mon ERP</span> }
  </a>
  <nav gestioNavmenu gestioLayoutNav aria-label="Navigation principale">
    <gestio-nav-group label="Général">
      <a gestioNavItem routerLink="/projets" routerLinkActive ariaCurrentWhenActive="page">
        <svg gestioNavIcon viewBox="0 0 20 20" aria-hidden="true">…</svg>
        Projets
      </a>
      <gestio-nav-submenu label="Rapports">
        <svg gestioNavIcon viewBox="0 0 20 20" aria-hidden="true">…</svg>
        <a gestioNavItem routerLink="/rapports/ventes" routerLinkActive ariaCurrentWhenActive="page">Ventes</a>
      </gestio-nav-submenu>
    </gestio-nav-group>
  </nav>
  <gestio-navbar gestioLayoutHeader>
    <input type="search" aria-label="Rechercher" />
    <div gestioNavbarEnd>…profil…</div>
  </gestio-navbar>
  <router-outlet />
</gestio-sidebar-layout>`,
    },
    {
      title: 'Menu vertical : gestio-rail-layout',
      path: '/exemples/layout-menu-vertical',
      description:
        'Rail étroit d’icônes : libellés en bulle au survol et au focus, sous-menus en panneau latéral.',
      code: `<!-- imports: [GestioRailLayout, GestioNavbar, GESTIO_NAVMENU_IMPORTS, RouterOutlet, RouterLink, RouterLinkActive] -->
<gestio-rail-layout>
  <a gestioLayoutBrand routerLink="/" aria-label="Accueil">
    <img src="logo.svg" alt="" width="32" height="32" />
  </a>
  <nav gestioNavmenu gestioLayoutNav aria-label="Navigation principale">
    <a gestioNavItem routerLink="/projets" routerLinkActive ariaCurrentWhenActive="page">
      <svg gestioNavIcon viewBox="0 0 20 20" aria-hidden="true">…</svg>
      Projets
    </a>
  </nav>
  <gestio-navbar gestioLayoutHeader>
    <div gestioNavbarEnd>…profil…</div>
  </gestio-navbar>
  <router-outlet />
</gestio-rail-layout>`,
    },
    {
      title: 'Menu horizontal : gestio-topnav-layout',
      path: '/exemples/layout-menu-horizontal',
      description:
        'Menu dans la navbar, sous-menus déroulants ; replié dans un panneau sous le point de rupture collapseBelow.',
      code: `<!-- imports: [GestioTopnavLayout, GestioNavbar, GESTIO_NAVMENU_IMPORTS, RouterOutlet, RouterLink, RouterLinkActive] -->
<gestio-topnav-layout>
  <gestio-navbar gestioLayoutHeader tone="inverse" collapseBelow="lg">
    <a gestioNavbarBrand routerLink="/">Mon ERP</a>
    <nav gestioNavmenu gestioNavbarMenu aria-label="Navigation principale">
      <a gestioNavItem routerLink="/projets" routerLinkActive ariaCurrentWhenActive="page">Projets</a>
      <gestio-nav-submenu label="Rapports">
        <a gestioNavItem routerLink="/rapports/ventes" routerLinkActive ariaCurrentWhenActive="page">Ventes</a>
      </gestio-nav-submenu>
    </nav>
    <div gestioNavbarEnd>…profil…</div>
  </gestio-navbar>
  <router-outlet />
  <footer gestioLayoutFooter>…</footer>
</gestio-topnav-layout>`,
    },
  ].map((layout) => ({
    ...layout,
    src: this.sanitizer.bypassSecurityTrustResourceUrl(layout.path.slice(1)),
  }));

  protected readonly navLayoutApi: ApiRow[] = [
    {
      name: 'breakpoint',
      type: `'md' | 'lg'`,
      default: `'lg'`,
      description:
        'Largeur de fenêtre (768 ou 1024 px) à partir de laquelle le menu est fixe à gauche.',
    },
    {
      name: 'menuOpen',
      type: 'model<boolean>',
      default: 'false',
      description: 'Tiroir ouvert (petits écrans) ; [(menuOpen)].',
    },
    {
      name: 'closeOnNavigate',
      type: 'boolean',
      default: 'true',
      description: 'Ferme le tiroir quand un lien est activé.',
    },
    {
      name: 'menuLabel, skipLinkLabel',
      type: 'string',
      description: 'Nom de la barre latérale et du bouton du tiroir ; texte du lien d’évitement.',
    },
    {
      name: 'collapsed (menu latéral)',
      type: 'model<boolean>',
      default: 'false',
      description: 'Menu réduit en rail sur grand écran ; [(collapsed)].',
    },
    {
      name: 'collapsible, collapseLabel, expandLabel (menu latéral)',
      type: 'boolean, string',
      default: `true, 'Réduire le menu', 'Déplier le menu'`,
      description: 'Bouton de réduction en bas de la barre latérale.',
    },
    {
      name: 'sidebarWidth, railWidth',
      type: 'string',
      default: `'16rem', '4.5rem'`,
      description: 'Largeurs du menu déplié et du rail.',
    },
    {
      name: 'sticky (menu horizontal)',
      type: 'boolean',
      default: 'true',
      description: 'En-tête fixé en haut lors du défilement.',
    },
  ];

  protected readonly navLayoutSlots: ApiRow[] = [
    {
      name: '[gestioLayoutBrand]',
      type: 'zone',
      description: 'Haut de la barre latérale : logo et nom (layouts à menu vertical).',
    },
    {
      name: '[gestioLayoutNav]',
      type: 'zone',
      description: 'Menu : <nav gestioNavmenu gestioLayoutNav aria-label="…">.',
    },
    {
      name: '[gestioLayoutSidebarFooter]',
      type: 'zone',
      description: 'Bas de la barre latérale.',
    },
    {
      name: '[gestioLayoutHeader]',
      type: 'zone',
      description: 'En-tête : gestio-navbar (porte le menu dans le layout horizontal).',
    },
    {
      name: '[gestioLayoutFooter]',
      type: 'zone',
      description: 'Pied de page sous le contenu.',
    },
    { name: '(défaut)', type: 'zone', description: 'Contenu principal, dans <main>.' },
  ];

  protected readonly shellApi: ApiRow[] = [
    {
      name: 'sidebarOpen',
      type: 'model<boolean>',
      default: 'false',
      description: 'Tiroir ouvert (sous 1024 px) ; [(sidebarOpen)].',
    },
    {
      name: 'withSidebar',
      type: 'boolean',
      default: 'true',
      description: 'Barre latérale et bouton de menu.',
    },
    {
      name: 'sidebarWidth',
      type: 'string',
      default: `'16rem'`,
      description: 'Largeur sur grand écran.',
    },
    {
      name: 'closeOnNavigate',
      type: 'boolean',
      default: 'true',
      description: 'Ferme le tiroir au clic sur un lien.',
    },
    {
      name: 'menuLabel, skipLinkLabel',
      type: 'string',
      description: 'Libellés du bouton de menu et du lien d’évitement.',
    },
    {
      name: '[gestioShellHeader], [gestioShellSidebar]',
      type: 'zones',
      description: 'En-tête et barre latérale ; contenu par défaut = zone principale (<main>).',
    },
  ];
}
