import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { gestioUniqueId } from '../core/id';
import { GestioBreakpoints } from './responsive';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Coque d'application : en-tête collant, barre latérale et zone principale.
 *
 * - À partir de 1024 px de large (`lg`), la barre latérale est fixe à gauche.
 * - En dessous, elle devient un tiroir ouvert par le bouton de menu de
 *   l'en-tête : focus déplacé dans le tiroir, Échap ou clic sur le fond pour
 *   fermer, retour du focus sur le bouton, contenu principal rendu inerte.
 *
 * ```html
 * <gestio-app-shell>
 *   <div gestioShellHeader>…logo, recherche, profil…</div>
 *   <nav gestioShellSidebar aria-label="Navigation principale">…</nav>
 *   <router-outlet />
 * </gestio-app-shell>
 * ```
 *
 * La coque fournit les repères `<header>` et `<main>` ainsi qu'un lien
 * d'évitement vers le contenu.
 */
@Component({
  selector: 'gestio-app-shell',
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  host: {
    class: 'gestio-app-shell',
    '[class.gestio-app-shell--drawer-open]': 'drawerOpen()',
    '[class.gestio-app-shell--no-sidebar]': '!withSidebar()',
    '[style.--gestio-shell-sidebar-width]': 'sidebarWidth()',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class GestioAppShell {
  private readonly injector = inject(Injector);
  private readonly screen = inject(GestioBreakpoints);

  /** Tiroir ouvert (mobile). Liaison bidirectionnelle `[(sidebarOpen)]`. */
  readonly sidebarOpen = model(false);
  /** Affiche la barre latérale et le bouton de menu. */
  readonly withSidebar = input(true, { transform: booleanAttribute });
  /** Largeur de la barre latérale sur grand écran. */
  readonly sidebarWidth = input('16rem');
  /** Ferme le tiroir quand un lien de la barre latérale est activé. */
  readonly closeOnNavigate = input(true, { transform: booleanAttribute });
  readonly menuLabel = input('Menu de navigation');
  readonly skipLinkLabel = input('Aller au contenu');

  protected readonly sidebarId = gestioUniqueId('gestio-shell-sidebar');
  protected readonly mainId = gestioUniqueId('gestio-shell-main');

  /** Vrai à partir du point de rupture `lg` (toujours faux en SSR). */
  readonly isDesktop = this.screen.lg;
  protected readonly drawerOpen = computed(
    () => this.withSidebar() && this.sidebarOpen() && !this.isDesktop(),
  );

  private readonly toggleButton = viewChild<ElementRef<HTMLButtonElement>>('toggle');
  private readonly sidebar = viewChild<ElementRef<HTMLElement>>('sidebar');

  constructor() {
    // Passage en grand écran : le tiroir n'a plus de sens.
    effect(() => {
      if (this.isDesktop() && this.sidebarOpen()) this.sidebarOpen.set(false);
    });
  }

  toggleSidebar(): void {
    if (this.sidebarOpen()) this.closeSidebar(true);
    else this.openSidebar();
  }

  openSidebar(): void {
    this.sidebarOpen.set(true);
    afterNextRender(
      () => {
        const panel = this.sidebar()?.nativeElement;
        const target = panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
        target?.focus();
      },
      { injector: this.injector },
    );
  }

  /** Ferme le tiroir ; `restoreFocus` rend le focus au bouton de menu. */
  closeSidebar(restoreFocus = false): void {
    if (!this.sidebarOpen()) return;
    this.sidebarOpen.set(false);
    if (restoreFocus) this.toggleButton()?.nativeElement.focus();
  }

  protected onEscape(): void {
    if (this.drawerOpen()) this.closeSidebar(true);
  }

  protected onSidebarClick(event: Event): void {
    const link = (event.target as Element | null)?.closest?.('a[href]');
    if (link && this.closeOnNavigate() && this.drawerOpen()) this.closeSidebar();
  }
}
