import { InjectionToken, Provider } from '@angular/core';

export type GestioToastVariant = 'success' | 'error' | 'info' | 'warning';
export type GestioToastPosition = 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';

export interface GestioToastOptions {
  /** Titre affiché au-dessus du message. */
  title?: string;
  /** Durée d'affichage en millisecondes. `0` : pas de fermeture automatique. */
  duration?: number;
}

/** Notification affichée par `<gestio-toaster>`. */
export interface GestioToast {
  readonly id: string;
  readonly variant: GestioToastVariant;
  readonly message: string;
  readonly title?: string;
  readonly duration: number;
}

export interface GestioToastConfig {
  /** Durée par défaut en millisecondes. 5000 par défaut. */
  duration: number;
  /** Nombre maximal de notifications visibles ; les plus anciennes sont retirées. 3 par défaut. */
  maxVisible: number;
  /** Position de la pile. `bottom-right` par défaut (pleine largeur sur mobile). */
  position: GestioToastPosition;
}

export const GESTIO_TOAST_DEFAULTS: GestioToastConfig = {
  duration: 5000,
  maxVisible: 3,
  position: 'bottom-right',
};

export const GESTIO_TOAST_CONFIG = new InjectionToken<Partial<GestioToastConfig>>(
  'GESTIO_TOAST_CONFIG',
);

/** Configure les notifications de l'application. */
export function provideGestioToast(config: Partial<GestioToastConfig>): Provider {
  return { provide: GESTIO_TOAST_CONFIG, useValue: config };
}
