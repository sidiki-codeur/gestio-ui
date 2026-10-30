import { Component, input, model } from '@angular/core';
import { GestioAvatar } from '@gestiolabs336/ui/avatar';
import { GestioBadge } from '@gestiolabs336/ui/badge';
import { GestioCard } from '@gestiolabs336/ui/card';
import { GestioContainer, GestioGrid } from '@gestiolabs336/ui/layout';
import { GESTIO_MENU_IMPORTS } from '@gestiolabs336/ui/menu';
import { GESTIO_NAVMENU_IMPORTS, GestioNavmenuOrientation } from '@gestiolabs336/ui/navigation';
import { GestioTooltip } from '@gestiolabs336/ui/tooltip';

/** Tracés des icônes des démonstrations (grille 20 × 20, trait). */
export const DEMO_ICONS = {
  home: 'M3 9.5 10 3l7 6.5M5 8v9h10V8',
  grid: 'M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z',
  tasks: 'M3 5l1.5 1.5L7 4M9 5.5h8M3 12l1.5 1.5L7 11M9 12.5h8',
  chart: 'M4 16V9M10 16V4M16 16v-5',
  team: 'M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM1.5 17a5.5 5.5 0 0 1 11 0M14 9a2.5 2.5 0 1 0-1-4.8M14.5 12.2A4.5 4.5 0 0 1 18.5 17',
  calendar: 'M4 5h12v12H4zM4 9h12M8 3v4M12 3v4',
  settings:
    'M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18M4.3 4.3l1.8 1.8M13.9 13.9l1.8 1.8M4.3 15.7l1.8-1.8M13.9 6.1l1.8-1.8',
  bell: 'M5 8a5 5 0 0 1 10 0v4l1.5 2.5h-13L5 12zM8 17a2 2 0 0 0 4 0',
} as const;

type DemoIcon = keyof typeof DEMO_ICONS;

/** Menu de navigation des démonstrations ; la page courante est simulée. */
@Component({
  selector: 'app-demo-nav',
  imports: [GESTIO_NAVMENU_IMPORTS, GestioBadge],
  template: `
    <nav gestioNavmenu [orientation]="orientation()" aria-label="Navigation principale">
      @if (grouped()) {
        <gestio-nav-group label="Général">
          @for (item of main; track item.label) {
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="current() === item.label ? 'page' : null"
              (click)="go($event, item.label)"
            >
              <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
                <path [attr.d]="icons[item.icon]" />
              </svg>
              {{ item.label }}
              @if (item.badge) {
                <gestio-badge gestioNavBadge size="sm" variant="primary">{{
                  item.badge
                }}</gestio-badge>
              }
            </a>
          }
          <gestio-nav-submenu label="Rapports">
            <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
              <path [attr.d]="icons.chart" />
            </svg>
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="current() === 'Ventes' ? 'page' : null"
              (click)="go($event, 'Ventes')"
            >
              Ventes
            </a>
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="current() === 'Dépenses' ? 'page' : null"
              (click)="go($event, 'Dépenses')"
            >
              Dépenses
            </a>
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="current() === 'Bilan annuel' ? 'page' : null"
              (click)="go($event, 'Bilan annuel')"
            >
              Bilan annuel
            </a>
          </gestio-nav-submenu>
        </gestio-nav-group>
        <gestio-nav-group label="Organisation">
          <gestio-nav-submenu label="Équipe">
            <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
              <path [attr.d]="icons.team" />
            </svg>
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="current() === 'Membres' ? 'page' : null"
              (click)="go($event, 'Membres')"
            >
              Membres
            </a>
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="current() === 'Planning des congés' ? 'page' : null"
              (click)="go($event, 'Planning des congés')"
            >
              Planning des congés
            </a>
          </gestio-nav-submenu>
          <gestio-nav-submenu label="Paramètres">
            <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
              <path [attr.d]="icons.settings" />
            </svg>
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="current() === 'Profil' ? 'page' : null"
              (click)="go($event, 'Profil')"
            >
              Profil
            </a>
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="current() === 'Facturation' ? 'page' : null"
              (click)="go($event, 'Facturation')"
            >
              Facturation
            </a>
            <a
              gestioNavItem
              href="#"
              [attr.aria-current]="current() === 'Sécurité' ? 'page' : null"
              (click)="go($event, 'Sécurité')"
            >
              Sécurité
            </a>
          </gestio-nav-submenu>
        </gestio-nav-group>
      } @else {
        @for (item of main; track item.label) {
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="current() === item.label ? 'page' : null"
            (click)="go($event, item.label)"
          >
            <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
              <path [attr.d]="icons[item.icon]" />
            </svg>
            {{ item.label }}
            @if (item.badge) {
              <gestio-badge gestioNavBadge size="sm" variant="primary">{{
                item.badge
              }}</gestio-badge>
            }
          </a>
        }
        <gestio-nav-submenu label="Rapports">
          <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
            <path [attr.d]="icons.chart" />
          </svg>
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="current() === 'Ventes' ? 'page' : null"
            (click)="go($event, 'Ventes')"
          >
            Ventes
          </a>
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="current() === 'Dépenses' ? 'page' : null"
            (click)="go($event, 'Dépenses')"
          >
            Dépenses
          </a>
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="current() === 'Bilan annuel' ? 'page' : null"
            (click)="go($event, 'Bilan annuel')"
          >
            Bilan annuel
          </a>
        </gestio-nav-submenu>
        <gestio-nav-submenu label="Équipe">
          <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
            <path [attr.d]="icons.team" />
          </svg>
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="current() === 'Membres' ? 'page' : null"
            (click)="go($event, 'Membres')"
          >
            Membres
          </a>
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="current() === 'Planning des congés' ? 'page' : null"
            (click)="go($event, 'Planning des congés')"
          >
            Planning des congés
          </a>
        </gestio-nav-submenu>
        <gestio-nav-submenu label="Paramètres">
          <svg gestioNavIcon class="demo-icon" viewBox="0 0 20 20" aria-hidden="true">
            <path [attr.d]="icons.settings" />
          </svg>
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="current() === 'Profil' ? 'page' : null"
            (click)="go($event, 'Profil')"
          >
            Profil
          </a>
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="current() === 'Facturation' ? 'page' : null"
            (click)="go($event, 'Facturation')"
          >
            Facturation
          </a>
          <a
            gestioNavItem
            href="#"
            [attr.aria-current]="current() === 'Sécurité' ? 'page' : null"
            (click)="go($event, 'Sécurité')"
          >
            Sécurité
          </a>
        </gestio-nav-submenu>
      }
    </nav>
  `,
  styles: `
    .demo-icon {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class DemoNav {
  /** Orientation imposée ; par défaut celle du layout ou de la navbar. */
  readonly orientation = input<GestioNavmenuOrientation>();
  /** Groupes titrés (menu vertical) ou liste simple. */
  readonly grouped = input(true);
  /** Page courante simulée. */
  readonly current = model('Tableau de bord');

  protected readonly icons = DEMO_ICONS;
  protected readonly main: readonly { label: string; icon: DemoIcon; badge?: number }[] = [
    { label: 'Tableau de bord', icon: 'home' },
    { label: 'Projets', icon: 'grid', badge: 12 },
    { label: 'Tâches', icon: 'tasks' },
  ];

  protected go(event: Event, label: string): void {
    event.preventDefault();
    this.current.set(label);
  }
}

/** Actions de la navbar des démonstrations : notifications et profil. */
@Component({
  selector: 'app-demo-user',
  imports: [GestioAvatar, GestioBadge, GestioTooltip, GESTIO_MENU_IMPORTS],
  template: `
    <button
      type="button"
      class="demo-tool"
      aria-label="Notifications, 3 non lues"
      gestioTooltip="Notifications"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true"><path [attr.d]="bell" /></svg>
      <gestio-badge
        class="demo-tool__count"
        variant="danger"
        appearance="solid"
        size="sm"
        aria-hidden="true"
        >3</gestio-badge
      >
    </button>
    <button
      type="button"
      class="demo-tool demo-user"
      [gestioMenuTriggerFor]="account"
      menuPlacement="bottom-end"
    >
      <gestio-avatar name="Awa Traoré" size="sm" />
      <span class="demo-user__name">Awa Traoré</span>
    </button>
    <ng-template #account>
      <gestio-menu ariaLabel="Compte">
        <button gestioMenuItem>Mon profil</button>
        <button gestioMenuItem>Se déconnecter</button>
      </gestio-menu>
    </ng-template>
  `,
  styles: `
    :host {
      display: flex;
      gap: var(--gestio-space-2);
      align-items: center;
    }

    .demo-tool {
      position: relative;
      display: inline-flex;
      gap: var(--gestio-space-2);
      align-items: center;
      min-width: 2.5rem;
      height: 2.5rem;
      justify-content: center;
      padding: 0 var(--gestio-space-1);
      border: 0;
      border-radius: var(--gestio-radius-md);
      background: transparent;
      color: inherit;
      font: inherit;
      font-weight: var(--gestio-font-weight-medium);
      cursor: pointer;

      &:hover {
        background: var(--gestio-color-surface-hover);
      }

      &:focus-visible {
        outline: 2px solid var(--gestio-color-focus-ring);
        outline-offset: 2px;
      }

      > svg {
        width: 1.25rem;
        height: 1.25rem;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.6;
        stroke-linejoin: round;
      }
    }

    .demo-tool__count {
      position: absolute;
      top: -0.125rem;
      right: -0.125rem;
    }

    @media (max-width: 47.98rem) {
      .demo-user__name {
        display: none;
      }
    }
  `,
})
export class DemoUser {
  protected readonly bell = DEMO_ICONS.bell;
}

/** Contenu des démonstrations : titre de la page courante et quelques cartes. */
@Component({
  selector: 'app-demo-content',
  imports: [GestioContainer, GestioGrid, GestioCard],
  template: `
    <gestio-container class="demo-content">
      <h1 tabindex="-1">{{ heading() }}</h1>
      <p class="demo-muted">{{ description() }}</p>
      <gestio-grid [columns]="{ base: 1, sm: 2, lg: 4 }" [gap]="4">
        @for (stat of stats; track stat.label) {
          <gestio-card>
            <p class="demo-muted">{{ stat.label }}</p>
            <p class="demo-value">{{ stat.value }}</p>
          </gestio-card>
        }
      </gestio-grid>
      <gestio-card>
        <h2 gestioCardHeader class="demo-card-title">Activité récente</h2>
        <ul class="demo-list">
          <li>Facture F-2026-118 envoyée à Atelier Moreau</li>
          <li>Projet « Refonte du site » passé à 80 %</li>
          <li>Nouvelle tâche assignée à Karim Benali</li>
        </ul>
      </gestio-card>
    </gestio-container>
  `,
  styles: `
    .demo-content {
      display: flex;
      flex-direction: column;
      gap: var(--gestio-space-5);
      padding-block: var(--gestio-space-6) var(--gestio-space-10);
    }

    h1 {
      margin: 0;
      font-size: var(--gestio-font-size-2xl);

      &:focus {
        outline: none;
      }
    }

    p {
      margin: 0;
    }

    .demo-muted {
      color: var(--gestio-color-text-muted);
    }

    .demo-value {
      margin-top: var(--gestio-space-1);
      font-size: 1.5rem;
      font-weight: var(--gestio-font-weight-semibold);
    }

    .demo-card-title {
      margin: 0;
      font-size: var(--gestio-font-size-lg);
    }

    .demo-list {
      margin: 0;
      padding-inline-start: var(--gestio-space-5);
      line-height: 1.8;
    }
  `,
})
export class DemoContent {
  readonly heading = input.required<string>();
  readonly description = input('');

  protected readonly stats = [
    { label: 'Projets actifs', value: '12' },
    { label: 'Tâches en retard', value: '4' },
    { label: 'Chiffre d’affaires', value: '48 250 €' },
    { label: 'Clients', value: '326' },
  ];
}
