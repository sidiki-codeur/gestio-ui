import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GestioSize } from '@gestiolabs336/ui/core';
import { GestioSegment } from './segment';
import { GESTIO_SEGMENTED_CONTROL, SegmentedControlContext } from './segmented-control-context';

export type GestioSegmentedControlSize = GestioSize;

/**
 * Contrôle segmenté : choix unique parmi quelques options affichées côte à
 * côte (motif ARIA « Radio Group »).
 *
 * ```html
 * <gestio-segmented-control ariaLabel="Période" [(value)]="period">
 *   <gestio-segment value="day" label="Jour" />
 *   <gestio-segment value="week" label="Semaine" />
 *   <gestio-segment value="month" label="Mois" />
 * </gestio-segmented-control>
 * ```
 *
 * Clavier : un seul arrêt de tabulation ; les flèches déplacent le focus et
 * sélectionnent, Début/Fin vont aux extrémités, Espace sélectionne. Les
 * segments désactivés sont ignorés. Compatible Reactive Forms, `ngModel`,
 * Signal Forms (`[formField]`) et `[(value)]`. La valeur peut être de
 * n'importe quel type (comparaison `Object.is`).
 */
@Component({
  selector: 'gestio-segmented-control',
  template: `<ng-content />`,
  styleUrl: './segmented-control.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GestioSegmentedControl),
      multi: true,
    },
    { provide: GESTIO_SEGMENTED_CONTROL, useExisting: forwardRef(() => GestioSegmentedControl) },
  ],
  host: {
    role: 'radiogroup',
    '[class]': '"gestio-segmented-control gestio-segmented-control--" + size()',
    '[class.gestio-segmented-control--full-width]': 'fullWidth()',
    '[class.gestio-segmented-control--disabled]': 'groupDisabled()',
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.aria-labelledby]': 'ariaLabelledby() ?? null',
    '[attr.aria-disabled]': 'groupDisabled() ? "true" : null',
    '(keydown)': 'handleKeydown($event)',
    '(focusout)': 'handleFocusout($event)',
  },
})
export class GestioSegmentedControl<T = unknown>
  implements ControlValueAccessor, SegmentedControlContext
{
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Valeur sélectionnée (`[(value)]` hors formulaire). */
  readonly value = model<T | null>(null);
  /** Nom accessible du groupe. */
  readonly ariaLabel = input<string>();
  /** Identifiant d'un libellé visible externe (alternative à `ariaLabel`). */
  readonly ariaLabelledby = input<string>();
  readonly size = input<GestioSegmentedControlSize>('md');
  /** Occupe toute la largeur ; les segments se partagent l'espace. */
  readonly fullWidth = input(false, { transform: booleanAttribute });
  /** Désactive tous les segments. */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly segments = contentChildren(GestioSegment, { descendants: true });
  private readonly disabledByForm = signal(false);

  readonly groupDisabled = computed(() => this.disabled() || this.disabledByForm());

  /** Segment sélectionné s'il est activable, sinon le premier segment activable. */
  readonly tabbable = computed<GestioSegment | undefined>(() => {
    const enabled = this.segments().filter((segment) => !segment.isDisabled());
    return enabled.find((segment) => segment.checked()) ?? enabled[0];
  });

  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  // ---- ControlValueAccessor ----

  writeValue(value: unknown): void {
    this.value.set((value ?? null) as T | null);
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

  // ---- Contrat avec gestio-segment (usage interne) ----

  isSelected(value: unknown): boolean {
    return Object.is(this.value(), value);
  }

  select(segment: GestioSegment): void {
    if (segment.isDisabled()) return;
    const value = segment.value() as T;
    if (this.isSelected(value)) return;
    this.value.set(value);
    this.onChange(value);
  }

  // ---- Clavier ----

  protected handleKeydown(event: KeyboardEvent): void {
    const enabled = this.segments().filter((segment) => !segment.isDisabled());
    if (!enabled.length) return;
    const current = enabled.findIndex((segment) =>
      segment.element.contains(event.target as Node | null),
    );

    if (event.key === ' ' || event.key === 'Enter') {
      if (current === -1) return;
      event.preventDefault();
      this.select(enabled[current]);
      return;
    }

    const rtl = this.isRtl();
    let target: number;
    switch (event.key) {
      case 'ArrowDown':
        target = current + 1;
        break;
      case 'ArrowUp':
        target = current - 1;
        break;
      case 'ArrowRight':
        target = rtl ? current - 1 : current + 1;
        break;
      case 'ArrowLeft':
        target = rtl ? current + 1 : current - 1;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = enabled.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const segment = enabled[(target + enabled.length) % enabled.length];
    this.select(segment);
    segment.focus();
  }

  /** Le contrôle est « touché » quand le focus quitte le groupe. */
  protected handleFocusout(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.nativeElement.contains(next)) this.onTouched();
  }

  private isRtl(): boolean {
    const view = this.document.defaultView;
    return !!view && view.getComputedStyle(this.host.nativeElement).direction === 'rtl';
  }
}
