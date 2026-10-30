import {
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  afterNextRender,
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
  ɵgestioUniqueId as gestioUniqueId,
} from '@gestiolabs336/ui/core';
import { GestioBreakpoint, GestioBreakpoints } from '@gestiolabs336/ui/layout';

/** Teinte de la barre : couleur de surface ou bleu nuit (`inverse`). */
export type GestioNavbarTone = 'surface' | 'inverse';

/**
 * Barre de navigation supérieure : marque, menu, contenu libre (recherche)
 * et actions (notifications, profil).
 *
 * ```html
 * <gestio-navbar>
 *   <a gestioNavbarBrand routerLink="/">Mon ERP</a>
 *   <nav gestioNavmenu gestioNavbarMenu aria-label="Navigation principale">…</nav>
 *   <div gestioNavbarEnd>…profil…</div>
 * </gestio-navbar>
 * ```
 *
 * - Le menu `[gestioNavbarMenu]` est horizontal ; sous `collapseBelow`, il
 *   passe dans un panneau ouvert par un bouton (Échap pour fermer).
 * - Dans `gestio-sidebar-layout` ou `gestio-rail-layout`, la navbar affiche
 *   le bouton qui ouvre le tiroir de navigation sur petit écran.
 * - Le ton `inverse` applique les tokens du thème sombre à son contenu.
 */
@Component({
  selector: 'gestio-navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  providers: [
    {
      provide: ɵGESTIO_NAV_CONTEXT,
      useFactory: (): ɵGestioNavContext => {
        const navbar = inject(GestioNavbar);
        return {
          orientation: computed(() => (navbar.compact() ? 'vertical' : 'horizontal')),
          collapsed: computed(() => false),
        };
      },
    },
  ],
  host: {
    class: 'gestio-navbar',
    '[class.gestio-navbar--sticky]': 'sticky()',
    '[class.gestio-navbar--inverse]': 'tone() === "inverse"',
    '(keydown.escape)': 'onEscape()',
  },
})
export class GestioNavbar {
  private readonly screen = inject(GestioBreakpoints);
  protected readonly layout = inject(ɵGESTIO_NAV_LAYOUT, { optional: true });

  readonly tone = input<GestioNavbarTone>('surface');
  /** Fixe la barre en haut lors du défilement (inutile dans un layout Gestio). */
  readonly sticky = input(false, { transform: booleanAttribute });
  /** Sous ce point de rupture, le menu passe dans un panneau ; `never` le garde en ligne. */
  readonly collapseBelow = input<GestioBreakpoint | 'never'>('md');
  /** Panneau du menu ouvert (petits écrans) ; `[(menuOpen)]`. */
  readonly menuOpen = model(false);
  /** Nom accessible du bouton du menu. */
  readonly menuLabel = input('Menu');

  protected readonly menuId = gestioUniqueId('gestio-navbar-menu');
  protected readonly theme = computed(() => (this.tone() === 'inverse' ? 'dark' : null));
  /** Zone [gestioNavbarMenu] non vide (détectée après le premier rendu). */
  private readonly hasMenu = signal(false);
  private readonly menuSlot = viewChild.required<ElementRef<HTMLElement>>('menuSlot');

  /** Vrai sous `collapseBelow` : le menu est replié dans un panneau. */
  readonly compact = computed(() => {
    const breakpoint = this.collapseBelow();
    return breakpoint !== 'never' && this.hasMenu() && !this.screen[breakpoint]();
  });

  private readonly menuToggle = viewChild<ElementRef<HTMLButtonElement>>('menuToggle');

  constructor() {
    // Le bouton du tiroir du layout est rendu par la navbar.
    if (this.layout) {
      this.layout.externalToggle.set(true);
      inject(DestroyRef).onDestroy(() => this.layout?.externalToggle.set(false));
    }
    afterNextRender(() => this.hasMenu.set(this.menuSlot().nativeElement.childElementCount > 0));
    effect(() => {
      if (!this.compact() && this.menuOpen()) this.menuOpen.set(false);
    });
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected onEscape(): void {
    if (!this.compact() || !this.menuOpen()) return;
    this.menuOpen.set(false);
    this.menuToggle()?.nativeElement.focus();
  }

  /** Un lien activé dans le panneau le ferme. */
  protected onMenuClick(event: Event): void {
    if (!this.compact()) return;
    const target = event.target as Element;
    if (target.closest('a[href]') && !target.closest('.gestio-nav-submenu__trigger')) {
      this.menuOpen.set(false);
    }
  }
}
