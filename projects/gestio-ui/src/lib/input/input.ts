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
import { gestioUniqueId } from '../core/id';
import { GestioSize } from '../core/types';

export type GestioInputType = 'text' | 'email' | 'password' | 'tel' | 'number';
export type GestioInputSize = GestioSize;
/** Valeur exposée : `number | null` pour `type="number"`, sinon une chaîne. */
export type GestioInputValue = string | number | null;

/**
 * Champ de saisie avec label, aide, erreur, préfixe et suffixe.
 * Compatible Reactive Forms et `ngModel` (ControlValueAccessor).
 *
 * ```html
 * <gestio-input label="E-mail" type="email" formControlName="email" />
 * ```
 *
 * Préfixe / suffixe : projeter un élément portant `gestioPrefix` ou `gestioSuffix`.
 */
@Component({
  selector: 'gestio-input',
  templateUrl: './input.html',
  styleUrl: './input.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioInput), multi: true },
  ],
})
export class GestioInput implements ControlValueAccessor {
  /** Libellé visible associé au champ. */
  readonly label = input<string>();
  /** Nom accessible si aucun libellé visible n'est fourni. */
  readonly ariaLabel = input<string>();
  readonly placeholder = input<string>();
  /** Texte d'aide affiché sous le champ. */
  readonly hint = input<string>();
  /** Message d'erreur. Sa présence active l'état invalide (`aria-invalid`). */
  readonly error = input<string | null>();
  readonly type = input<GestioInputType>('text');
  readonly size = input<GestioInputSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Affiche l'indicateur et pose l'attribut natif `required`. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Identifiant du champ natif. Généré automatiquement si absent. */
  readonly inputId = input<string>();
  readonly name = input<string>();
  readonly autocomplete = input<string>();
  readonly min = input<number>();
  readonly max = input<number>();
  readonly step = input<number>();
  readonly maxlength = input<number>();
  /** Libellés du bouton d'affichage du mot de passe. */
  readonly showPasswordLabel = input('Afficher le mot de passe');
  readonly hidePasswordLabel = input('Masquer le mot de passe');

  private readonly generatedId = gestioUniqueId('gestio-input');
  protected readonly controlId = computed(() => this.inputId() ?? this.generatedId);
  protected readonly hintId = `${this.generatedId}-hint`;
  protected readonly errorId = `${this.generatedId}-error`;

  /** Valeur affichée dans le champ natif (toujours une chaîne). */
  protected readonly displayValue = signal('');
  protected readonly passwordVisible = signal(false);
  private readonly disabledByForm = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly invalid = computed(() => !!this.error());
  protected readonly nativeType = computed(() =>
    this.type() === 'password' && this.passwordVisible() ? 'text' : this.type(),
  );
  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.hintId);
    if (this.error()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly control = viewChild<ElementRef<HTMLInputElement>>('control');

  private onChange: (value: GestioInputValue) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    const text = value === null || value === undefined ? '' : String(value);
    this.displayValue.set(text);
    // Écriture directe : garantit la synchronisation même si la valeur liée n'a pas changé.
    const element = this.control()?.nativeElement;
    if (element) element.value = text;
  }

  registerOnChange(fn: (value: GestioInputValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  protected handleInput(element: HTMLInputElement): void {
    const raw = element.value;
    // Saisie numérique partielle (« 1e », « - ») : le navigateur expose une chaîne vide.
    // On ne réécrit pas le champ pour ne pas effacer ce que tape l'utilisateur.
    if (!element.validity?.badInput) {
      this.displayValue.set(raw);
    }
    this.onChange(this.parse(raw));
  }

  protected handleBlur(): void {
    this.onTouched();
  }

  protected togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  private parse(raw: string): GestioInputValue {
    if (this.type() !== 'number') return raw;
    if (raw.trim() === '') return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
