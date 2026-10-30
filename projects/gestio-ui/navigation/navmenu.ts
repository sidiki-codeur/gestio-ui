import {
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  Injector,
  Signal,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ɵGESTIO_NAV_CONTEXT, ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

export type GestioNavmenuOrientation = 'horizontal' | 'vertical';

/** État du menu partagé avec ses éléments. Usage interne. */
interface NavmenuState {
  readonly orientation: Signal<GestioNavmenuOrientation>;
  readonly collapsed: Signal<boolean>;
}

const GESTIO_NAVMENU = new InjectionToken<NavmenuState>('GESTIO_NAVMENU');
const GESTIO_NAV_SUBMENU = new InjectionToken<GestioNavSubmenu>('GESTIO_NAV_SUBMENU');

/** Position fixe d'une bulle ou d'un panneau flottant. */
interface FloatingPosition {
  readonly top: number;
  readonly left: number;
}

/**
 * Menu de navigation : liens (`gestioNavItem`), groupes titrés
 * (`gestio-nav-group`) et sous-menus dépliables (`gestio-nav-submenu`).
 *
 * ```html
 * <nav gestioNavmenu aria-label="Navigation principale">
 *   <a gestioNavItem routerLink="/tableau-de-bord" routerLinkActive ariaCurrentWhenActive="page">
 *     <svg gestioNavIcon viewBox="0 0 20 20" aria-hidden="true">…</svg>
 *     Tableau de bord
 *   </a>
 *   <gestio-nav-group label="Gestion">
 *     <a gestioNavItem routerLink="/projets" …>Projets</a>
 *     <gestio-nav-submenu label="Paramètres">
 *       <a gestioNavItem routerLink="/parametres/equipe" …>Équipe</a>
 *     </gestio-nav-submenu>
 *   </gestio-nav-group>
 * </nav>
 * ```
 *
 * - `vertical` : sous-menus en accordéon, ouverts d'office s'ils contiennent
 *   la page courante.
 * - `horizontal` : sous-menus déroulants (Échap, clic extérieur ou sortie du
 *   focus pour fermer).
 * - `collapsed` (rail) : icônes seules, libellé en bulle au survol et au
 *   focus, sous-menus en panneau latéral.
 *
 * Dans un layout ou une navbar Gestio, l'orientation et le mode réduit sont
 * fournis par le conteneur ; les entrées les remplacent.
 */
@Component({
  selector: 'nav[gestioNavmenu]',
  template: '<ng-content />',
  styleUrl: './navmenu.scss',
  // Styles non encapsulés (sélecteurs préfixés) : liens, icônes et sous-menus sont projetés.
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: GESTIO_NAVMENU,
      useFactory: (): NavmenuState => {
        const menu = inject(GestioNavmenu);
        return { orientation: menu.resolvedOrientation, collapsed: menu.resolvedCollapsed };
      },
    },
  ],
  host: {
    class: 'gestio-navmenu',
    '[class.gestio-navmenu--horizontal]': 'resolvedOrientation() === "horizontal"',
    '[class.gestio-navmenu--vertical]': 'resolvedOrientation() === "vertical"',
    '[class.gestio-navmenu--collapsed]': 'resolvedCollapsed()',
  },
})
export class GestioNavmenu {
  private readonly context = inject(ɵGESTIO_NAV_CONTEXT, { optional: true });

  /** Orientation ; par défaut celle du conteneur, sinon `vertical`. */
  readonly orientation = input<GestioNavmenuOrientation>();
  /** Rail d'icônes ; par défaut l'état du conteneur, sinon `false`. */
  readonly collapsed = input<boolean | undefined, unknown>(undefined, {
    transform: (value: unknown) => (value == null ? undefined : booleanAttribute(value)),
  });

  readonly resolvedOrientation = computed<GestioNavmenuOrientation>(
    () => this.orientation() ?? this.context?.orientation() ?? 'vertical',
  );
  readonly resolvedCollapsed = computed(
    () =>
      this.resolvedOrientation() === 'vertical' &&
      (this.collapsed() ?? this.context?.collapsed() ?? false),
  );
}

/**
 * Lien de navigation. La page courante est mise en avant d'après
 * `aria-current="page"` (posé par `routerLinkActive` avec
 * `ariaCurrentWhenActive="page"`) ou la classe `is-active`.
 *
 * Zones : `[gestioNavIcon]` (icône, avant le libellé), contenu (libellé),
 * `[gestioNavBadge]` (compteur, après le libellé).
 */
@Component({
  selector: 'a[gestioNavItem], button[gestioNavItem]',
  template: `
    <span class="gestio-nav-item__icon"><ng-content select="[gestioNavIcon]" /></span>
    <span
      class="gestio-nav-item__label"
      [class.is-tip]="tip()"
      [style.top.px]="tip()?.top"
      [style.left.px]="tip()?.left"
      ><ng-content
    /></span>
    <span class="gestio-nav-item__badge"><ng-content select="[gestioNavBadge]" /></span>
  `,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'gestio-nav-item',
    '[class.gestio-nav-item--icon-only]': 'iconOnly()',
    '[attr.type]': 'isButton ? "button" : null',
    '(mouseenter)': 'showTip()',
    '(mouseleave)': 'hideTip()',
    '(focus)': 'showTip()',
    '(blur)': 'hideTip()',
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class GestioNavItem {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly menu = inject(GESTIO_NAVMENU, { optional: true });
  private readonly submenu = inject(GESTIO_NAV_SUBMENU, { optional: true });

  protected readonly isButton = this.host.tagName === 'BUTTON';
  /** Icône seule (rail), sauf dans un sous-menu qui affiche les libellés. */
  protected readonly iconOnly = computed(() => !this.submenu && !!this.menu?.collapsed());
  /** Bulle du libellé en mode rail (position fixe : elle sort du rail défilant). */
  protected readonly tip = signal<FloatingPosition | null>(null);

  protected showTip(): void {
    if (!this.iconOnly()) return;
    const rect = this.host.getBoundingClientRect();
    this.tip.set({ top: rect.top + rect.height / 2, left: rect.right + 8 });
  }

  protected hideTip(): void {
    this.tip.set(null);
  }

  /** Échap masque la bulle sans déplacer le focus (WCAG 1.4.13). */
  protected onEscape(event: Event): void {
    if (!this.tip()) return;
    event.stopPropagation();
    this.hideTip();
  }
}

/**
 * Groupe de liens avec un titre (`role="group"`). En mode rail, le titre
 * est remplacé par un séparateur.
 */
@Component({
  selector: 'gestio-nav-group',
  template: `
    <span class="gestio-nav-group__title" [id]="titleId">{{ label() }}</span>
    <ng-content />
  `,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'gestio-nav-group',
    role: 'group',
    '[attr.aria-labelledby]': 'titleId',
  },
})
export class GestioNavGroup {
  /** Titre du groupe (obligatoire). */
  readonly label = input.required<string>();

  protected readonly titleId = gestioUniqueId('gestio-nav-group');
}

/**
 * Sous-menu : bouton qui déplie une liste de liens (`aria-expanded`).
 * Accordéon dans un menu vertical, liste déroulante dans un menu
 * horizontal, panneau latéral en mode rail.
 */
@Component({
  selector: 'gestio-nav-submenu',
  template: `
    <button
      #trigger
      type="button"
      class="gestio-nav-item gestio-nav-submenu__trigger"
      [class.gestio-nav-item--icon-only]="menu?.collapsed()"
      [class.has-active]="hasActive()"
      [attr.aria-expanded]="expanded()"
      [attr.aria-controls]="panelId"
      (click)="toggle()"
    >
      <span class="gestio-nav-item__icon"><ng-content select="[gestioNavIcon]" /></span>
      <span class="gestio-nav-item__label">{{ label() }}</span>
      <svg
        class="gestio-nav-submenu__chevron"
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </button>
    <div
      #panel
      class="gestio-nav-submenu__panel"
      [class]="'gestio-nav-submenu__panel--' + mode()"
      [class.is-end]="alignEnd()"
      [id]="panelId"
      [hidden]="!expanded()"
      [style.top.px]="flyout()?.top"
      [style.left.px]="flyout()?.left"
      (click)="onPanelClick($event)"
    >
      @if (mode() === 'flyout') {
        <span class="gestio-nav-submenu__title" aria-hidden="true">{{ label() }}</span>
      }
      <ng-content />
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: GESTIO_NAV_SUBMENU, useExisting: forwardRef(() => GestioNavSubmenu) }],
  host: {
    class: 'gestio-nav-submenu',
    '[class.is-expanded]': 'expanded()',
    '(document:click)': 'onDocumentClick($event)',
    '(focusout)': 'onFocusOut($event)',
    '(keydown.escape)': 'onEscape($event)',
    '(window:resize)': 'closeFloating()',
  },
})
export class GestioNavSubmenu {
  protected readonly menu = inject(GESTIO_NAVMENU, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  /** Libellé du bouton (obligatoire). */
  readonly label = input.required<string>();
  /** Sous-menu déplié ; `[(expanded)]`. */
  readonly expanded = model(false);

  protected readonly panelId = gestioUniqueId('gestio-nav-submenu');
  protected readonly hasActive = signal(false);
  protected readonly flyout = signal<FloatingPosition | null>(null);
  /** Liste déroulante alignée à droite du bouton quand elle déborderait de l'écran. */
  protected readonly alignEnd = signal(false);

  /** `inline` (accordéon), `dropdown` (menu horizontal) ou `flyout` (rail). */
  protected readonly mode = computed(() => {
    if (this.menu?.collapsed()) return 'flyout';
    return this.menu?.orientation() === 'horizontal' ? 'dropdown' : 'inline';
  });

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  constructor() {
    // Lien courant dans le sous-menu : bouton mis en avant, accordéon ouvert au premier rendu.
    afterNextRender(() => {
      const panel = this.panel().nativeElement;
      const update = (first: boolean) => {
        const active = !!panel.querySelector('[aria-current="page"], .is-active');
        this.hasActive.set(active);
        if (first && active && this.mode() === 'inline') this.expanded.set(true);
      };
      update(true);
      const observer = new MutationObserver(() => update(false));
      observer.observe(panel, {
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-current', 'class'],
      });
      this.injector.get(DestroyRef).onDestroy(() => observer.disconnect());
    });
  }

  toggle(): void {
    if (this.expanded()) {
      this.expanded.set(false);
      return;
    }
    if (this.mode() === 'flyout') {
      const rect = this.trigger().nativeElement.getBoundingClientRect();
      this.flyout.set({ top: rect.top, left: rect.right + 4 });
    } else {
      this.flyout.set(null);
    }
    this.alignEnd.set(false);
    this.expanded.set(true);
    if (this.mode() === 'dropdown') {
      afterNextRender(
        () => {
          const panel = this.panel().nativeElement.getBoundingClientRect();
          const view = this.host.ownerDocument.documentElement.clientWidth;
          if (panel.right > view) this.alignEnd.set(true);
        },
        { injector: this.injector },
      );
    }
  }

  /** Ferme un sous-menu flottant (liste déroulante ou panneau latéral). */
  closeFloating(restoreFocus = false): void {
    if (this.mode() === 'inline' || !this.expanded()) return;
    this.expanded.set(false);
    if (restoreFocus) this.trigger().nativeElement.focus();
  }

  protected onDocumentClick(event: Event): void {
    if (!this.host.contains(event.target as Node)) this.closeFloating();
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && !this.host.contains(next)) this.closeFloating();
  }

  protected onEscape(event: Event): void {
    if (this.mode() === 'inline' || !this.expanded()) return;
    event.stopPropagation();
    this.closeFloating(true);
  }

  /** Un lien activé dans un sous-menu flottant le ferme. */
  protected onPanelClick(event: Event): void {
    if ((event.target as Element).closest('a[href], [gestioNavItem]')) this.closeFloating();
  }
}

/** Menu, lien, groupe et sous-menu de navigation. */
export const GESTIO_NAVMENU_IMPORTS = [
  GestioNavmenu,
  GestioNavItem,
  GestioNavGroup,
  GestioNavSubmenu,
] as const;
