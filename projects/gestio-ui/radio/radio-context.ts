import { InjectionToken } from '@angular/core';

/** Contrat interne entre le groupe et ses boutons radio (non exporté). */
export interface RadioGroupContext {
  readonly name: () => string;
  readonly groupDisabled: () => boolean;
  readonly required: () => boolean;
  isSelected(value: unknown): boolean;
  select(value: unknown): void;
  touch(): void;
}

export const GESTIO_RADIO_GROUP = new InjectionToken<RadioGroupContext>('GestioRadioGroup');
