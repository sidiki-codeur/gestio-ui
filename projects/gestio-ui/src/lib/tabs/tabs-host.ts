import { InjectionToken, Signal } from '@angular/core';
import type { GestioTab } from './tab';

/** Contrat interne entre `gestio-tabs` et ses `gestio-tab`. */
export interface GestioTabsHost {
  readonly baseId: string;
  readonly tabs: Signal<readonly GestioTab[]>;
  readonly activeIndex: Signal<number>;
}

export const GESTIO_TABS = new InjectionToken<GestioTabsHost>('GESTIO_TABS');
