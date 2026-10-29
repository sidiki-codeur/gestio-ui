import { InjectionToken, Signal } from '@angular/core';

export type GestioAccordionVariant = 'bordered' | 'separated' | 'flush';

/** Contrat interne entre `gestio-accordion` et ses `gestio-accordion-item`. */
export interface GestioAccordionHost {
  readonly variant: Signal<GestioAccordionVariant>;
}

export const GESTIO_ACCORDION = new InjectionToken<GestioAccordionHost>('GESTIO_ACCORDION');
