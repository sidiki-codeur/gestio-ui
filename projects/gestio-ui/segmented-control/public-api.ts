/*
 * @gestiolabs336/ui/segmented-control
 */

export * from './segmented-control';
export * from './segment';

import { GestioSegment } from './segment';
import { GestioSegmentedControl } from './segmented-control';

/** `imports: [GESTIO_SEGMENTED_CONTROL_IMPORTS]` */
export const GESTIO_SEGMENTED_CONTROL_IMPORTS = [GestioSegmentedControl, GestioSegment] as const;
