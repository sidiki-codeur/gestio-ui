import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  GestioRailLayout,
  GestioSidebarLayout,
  GestioTopnavLayout,
} from '@gestiolabs336/ui/layout';
import { GestioNavbar } from '@gestiolabs336/ui/navigation';
import { DemoContent, DemoNav, DemoUser } from './demo-parts';

/** Styles de la marque, partagés par les trois exemples. */
const BRAND_STYLES = `
  .demo-brand {
    display: inline-flex;
    gap: var(--gestio-space-3);
    align-items: center;
    min-width: 0;
    border-radius: var(--gestio-radius-md);
    color: inherit;
    font-size: var(--gestio-font-size-lg);
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
    flex: none;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: var(--gestio-radius-md);
    background: var(--gestio-color-primary);
    color: var(--gestio-color-on-primary);
  }

  .demo-search {
    box-sizing: border-box;
    width: min(100%, 28rem);
    height: 2.5rem;
    padding: 0 var(--gestio-space-3);
    border: var(--gestio-border-width) solid var(--gestio-color-border-strong);
    border-radius: var(--gestio-radius-md);
    background: var(--gestio-color-surface);
    color: var(--gestio-color-text);
    font: inherit;

    &::placeholder {
      color: var(--gestio-color-text-muted);
    }

    &:focus-visible {
      outline: 2px solid var(--gestio-color-focus-ring);
      outline-offset: 1px;
    }
  }

  @media (max-width: 47.98rem) {
    .demo-search {
      display: none;
    }
  }
`;

/** Texte réservé aux lecteurs d'écran (nom de la marque en mode rail). */
const SR_ONLY = `
  .demo-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

/** Exemple plein écran : layout à menu latéral (repliable en rail). */
@Component({
  selector: 'app-sidebar-layout-example',
  imports: [RouterLink, GestioSidebarLayout, GestioNavbar, DemoNav, DemoUser, DemoContent],
  template: `
    <gestio-sidebar-layout #layout>
      <a gestioLayoutBrand class="demo-brand" routerLink="/mises-en-page">
        <span class="demo-brand__mark" aria-hidden="true">G</span>
        @if (!layout.railMode()) {
          <span>Gestio ERP</span>
        } @else {
          <span class="demo-sr-only">Gestio ERP</span>
        }
      </a>
      <app-demo-nav gestioLayoutNav [(current)]="page" />
      <gestio-navbar gestioLayoutHeader>
        <input
          class="demo-search"
          type="search"
          aria-label="Rechercher"
          placeholder="Rechercher…"
        />
        <app-demo-user gestioNavbarEnd />
      </gestio-navbar>
      <app-demo-content
        [heading]="page()"
        description="Layout à menu latéral : réduisez le menu en rail avec le bouton du bas, ou passez sous 1024 px pour le tiroir."
      />
    </gestio-sidebar-layout>
  `,
  styles: [BRAND_STYLES, SR_ONLY],
})
export class SidebarLayoutExample {
  protected readonly page = signal('Tableau de bord');
}

/** Exemple plein écran : layout à rail vertical d'icônes. */
@Component({
  selector: 'app-rail-layout-example',
  imports: [RouterLink, GestioRailLayout, GestioNavbar, DemoNav, DemoUser, DemoContent],
  template: `
    <gestio-rail-layout #layout>
      <a gestioLayoutBrand class="demo-brand" routerLink="/mises-en-page">
        <span class="demo-brand__mark" aria-hidden="true">G</span>
        @if (!layout.railMode()) {
          <span>Gestio ERP</span>
        } @else {
          <span class="demo-sr-only">Gestio ERP</span>
        }
      </a>
      <app-demo-nav gestioLayoutNav [(current)]="page" />
      <gestio-navbar gestioLayoutHeader>
        <input
          class="demo-search"
          type="search"
          aria-label="Rechercher"
          placeholder="Rechercher…"
        />
        <app-demo-user gestioNavbarEnd />
      </gestio-navbar>
      <app-demo-content
        [heading]="page()"
        description="Layout à menu vertical : rail d’icônes, libellés en bulle au survol et au focus, sous-menus en panneau latéral."
      />
    </gestio-rail-layout>
  `,
  styles: [BRAND_STYLES, SR_ONLY],
})
export class RailLayoutExample {
  protected readonly page = signal('Tableau de bord');
}

/** Exemple plein écran : layout à menu horizontal dans une navbar sombre. */
@Component({
  selector: 'app-topnav-layout-example',
  imports: [RouterLink, GestioTopnavLayout, GestioNavbar, DemoNav, DemoUser, DemoContent],
  template: `
    <gestio-topnav-layout>
      <gestio-navbar gestioLayoutHeader tone="inverse" collapseBelow="lg">
        <a gestioNavbarBrand class="demo-brand" routerLink="/mises-en-page">
          <span class="demo-brand__mark" aria-hidden="true">G</span>
          <span>Gestio ERP</span>
        </a>
        <app-demo-nav gestioNavbarMenu [grouped]="false" [(current)]="page" />
        <app-demo-user gestioNavbarEnd />
      </gestio-navbar>
      <app-demo-content
        [heading]="page()"
        description="Layout à menu horizontal : sous-menus déroulants ; sous 1024 px, le menu passe dans un panneau ouvert par le bouton Menu."
      />
    </gestio-topnav-layout>
  `,
  styles: BRAND_STYLES,
})
export class TopnavLayoutExample {
  protected readonly page = signal('Tableau de bord');
}
