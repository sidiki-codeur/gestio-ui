import { InjectionToken, Signal } from '@angular/core';
import { GestioSize } from '@gestiolabs336/ui/core';
import type { GestioSegment } from './segment';

/** Contrat interne entre `gestio-segmented-control` et ses `gestio-segment` (non exporté). */
export interface SegmentedControlContext {
  readonly size: Signal<GestioSize>;
  readonly fullWidth: Signal<boolean>;
  readonly groupDisabled: Signal<boolean>;
  /** Segment qui porte `tabindex="0"` (tabulation itinérante). */
  readonly tabbable: Signal<GestioSegment | undefined>;
  isSelected(value: unknown): boolean;
  select(segment: GestioSegment): void;
}

export const GESTIO_SEGMENTED_CONTROL = new InjectionToken<SegmentedControlContext>(
  'GestioSegmentedControl',
);
