import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GestioSize, ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

/** Types de valeurs acceptés par `gestio-select`. */
export type GestioSelectValue = string | number;

export interface GestioSelectOption<T extends GestioSelectValue = GestioSelectValue> {
  label: string;
  value: T;
  disabled?: boolean;
}

export type GestioSelectSize = GestioSize;

/**
 * Sélecteur simple reposant sur un `<select>` natif stylisé.
 * Le type des valeurs (string ou number) est préservé : l'option choisie est
 * retrouvée par son index, jamais par conversion de la chaîne du DOM.
 *
 * ```html
 * <gestio-select label="Pays" [options]="pays" placeholder="Choisir…" formControlName="pays" />
 * ```
 */
@Component({
  selector: 'gestio-select',
  templateUrl: './select.html',
  styleUrl: './select.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioSelect), multi: true },
  ],
})
export class GestioSelect<
  T extends GestioSelectValue = GestioSelectValue,
> implements ControlValueAccessor {
  readonly label = input<string>();
  readonly ariaLabel = input<string>();
  /** Options proposées. */
  readonly options = input<readonly GestioSelectOption<T>[]>([]);
  /** Option vide initiale, correspondant à la valeur `null`. */
  readonly placeholder = input<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>();
  readonly size = input<GestioSelectSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly selectId = input<string>();
  readonly name = input<string>();

  private readonly generatedId = gestioUniqueId('gestio-select');
  protected readonly controlId = computed(() => this.selectId() ?? this.generatedId);
  protected readonly hintId = `${this.generatedId}-hint`;
  protected readonly errorId = `${this.generatedId}-error`;

  protected readonly value = signal<T | null>(null);
  private readonly disabledByForm = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly invalid = computed(() => !!this.error());
  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.hintId);
    if (this.error()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly control = viewChild<ElementRef<HTMLSelectElement>>('control');

  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    const next = value === undefined || value === null ? null : (value as T);
    this.value.set(next);
    const element = this.control()?.nativeElement;
    if (element) {
      const index =
        next === null ? -1 : this.options().findIndex((option) => option.value === next);
      element.value = index === -1 ? '' : String(index);
    }
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

  protected handleChange(element: HTMLSelectElement): void {
    const key = element.value;
    const option = key === '' ? undefined : this.options()[Number(key)];
    const next = option ? option.value : null;
    this.value.set(next);
    this.onChange(next);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
