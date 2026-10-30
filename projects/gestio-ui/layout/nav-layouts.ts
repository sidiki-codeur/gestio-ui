import { DOCUMENT } from '@angular/common';
import {
  Component,
  Directive,
  ElementRef,
  Injector,
  Signal,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import {
  ɵGESTIO_NAV_CONTEXT,
  ɵGESTIO_NAV_LAYOUT,
  ɵGestioNavContext,
  ɵGestioNavLayoutContext,
  ɵgestioUniqueId as gestioUniqueId,
} from '@gestiolabs336/ui/core';
import { GestioBreakpoints } from './responsive';

/** Largeur de fenêtre à partir de laquelle le menu est affiché à côté du contenu. */
export type GestioNavLayoutBreakpoint = 'md' | 'lg';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Logique commune des layouts à menu vertical : tiroir sous le point de
 * rupture (focus déplacé, Échap, fond, contenu inerte, retour du focus),
 * lien d'évitement, contexte transmis au menu et à la navbar.
 */
@Directive({
  host: {
    '[class.gestio-nav-layout--drawer-open]': 'drawerOpen()',
    '[class.gestio-nav-layout--collapsed]': 'railMode()',
    '[class]': '"gestio-nav-layout--bp-" + breakpoint()',
    '(document:keydown.escape)': 'onEscape()',
  },
})
abstract class GestioNavLayoutBase {
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly screen = inject(GestioBreakpoints);

  /** Tiroir ouvert (petits écrans) ; `[(menuOpen)]`. */
  readonly menuOpen = model(false);
  /** Largeur de fenêtre à partir de laquelle le menu est fixe à gauche (md 768 px, lg 1024 px). */
  readonly breakpoint = input<GestioNavLayoutBreakpoint>('lg');
  /** Ferme le tiroir quand un lien du menu est activé. */
  readonly closeOnNavigate = input(true, { transform: booleanAttribute });
  /** Nom accessible du bouton qui ouvre le tiroir. */
  readonly menuLabel = input('Menu de navigation');
  readonly skipLinkLabel = input('Aller au contenu');

  protected readonly sideId = gestioUniqueId('gestio-nav-layout-side');
  protected readonly mainId = gestioUniqueId('gestio-nav-layout-main');

  /** Vrai à partir du point de rupture (toujours faux en SSR). */
  readonly isDesktop = computed(() => this.screen[this.breakpoint()]());
  protected readonly drawerOpen = computed(() => this.menuOpen() && !this.isDesktop());
  /** Menu réduit à un rail d'icônes (grand écran). */
  abstract readonly railMode: Signal<boolean>;

  /** Une navbar de l'en-tête affiche le bouton du tiroir à la place du layout. */
  readonly externalToggle = signal(false);

  private readonly side = viewChild.required<ElementRef<HTMLElement>>('side');
  private returnFocus: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.isDesktop() && this.menuOpen()) this.menuOpen.set(false);
    });
  }

  /** Contexte transmis à la navbar (bouton du tiroir). */
  protected layoutContext(): ɵGestioNavLayoutContext {
    return {
      drawerMode: computed(() => !this.isDesktop()),
      drawerOpen: this.drawerOpen,
      drawerId: this.sideId,
      menuLabel: this.menuLabel,
      toggleDrawer: () => this.toggleMenu(),
      externalToggle: this.externalToggle,
    };
  }

  /** Contexte transmis au menu : vertical, réduit en mode rail. */
  protected navContext(): ɵGestioNavContext {
    return { orientation: computed(() => 'vertical'), collapsed: this.railMode };
  }

  toggleMenu(): void {
    if (this.menuOpen()) this.closeMenu(true);
    else this.openMenu();
  }

  openMenu(): void {
    const active = this.document.activeElement;
    this.returnFocus = active instanceof HTMLElement ? active : null;
    this.menuOpen.set(true);
    afterNextRender(
      () => {
        const panel = this.side().nativeElement;
        const current = panel.querySelector<HTMLElement>('[aria-current="page"]');
        (current ?? panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();
      },
      { injector: this.injector },
    );
  }

  /** Ferme le tiroir ; `restoreFocus` rend le focus au bouton qui l'a ouvert. */
  closeMenu(restoreFocus = false): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    if (restoreFocus) this.returnFocus?.focus();
    this.returnFocus = null;
  }

  /**
   * Lien d'évitement : focus direct sur le contenu. Un simple « #id » serait
   * résolu par rapport à <base href> et quitterait la page courante.
   */
  protected skipToMain(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
  }

  protected onEscape(): void {
    if (this.drawerOpen()) this.closeMenu(true);
  }

  protected onSideClick(event: Event): void {
    const target = event.target as Element | null;
    const link = target?.closest?.('a[href]');
    if (link && this.closeOnNavigate() && this.drawerOpen()) this.closeMenu();
  }
}

/**
 * Layout à menu latéral : barre de navigation à gauche (marque, menu, pied),
 * en-tête et contenu à droite. Sur grand écran, le menu peut être réduit à
 * un rail d'icônes ; sous le point de rupture, il devient un tiroir.
 *
 * ```html
 * <gestio-sidebar-layout [(collapsed)]="menuReduit">
 *   <a gestioLayoutBrand routerLink="/">Mon ERP</a>
 *   <nav gestioNavmenu gestioLayoutNav aria-label="Navigation principale">…</nav>
 *   <gestio-navbar gestioLayoutHeader>…</gestio-navbar>
 *   <router-outlet />
 * </gestio-sidebar-layout>
 * ```
 */
@Component({
  selector: 'gestio-sidebar-layout',
  templateUrl: './nav-layout.html',
  styleUrl: './nav-layout.scss',
  providers: [
    {
      provide: ɵGESTIO_NAV_LAYOUT,
      useFactory: () => inject(GestioSidebarLayout).layoutContextRef,
    },
    { provide: ɵGESTIO_NAV_CONTEXT, useFactory: () => inject(GestioSidebarLayout).navContextRef },
  ],
  host: {
    class: 'gestio-nav-layout gestio-sidebar-layout',
    '[style.--_side-width]': 'sidebarWidth()',
    '[style.--_rail-width]': 'railWidth()',
  },
})
export class GestioSidebarLayout extends GestioNavLayoutBase {
  /** Menu réduit à un rail d'icônes sur grand écran ; `[(collapsed)]`. */
  readonly collapsed = model(false);
  /** Affiche le bouton « Réduire le menu » en bas de la barre latérale. */
  readonly collapsible = input(true, { transform: booleanAttribute });
  /** Largeur du menu déplié. */
  readonly sidebarWidth = input('16rem');
  /** Largeur du menu réduit. */
  readonly railWidth = input('4.5rem');
  readonly collapseLabel = input('Réduire le menu');
  readonly expandLabel = input('Déplier le menu');

  readonly railMode = computed(() => this.isDesktop() && this.collapsed());
  protected readonly showCollapseToggle = computed(() => this.collapsible() && this.isDesktop());

  readonly layoutContextRef = this.layoutContext();
  readonly navContextRef = this.navContext();

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }
}

/**
 * Layout à menu vertical : rail étroit d'icônes à gauche (libellés en bulle
 * au survol et au focus), en-tête et contenu à droite. Sous le point de
 * rupture, le menu devient un tiroir avec les libellés.
 *
 * ```html
 * <gestio-rail-layout>
 *   <a gestioLayoutBrand routerLink="/" aria-label="Accueil"><img src="logo.svg" alt="" /></a>
 *   <nav gestioNavmenu gestioLayoutNav aria-label="Navigation principale">…</nav>
 *   <gestio-navbar gestioLayoutHeader>…</gestio-navbar>
 *   <router-outlet />
 * </gestio-rail-layout>
 * ```
 */
@Component({
  selector: 'gestio-rail-layout',
  templateUrl: './nav-layout.html',
  styleUrl: './nav-layout.scss',
  providers: [
    { provide: ɵGESTIO_NAV_LAYOUT, useFactory: () => inject(GestioRailLayout).layoutContextRef },
    { provide: ɵGESTIO_NAV_CONTEXT, useFactory: () => inject(GestioRailLayout).navContextRef },
  ],
  host: {
    class: 'gestio-nav-layout gestio-rail-layout',
    '[style.--_side-width]': 'railWidth()',
    '[style.--_rail-width]': 'railWidth()',
  },
})
export class GestioRailLayout extends GestioNavLayoutBase {
  /** Largeur du rail. */
  readonly railWidth = input('4.5rem');

  readonly railMode = computed(() => this.isDesktop());
  protected readonly showCollapseToggle = computed(() => false);
  protected readonly collapsed = computed(() => true);
  protected readonly collapseLabel = computed(() => '');
  protected readonly expandLabel = computed(() => '');

  readonly layoutContextRef = this.layoutContext();
  readonly navContextRef = this.navContext();

  protected toggleCollapsed(): void {
    // Le rail n'est pas repliable.
  }
}

/**
 * Layout à menu horizontal : en-tête (navbar avec son menu) en haut, contenu
 * dessous, pied de page facultatif. Sur petit écran, la navbar replie son
 * menu dans un panneau.
 *
 * ```html
 * <gestio-topnav-layout>
 *   <gestio-navbar gestioLayoutHeader>
 *     <a gestioNavbarBrand routerLink="/">Mon ERP</a>
 *     <nav gestioNavmenu gestioNavbarMenu aria-label="Navigation principale">…</nav>
 *   </gestio-navbar>
 *   <router-outlet />
 * </gestio-topnav-layout>
 * ```
 */
@Component({
  selector: 'gestio-topnav-layout',
  template: `
    <a class="gestio-nav-layout__skip" [href]="'#' + mainId" (click)="skipToMain($event, main)">{{
      skipLinkLabel()
    }}</a>
    <header class="gestio-topnav-layout__header" [class.is-sticky]="sticky()">
      <ng-content select="[gestioLayoutHeader]" />
    </header>
    <main #main class="gestio-nav-layout__main" tabindex="-1" [id]="mainId">
      <ng-content />
    </main>
    <ng-content select="[gestioLayoutFooter]" />
  `,
  styleUrl: './nav-layout.scss',
  host: { class: 'gestio-topnav-layout' },
})
export class GestioTopnavLayout {
  /** En-tête fixé en haut lors du défilement. */
  readonly sticky = input(true, { transform: booleanAttribute });
  readonly skipLinkLabel = input('Aller au contenu');

  protected readonly mainId = gestioUniqueId('gestio-topnav-layout-main');

  /**
   * Lien d'évitement : focus direct sur le contenu. Un simple « #id » serait
   * résolu par rapport à <base href> et quitterait la page courante.
   */
  protected skipToMain(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
  }
}
