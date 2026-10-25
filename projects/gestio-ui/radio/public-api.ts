/*
 * @gestiolabs336/ui/radio
 */

export * from './radio-group';
export * from './radio';

import { GestioRadio } from './radio';
import { GestioRadioGroup } from './radio-group';

/** `imports: [GESTIO_RADIO_IMPORTS]` */
export const GESTIO_RADIO_IMPORTS = [GestioRadioGroup, GestioRadio] as const;
