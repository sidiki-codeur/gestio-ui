import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { gestioUniqueId } from '../core/id';

/**
 * Case à cocher reposant sur un `<input type="checkbox">` natif.
 * Compatible Reactive Forms (valeur booléenne) ou liaison `[(checked)]`.
 *
 * ```html
 * <gestio-checkbox label="Recevoir la newsletter" formControlName="newsletter" />
 * ```
 */
@Component({
  selector: 'gestio-checkbox',
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioCheckbox), multi: true },
  ],
})
export class GestioCheckbox implements ControlValueAccessor {
  /** Libellé. Le contenu projeté est également affiché dans le libellé. */
  readonly label = input<string>();
  /** Description secondaire, reliée par `aria-describedby`. */
  readonly description = input<string>();
  /** Nom accessible sans libellé visible (ex. sélection d'une ligne de tableau). */
  readonly ariaLabel = input<string>();
  readonly error = input<string | null>();
  /** État coché (liaison bidirectionnelle `[(checked)]`). */
  readonly checked = model(false);
  /** État indéterminé (repasse à `false` dès que l'utilisateur coche ou décoche). */
  readonly indeterminate = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly checkboxId = input<string>();
  readonly name = input<string>();
  readonly value = input<string>();

  private readonly generatedId = gestioUniqueId('gestio-checkbox');
  protected readonly controlId = computed(() => this.checkboxId() ?? this.generatedId);
  protected readonly descriptionId = `${this.generatedId}-description`;
  protected readonly errorId = `${this.generatedId}-error`;

  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.description()) ids.push(this.descriptionId);
    if (this.error()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly control = viewChild<ElementRef<HTMLInputElement>>('control');

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.checked.set(!!value);
    const element = this.control()?.nativeElement;
    if (element) element.checked = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  protected handleChange(element: HTMLInputElement): void {
    this.indeterminate.set(false);
    this.checked.set(element.checked);
    this.onChange(element.checked);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
