import {
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  numberAttribute,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

/**
 * Zone de texte multiligne avec label, aide, erreur et compteur facultatif.
 * Compatible Reactive Forms et `ngModel` (ControlValueAccessor).
 *
 * ```html
 * <gestio-textarea label="Commentaire" [maxlength]="500" showCount formControlName="comment" />
 * ```
 */
@Component({
  selector: 'gestio-textarea',
  templateUrl: './textarea.html',
  styleUrl: './textarea.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioTextarea), multi: true },
  ],
})
export class GestioTextarea implements ControlValueAccessor {
  readonly label = input<string>();
  readonly ariaLabel = input<string>();
  readonly placeholder = input<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>();
  /** Nombre de lignes visibles. */
  readonly rows = input(4, { transform: numberAttribute });
  /** Longueur maximale (attribut natif `maxlength`). */
  readonly maxlength = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === null || value === undefined || value === '' ? undefined : numberAttribute(value),
  });
  /** Affiche le compteur de caractères. */
  readonly showCount = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly textareaId = input<string>();
  readonly name = input<string>();

  private readonly generatedId = gestioUniqueId('gestio-textarea');
  protected readonly controlId = computed(() => this.textareaId() ?? this.generatedId);
  protected readonly hintId = `${this.generatedId}-hint`;
  protected readonly errorId = `${this.generatedId}-error`;
  protected readonly countId = `${this.generatedId}-count`;

  protected readonly value = signal('');
  private readonly disabledByForm = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly invalid = computed(() => !!this.error());
  protected readonly length = computed(() => this.value().length);
  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.hintId);
    if (this.error()) ids.push(this.errorId);
    if (this.showCount()) ids.push(this.countId);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly control = viewChild<ElementRef<HTMLTextAreaElement>>('control');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    const text = value === null || value === undefined ? '' : String(value);
    this.value.set(text);
    const element = this.control()?.nativeElement;
    if (element) element.value = text;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  protected handleInput(element: HTMLTextAreaElement): void {
    this.value.set(element.value);
    this.onChange(element.value);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
