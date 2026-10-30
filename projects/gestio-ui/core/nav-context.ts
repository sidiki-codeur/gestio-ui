import { InjectionToken, Signal, WritableSignal } from '@angular/core';

/**
 * Contexte fourni aux menus de navigation par leur conteneur (layout,
 * navbar) : orientation et mode réduit (rail d'icônes). Usage interne.
 */
export interface GestioNavContext {
  readonly orientation: Signal<'horizontal' | 'vertical'>;
  readonly collapsed: Signal<boolean>;
}

export const GESTIO_NAV_CONTEXT = new InjectionToken<GestioNavContext>('GESTIO_NAV_CONTEXT');

/**
 * Tiroir de navigation d'un layout (petits écrans). Une navbar placée dans
 * l'en-tête du layout affiche alors elle-même le bouton de menu. Usage interne.
 */
export interface GestioNavLayoutContext {
  /** Vrai sous le point de rupture : le menu latéral est un tiroir. */
  readonly drawerMode: Signal<boolean>;
  readonly drawerOpen: Signal<boolean>;
  readonly drawerId: string;
  readonly menuLabel: Signal<string>;
  toggleDrawer(): void;
  /** Passe à vrai quand une navbar affiche le bouton de menu à la place du layout. */
  readonly externalToggle: WritableSignal<boolean>;
}

export const GESTIO_NAV_LAYOUT = new InjectionToken<GestioNavLayoutContext>('GESTIO_NAV_LAYOUT');
