import {
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GestioSize, ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

export type GestioRatingSize = GestioSize;

/** Libellés de la note (internationalisation). */
export interface GestioRatingLabels {
  /** Nom accessible de la note en lecture seule ; `{value}`, `{max}` sont remplacés. */
  summary: string;
  /** Nom accessible d'une option (singulier) ; `{value}` est remplacé. */
  star: string;
  /** Nom accessible d'une option (pluriel) ; `{value}` est remplacé. */
  stars: string;
  /** Nombre d'avis ; `{count}` est remplacé. */
  count: string;
  /** Note absente en lecture seule. */
  empty: string;
}

export const GESTIO_RATING_LABELS: GestioRatingLabels = {
  summary: 'Note : {value} sur {max}',
  star: '{value} étoile',
  stars: '{value} étoiles',
  count: '{count} avis',
  empty: 'Pas encore de note',
};

/** Tracé d'une étoile dans une boîte 24×24. */
const STAR_PATH =
  'M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z';

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/**
 * Note en étoiles : affichage (`readonly`, fractions acceptées) ou saisie.
 *
 * ```html
 * <!-- Affichage -->
 * <gestio-rating readonly [value]="4.5" [count]="128" />
 * <!-- Saisie -->
 * <gestio-rating label="Votre note" [(value)]="note" />
 * ```
 *
 * En saisie, les étoiles sont des boutons radio natifs regroupés dans un
 * `<fieldset>` : Tab entre dans le groupe, les flèches changent la note.
 * Compatible Reactive Forms, Signal Forms (`[formField]`) et `[(value)]`.
 */
@Component({
  selector: 'gestio-rating',
  imports: [NgTemplateOutlet],
  templateUrl: './rating.html',
  styleUrl: './rating.scss',
  host: {
    class: 'gestio-rating',
    '[class]': '"gestio-rating--" + size()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioRating), multi: true },
  ],
})
export class GestioRating implements ControlValueAccessor {
  /** Note courante (`[(value)]` hors formulaire). Peut être fractionnaire en lecture seule. */
  readonly value = model<number | null>(null);
  /** Nombre d'étoiles. */
  readonly max = input(5, { transform: numberAttribute });
  /** Affichage seul : la note n'est pas modifiable. */
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly size = input<GestioRatingSize>('md');
  /** Légende visible du groupe en saisie. */
  readonly label = input<string>();
  /** Nom accessible sans légende visible. */
  readonly ariaLabel = input<string>();
  /** Affiche la valeur numérique à côté des étoiles (lecture seule). */
  readonly showValue = input(false, { transform: booleanAttribute });
  /** Nombre d'avis affiché à côté des étoiles (lecture seule). */
  readonly count = input<number | null>(null);
  /** Attribut `name` des radios. Généré si absent. */
  readonly name = input<string>();
  /** Locale de formatage des nombres. */
  readonly locale = input('fr-FR');
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioRatingLabels>>({});

  protected readonly starPath = STAR_PATH;
  private readonly generatedId = gestioUniqueId('gestio-rating');
  protected readonly groupName = computed(() => this.name() ?? this.generatedId);

  protected readonly text = computed<GestioRatingLabels>(() => ({
    ...GESTIO_RATING_LABELS,
    ...this.labels(),
  }));

  /** Note survolée : aperçu avant clic. */
  protected readonly hovered = signal<number | null>(null);
  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());

  private readonly numberFormat = computed(
    () => new Intl.NumberFormat(this.locale(), { maximumFractionDigits: 1 }),
  );

  protected readonly clampedValue = computed(() =>
    Math.min(Math.max(0, this.value() ?? 0), Math.max(1, this.max())),
  );

  /** Étoiles avec leur taux de remplissage (0 à 100). */
  protected readonly stars = computed(() => {
    const shown = this.hovered() ?? this.clampedValue();
    return Array.from({ length: Math.max(1, this.max()) }, (_, i) => {
      const n = i + 1;
      const fill = Math.round(Math.min(Math.max(shown - i, 0), 1) * 100);
      return { n, fill, label: this.optionLabel(n) };
    });
  });

  protected readonly formattedValue = computed(() =>
    this.numberFormat().format(this.clampedValue()),
  );

  protected readonly summary = computed(() => {
    const base =
      this.value() === null
        ? this.text().empty
        : interpolate(this.text().summary, {
            value: this.formattedValue(),
            max: this.numberFormat().format(this.max()),
          });
    return this.ariaLabel() ? `${this.ariaLabel()} — ${base}` : base;
  });

  protected readonly countText = computed(() => {
    const count = this.count();
    return count === null
      ? null
      : interpolate(this.text().count, { count: this.numberFormat().format(count) });
  });

  private onChange: (value: number | null) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'number' ? value : null);
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

  protected select(value: number): void {
    this.value.set(value);
    this.onChange(value);
  }

  protected preview(value: number | null): void {
    if (!this.isDisabled()) this.hovered.set(value);
  }

  private optionLabel(n: number): string {
    return interpolate(n > 1 ? this.text().stars : this.text().star, { value: n });
  }
}
