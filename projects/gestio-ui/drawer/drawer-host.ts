import { InjectionToken } from '@angular/core';
import { GestioDrawerPosition } from './drawer-ref';

/**
 * Contexte fourni à `<gestio-drawer-content>` : par `GestioDrawerService`
 * (contenu ouvert par le service) ou par `<gestio-drawer>` (usage déclaratif).
 * Interne au point d'entrée, non exporté.
 */
export interface GestioDrawerHost {
  readonly titleId: string;
  readonly descriptionId: string;
  position(): GestioDrawerPosition;
  close(): void;
}

export const GESTIO_DRAWER_HOST = new InjectionToken<GestioDrawerHost>('GESTIO_DRAWER_HOST');
