import {
  Component,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioRadio } from './radio';
import { GESTIO_RADIO_GROUP, RadioGroupContext } from './radio-context';

export type GestioRadioOrientation = 'vertical' | 'horizontal';

/**
 * Groupe de boutons radio : `<fieldset>` natif, une seule valeur, navigation
 * aux flèches assurée par le navigateur. Compatible Reactive Forms, Signal Forms
 * (`[formField]`) et `[(value)]`. La valeur peut être de n'importe quel type.
 *
 * ```html
 * <gestio-radio-group label="Mode de paiement" formControlName="payment">
 *   <gestio-radio value="card" label="Carte bancaire" />
 *   <gestio-radio value="transfer" label="Virement" description="Sous 2 jours ouvrés" />
 * </gestio-radio-group>
 * ```
 */
@Component({
  selector: 'gestio-radio-group',
  template: `
    <fieldset
      class="gestio-radio-group"
      role="radiogroup"
      [disabled]="groupDisabled()"
      [class.is-horizontal]="orientation() === 'horizontal'"
      [attr.aria-label]="label() ? null : (ariaLabel() ?? null)"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="error() ? 'true' : null"
      [attr.aria-required]="required() ? 'true' : null"
    >
      @if (label()) {
        <legend class="gestio-radio-group__legend">
          {{ label() }}
          @if (required()) {
            <span class="gestio-radio-group__required" aria-hidden="true">*</span>
          }
        </legend>
      }
      @if (hint()) {
        <p class="gestio-radio-group__hint" [id]="hintId">{{ hint() }}</p>
      }
      <div class="gestio-radio-group__options">
        <ng-content />
      </div>
      @if (error()) {
        <p class="gestio-radio-group__error" [id]="errorId">{{ error() }}</p>
      }
    </fieldset>
  `,
  styleUrl: './radio-group.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioRadioGroup), multi: true },
    { provide: GESTIO_RADIO_GROUP, useExisting: forwardRef(() => GestioRadioGroup) },
  ],
})
export class GestioRadioGroup<T = unknown> implements ControlValueAccessor, RadioGroupContext {
  /** Légende du groupe (`<legend>`). */
  readonly label = input<string>();
  /** Nom accessible si aucune légende visible n'est fournie. */
  readonly ariaLabel = input<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>();
  /** Valeur sélectionnée (`[(value)]` hors formulaire). */
  readonly value = model<T | null>(null);
  readonly orientation = input<GestioRadioOrientation>('vertical');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /** Attribut `name` partagé par les radios. Généré si absent. */
  readonly nameAttr = input<string>(undefined, { alias: 'name' });

  private readonly generatedId = gestioUniqueId('gestio-radio-group');
  protected readonly hintId = `${this.generatedId}-hint`;
  protected readonly errorId = `${this.generatedId}-error`;

  private readonly disabledByForm = signal(false);
  readonly name = computed(() => this.nameAttr() ?? this.generatedId);
  readonly groupDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.hintId);
    if (this.error()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly radios = contentChildren(GestioRadio, { descendants: true });

  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.value.set((value ?? null) as T | null);
    for (const radio of this.radios()) radio.syncChecked();
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  // ---- Contrat avec gestio-radio (usage interne) ----

  isSelected(value: unknown): boolean {
    return Object.is(this.value(), value);
  }

  select(value: unknown): void {
    this.value.set(value as T);
    this.onChange(value as T);
  }

  touch(): void {
    this.onTouched();
  }
}
