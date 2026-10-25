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
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

export type GestioSwitchLabelPosition = 'start' | 'end';

/**
 * Interrupteur activé / désactivé : `<input type="checkbox" role="switch">`
 * natif. À réserver aux réglages qui s'appliquent immédiatement ; dans un
 * formulaire validé par un bouton, préférer `gestio-checkbox`.
 *
 * ```html
 * <gestio-switch label="Relances automatiques" [(checked)]="reminders" />
 * ```
 */
@Component({
  selector: 'gestio-switch',
  template: `
    <div
      class="gestio-switch"
      [class.is-start]="labelPosition() === 'start'"
      [class.is-disabled]="isDisabled()"
    >
      <label class="gestio-switch__label" [for]="controlId()">
        <input
          #control
          type="checkbox"
          role="switch"
          class="gestio-switch__input"
          [id]="controlId()"
          [checked]="checked()"
          [disabled]="isDisabled()"
          [attr.name]="name() ?? null"
          [attr.aria-label]="label() ? null : (ariaLabel() ?? null)"
          [attr.aria-describedby]="description() ? descriptionId : null"
          (change)="handleChange(control)"
          (blur)="onTouched()"
        />
        <span class="gestio-switch__text">{{ label() }}<ng-content /></span>
      </label>
      @if (description()) {
        <p class="gestio-switch__description" [id]="descriptionId">{{ description() }}</p>
      }
    </div>
  `,
  styleUrl: './switch.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioSwitch), multi: true },
  ],
})
export class GestioSwitch implements ControlValueAccessor {
  /** Libellé ; le contenu projeté s'y ajoute. */
  readonly label = input<string>();
  /** Nom accessible sans libellé visible. */
  readonly ariaLabel = input<string>();
  /** Texte secondaire relié par `aria-describedby`. */
  readonly description = input<string>();
  /** État activé (`[(checked)]` hors formulaire). */
  readonly checked = model(false);
  /** Libellé avant (`start`, typique des listes de réglages) ou après l'interrupteur. */
  readonly labelPosition = input<GestioSwitchLabelPosition>('end');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly switchId = input<string>();
  readonly name = input<string>();

  private readonly generatedId = gestioUniqueId('gestio-switch');
  protected readonly controlId = computed(() => this.switchId() ?? this.generatedId);
  protected readonly descriptionId = `${this.generatedId}-description`;

  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());

  private readonly control = viewChild<ElementRef<HTMLInputElement>>('control');

  private onChange: (value: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

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
    this.checked.set(element.checked);
    this.onChange(element.checked);
  }
}
