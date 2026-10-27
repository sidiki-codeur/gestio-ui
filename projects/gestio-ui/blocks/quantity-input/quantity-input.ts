import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GestioSize, ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

export type GestioQuantityInputSize = GestioSize;

/** Libellés du sélecteur de quantité (internationalisation). */
export interface GestioQuantityInputLabels {
  decrease: string;
  increase: string;
  /** Annonce après un clic sur − / + ; `{value}` est remplacé. */
  status: string;
}

export const GESTIO_QUANTITY_INPUT_LABELS: GestioQuantityInputLabels = {
  decrease: 'Diminuer la quantité',
  increase: 'Augmenter la quantité',
  status: 'Quantité : {value}',
};

/**
 * Sélecteur de quantité : champ numérique natif (`spinbutton`, flèches haut /
 * bas) encadré de boutons − et +. La valeur est bornée par `min` / `max` et
 * arrondie au `step` à la sortie du champ.
 *
 * ```html
 * <gestio-quantity-input label="Quantité" [min]="1" [max]="stock" [(value)]="quantity" />
 * ```
 *
 * Compatible Reactive Forms, Signal Forms (`[formField]`) et `[(value)]`.
 */
@Component({
  selector: 'gestio-quantity-input',
  templateUrl: './quantity-input.html',
  styleUrl: './quantity-input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GestioQuantityInput),
      multi: true,
    },
  ],
})
export class GestioQuantityInput implements ControlValueAccessor {
  /** Quantité (`[(value)]` hors formulaire). `null` si le champ est vide. */
  readonly value = model<number | null>(null);
  readonly min = input(0, { transform: numberAttribute });
  /** Borne haute ; aucune si absente. */
  readonly max = input<number | null, unknown>(null, {
    transform: (v: unknown) =>
      v === null || v === undefined || v === '' ? null : numberAttribute(v),
  });
  readonly step = input(1, { transform: numberAttribute });
  /** Libellé visible. */
  readonly label = input<string>();
  /** Nom accessible sans libellé visible. */
  readonly ariaLabel = input<string>();
  readonly hint = input<string>();
  /** Message d'erreur. Sa présence active l'état invalide. */
  readonly error = input<string | null>();
  readonly size = input<GestioQuantityInputSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();
  readonly name = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioQuantityInputLabels>>({});

  private readonly generatedId = gestioUniqueId('gestio-quantity');
  protected readonly controlId = computed(() => this.inputId() ?? this.generatedId);
  protected readonly hintId = `${this.generatedId}-hint`;
  protected readonly errorId = `${this.generatedId}-error`;

  protected readonly text = computed<GestioQuantityInputLabels>(() => ({
    ...GESTIO_QUANTITY_INPUT_LABELS,
    ...this.labels(),
  }));

  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly announcement = signal('');

  protected readonly canDecrease = computed(
    () => !this.isDisabled() && (this.value() ?? this.min()) > this.min(),
  );
  protected readonly canIncrease = computed(() => {
    const max = this.max();
    return !this.isDisabled() && (max === null || (this.value() ?? this.min() - 1) < max);
  });

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.hintId);
    if (this.error()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly control = viewChild<ElementRef<HTMLInputElement>>('control');

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    const next = typeof value === 'number' && !Number.isNaN(value) ? value : null;
    this.value.set(next);
    const element = this.control()?.nativeElement;
    if (element) element.value = next === null ? '' : String(next);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  protected decrease(): void {
    this.stepBy(-1);
  }

  protected increase(): void {
    this.stepBy(1);
  }

  protected handleInput(element: HTMLInputElement): void {
    // Saisie partielle (« - ») : on attend la sortie du champ.
    if (element.validity?.badInput) return;
    const raw = element.value.trim();
    const parsed = raw === '' ? null : Number(raw);
    this.commit(parsed === null || Number.isNaN(parsed) ? null : parsed, false);
  }

  protected handleBlur(element: HTMLInputElement): void {
    const current = this.value();
    if (current !== null) this.commit(this.normalize(current), false);
    element.value = this.value() === null ? '' : String(this.value());
    this.onTouched();
  }

  private stepBy(direction: 1 | -1): void {
    const start = this.value() ?? (direction > 0 ? this.min() - this.step() : this.min());
    this.commit(this.normalize(start + direction * this.step()), true);
  }

  /** Borne la valeur et l'aligne sur `step` à partir de `min`. */
  private normalize(value: number): number {
    const step = this.step() > 0 ? this.step() : 1;
    const aligned = this.min() + Math.round((value - this.min()) / step) * step;
    // Arrondi des erreurs flottantes (0,1 + 0,2).
    let next = Number(aligned.toFixed(10));
    const max = this.max();
    if (max !== null && next > max) next = max;
    if (next < this.min()) next = this.min();
    return next;
  }

  private commit(value: number | null, announce: boolean): void {
    if (value !== this.value()) {
      this.value.set(value);
      this.onChange(value);
    }
    const element = this.control()?.nativeElement;
    if (announce && element) element.value = value === null ? '' : String(value);
    if (announce) {
      this.announcement.set(this.text().status.replace('{value}', String(value ?? '')));
    }
  }
}
