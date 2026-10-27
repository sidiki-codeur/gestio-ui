import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

/** Libellés du champ de code (internationalisation). */
export interface GestioOtpInputLabels {
  /** Libellé du groupe de cases. */
  label: string;
  /** Nom de chaque case ; `{index}` et `{length}` sont remplacés. */
  digit: string;
}

export const GESTIO_OTP_INPUT_LABELS: GestioOtpInputLabels = {
  label: 'Code de vérification',
  digit: 'Chiffre {index} sur {length}',
};

/** Découpe une valeur en `length` cases (chiffres uniquement). */
function toCells(value: string, length: number): string[] {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, length);
  return Array.from({ length }, (_, index) => digits[index] ?? '');
}

/**
 * Saisie d'un code à usage unique (OTP) : une case par chiffre.
 *
 * ```html
 * <gestio-otp-input [(value)]="code" (completed)="verify($event)" />
 * <gestio-otp-input [length]="4" [formField]="form.code" />
 * ```
 *
 * Avance automatiquement à la case suivante, recule avec Retour arrière,
 * se déplace avec les flèches, Début et Fin. Coller un code complet (ou le
 * remplissage automatique du SMS, `autocomplete="one-time-code"`) remplit
 * toutes les cases. Compatible Signal Forms (`[formField]`), Reactive Forms
 * et `[(value)]`.
 */
@Component({
  selector: 'gestio-otp-input',
  templateUrl: './otp-input.html',
  styleUrl: './otp-input.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioOtpInput), multi: true },
  ],
  host: { class: 'gestio-otp-input' },
})
export class GestioOtpInput implements ControlValueAccessor {
  /** Nombre de chiffres. */
  readonly length = input(6, { transform: numberAttribute });
  /** Code saisi (chiffres uniquement, sans espace). */
  readonly value = model('');
  /** Libellé visible du groupe (par défaut « Code de vérification »). */
  readonly label = input<string>();
  /** Texte d'aide sous les cases. */
  readonly hint = input<string>();
  /** Message d'erreur ; active l'état invalide. */
  readonly error = input<string | null>();
  /** État invalide (lié automatiquement par `[formField]`), affiché après interaction. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Champ touché (lié automatiquement par `[formField]`). */
  readonly touched = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioOtpInputLabels>>({});

  /** Émis quand toutes les cases sont remplies par l'utilisateur. */
  readonly completed = output<string>();
  /** Émis quand le focus quitte le groupe (marque le champ comme touché). */
  readonly touch = output<void>();

  private readonly generatedId = gestioUniqueId('gestio-otp-input');
  protected readonly labelId = `${this.generatedId}-label`;
  protected readonly hintId = `${this.generatedId}-hint`;
  protected readonly errorId = `${this.generatedId}-error`;

  protected readonly text = computed<GestioOtpInputLabels>(() => ({
    ...GESTIO_OTP_INPUT_LABELS,
    ...this.labels(),
  }));

  /** Cases affichées. Les trous (case effacée au milieu) sont conservés. */
  protected readonly cells = linkedSignal<{ value: string; length: number }, string[]>({
    source: () => ({ value: this.value(), length: this.length() }),
    computation: (source, previous) =>
      previous &&
      previous.value.length === source.length &&
      previous.value.join('') === source.value
        ? previous.value
        : toCells(source.value, source.length),
  });

  private readonly disabledByForm = signal(false);
  private readonly interacted = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly showInvalid = computed(
    () => !!this.error() || (this.invalid() && (this.touched() || this.interacted())),
  );
  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.hintId);
    if (this.error()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly inputs = viewChildren<ElementRef<HTMLInputElement>>('cell');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** Place le focus sur la première case vide (ou la dernière). */
  focus(options?: FocusOptions): void {
    const index = this.cells().findIndex((cell) => !cell);
    this.focusCell(index === -1 ? this.length() - 1 : index, options);
  }

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'string' || typeof value === 'number' ? String(value) : '');
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

  protected digitLabel(index: number): string {
    return this.text()
      .digit.replace('{index}', String(index + 1))
      .replace('{length}', String(this.length()));
  }

  protected handleFocus(element: HTMLInputElement): void {
    // Sélectionne le chiffre : la frappe suivante le remplace.
    element.select();
  }

  protected handleInput(index: number, element: HTMLInputElement): void {
    const previous = this.cells()[index];
    let digits = element.value.replace(/\D/g, '');
    // Frappe dans une case déjà remplie (curseur avant ou après l'ancien chiffre).
    if (digits.length === 2 && previous) {
      digits = digits[0] === previous ? digits[1] : digits[0];
    }
    if (digits.length <= 1) {
      this.update(index, [digits]);
      if (digits) this.focusCell(index + 1);
    } else {
      // Remplissage automatique (SMS) ou saisie rapide : répartit les chiffres.
      this.fillFrom(digits.length >= this.length() ? 0 : index, digits);
    }
  }

  protected handlePaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    const digits = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!digits) return;
    this.fillFrom(digits.length >= this.length() ? 0 : index, digits);
  }

  protected handleKeydown(index: number, event: KeyboardEvent): void {
    const last = this.length() - 1;
    switch (event.key) {
      case 'Backspace':
        event.preventDefault();
        if (this.cells()[index]) {
          this.update(index, ['']);
        } else if (index > 0) {
          this.update(index - 1, ['']);
          this.focusCell(index - 1);
        }
        return;
      case 'Delete':
        event.preventDefault();
        this.update(index, ['']);
        return;
      case 'ArrowLeft':
        event.preventDefault();
        this.focusCell(index - 1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.focusCell(index + 1);
        return;
      case 'Home':
        event.preventDefault();
        this.focusCell(0);
        return;
      case 'End':
        event.preventDefault();
        this.focusCell(last);
        return;
    }
    // Bloque les caractères non numériques (les raccourcis restent possibles).
    if (event.key.length === 1 && !/\d/.test(event.key) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
    }
  }

  protected handleBlur(event: FocusEvent): void {
    const group = (event.currentTarget as HTMLElement | null)?.closest('.gestio-otp');
    if (group && group.contains(event.relatedTarget as Node | null)) return;
    this.interacted.set(true);
    this.onTouched();
    this.touch.emit();
  }

  private fillFrom(start: number, digits: string): void {
    const chars = digits.slice(0, this.length() - start).split('');
    this.update(start, chars);
    this.focusCell(Math.min(start + chars.length, this.length() - 1));
  }

  /** Écrit des chiffres à partir de `start` puis publie la nouvelle valeur. */
  private update(start: number, chars: readonly string[]): void {
    const wasComplete = this.cells().every(Boolean);
    const next = [...this.cells()];
    chars.forEach((char, offset) => {
      if (start + offset < next.length) next[start + offset] = char;
    });
    this.cells.set(next);
    // Synchronise les champs natifs (une liaison inchangée ne réécrit pas le DOM).
    this.inputs().forEach((ref, index) => (ref.nativeElement.value = next[index] ?? ''));
    const joined = next.join('');
    this.value.set(joined);
    this.onChange(joined);
    if (!wasComplete && next.every(Boolean)) this.completed.emit(joined);
  }

  private focusCell(index: number, options?: FocusOptions): void {
    const target = this.inputs()[Math.max(0, Math.min(index, this.length() - 1))];
    target?.nativeElement.focus(options);
  }
}
