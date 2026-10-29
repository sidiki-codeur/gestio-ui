import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  numberAttribute,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

/** Valeur exposée : un nombre, ou `[début, fin]` en mode plage (`range`). */
export type GestioSliderValue = number | readonly [number, number];

/** Libellés du curseur (internationalisation). */
export interface GestioSliderLabels {
  /** Nom de la poignée basse en mode plage ; `{label}` est remplacé par le nom du curseur. */
  lowerThumb: string;
  /** Nom de la poignée haute en mode plage ; `{label}` est remplacé par le nom du curseur. */
  upperThumb: string;
  /** Valeur affichée en mode plage ; `{start}` et `{end}` sont remplacés. */
  range: string;
}

export const GESTIO_SLIDER_LABELS: GestioSliderLabels = {
  lowerThumb: '{label} minimum',
  upperThumb: '{label} maximum',
  range: '{start} – {end}',
};

/** Nombre maximal de graduations dessinées (au-delà, une sur n). */
const MAX_TICKS = 50;

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

function decimals(value: number): number {
  const text = String(value);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

/**
 * Curseur de sélection d'une valeur numérique, ou d'une plage avec deux
 * poignées (`range`). Chaque poignée est un `<input type="range">` natif :
 * flèches, Début/Fin et gestes des lecteurs d'écran sont ceux du navigateur ;
 * Page précédente/suivante avancent d'un dixième de l'étendue.
 *
 * ```html
 * <gestio-slider label="Remise" [min]="0" [max]="50" [step]="5" formControlName="discount" />
 * <gestio-slider label="Budget" range [min]="0" [max]="10000" [step]="100"
 *   [formatOptions]="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
 *   [(ngModel)]="budget" />
 * ```
 *
 * Valeur : `number`, ou `[début, fin]` en mode plage (les poignées ne se
 * croisent pas). Compatible Reactive Forms, `ngModel` et Signal Forms (`[formField]`).
 */
@Component({
  selector: 'gestio-slider',
  templateUrl: './slider.html',
  styleUrl: './slider.scss',
  host: {
    class: 'gestio-slider',
    '[class.gestio-slider--disabled]': 'isDisabled()',
    '[class.gestio-slider--range]': 'range()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GestioSlider), multi: true },
  ],
})
export class GestioSlider implements ControlValueAccessor {
  private readonly document = inject(DOCUMENT);

  /** Libellé visible, qui sert aussi de nom accessible. */
  readonly label = input<string>();
  /** Nom accessible si aucun libellé visible n'est fourni. */
  readonly ariaLabel = input<string>();
  /** Texte d'aide affiché sous le curseur. */
  readonly hint = input<string>();
  /** Borne basse. */
  readonly min = input(0, { transform: (v: unknown) => numberAttribute(v, 0) });
  /** Borne haute. */
  readonly max = input(100, { transform: (v: unknown) => numberAttribute(v, 100) });
  /** Pas entre deux valeurs. */
  readonly step = input(1, { transform: (v: unknown) => numberAttribute(v, 1) });
  /** Deux poignées : la valeur devient `[début, fin]`. */
  readonly range = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Dessine une graduation par pas (au plus 50) et les bornes sous la piste. */
  readonly showTicks = input(false, { transform: booleanAttribute });
  /** Affiche la valeur courante à côté du libellé. */
  readonly showValue = input(true, { transform: booleanAttribute });
  /** Options `Intl.NumberFormat` de la valeur affichée et annoncée (devise, unité…). */
  readonly formatOptions = input<Intl.NumberFormatOptions>({});
  /** Locale de formatage des nombres. */
  readonly locale = input('fr-FR');
  /** Attribut `name` des champs natifs. */
  readonly name = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioSliderLabels>>({});

  private readonly generatedId = gestioUniqueId('gestio-slider');
  protected readonly labelId = `${this.generatedId}-label`;
  protected readonly hintId = `${this.generatedId}-hint`;

  protected readonly text = computed<GestioSliderLabels>(() => ({
    ...GESTIO_SLIDER_LABELS,
    ...this.labels(),
  }));

  /** Valeur reçue (formulaire) ou choisie ; `null` tant qu'aucune n'est définie. */
  private readonly state = signal<GestioSliderValue | null>(null);
  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly inputs = viewChildren<ElementRef<HTMLInputElement>>('thumbInput');

  /** Bornes effectives (`max` toujours supérieur à `min`). */
  private readonly bounds = computed(() => {
    const min = this.min();
    const max = this.max();
    return { min, max: max > min ? max : min + 1 };
  });

  private readonly safeStep = computed(() => (this.step() > 0 ? this.step() : 1));

  /** Valeur de chaque poignée, bornée et alignée sur le pas. */
  protected readonly thumbs = computed<number[]>(() => {
    const { min, max } = this.bounds();
    const value = this.state();
    if (this.range()) {
      const [start, end] = Array.isArray(value) ? value : [min, max];
      const a = this.snap(Number(start ?? min));
      const b = this.snap(Number(end ?? max));
      return a <= b ? [a, b] : [b, a];
    }
    const single = typeof value === 'number' ? value : Array.isArray(value) ? value[0] : min;
    return [this.snap(Number(single))];
  });

  private readonly numberFormat = computed(
    () => new Intl.NumberFormat(this.locale(), this.formatOptions()),
  );

  protected readonly valueTexts = computed(() => this.thumbs().map((v) => this.format(v)));

  protected readonly displayValue = computed(() => {
    const texts = this.valueTexts();
    return texts.length === 2
      ? interpolate(this.text().range, { start: texts[0], end: texts[1] })
      : texts[0];
  });

  /** Nom accessible de chaque poignée. */
  protected readonly thumbLabels = computed(() => {
    const name = this.label() ?? this.ariaLabel() ?? '';
    if (!this.range()) return [this.label() ? null : (this.ariaLabel() ?? null)];
    return [this.text().lowerThumb, this.text().upperThumb].map((template) =>
      interpolate(template, { label: name }).trim(),
    );
  });

  protected readonly fill = computed(() => {
    const thumbs = this.thumbs();
    const start = thumbs.length === 2 ? this.percent(thumbs[0]) : 0;
    const end = this.percent(thumbs[thumbs.length - 1]);
    return { start, size: end - start };
  });

  protected readonly ticks = computed(() => {
    if (!this.showTicks()) return [];
    const { min, max } = this.bounds();
    const step = this.safeStep();
    const count = Math.floor((max - min) / step + 1e-9);
    const every = Math.max(1, Math.ceil(count / MAX_TICKS));
    const { start, size } = this.fill();
    const ticks: { percent: number; active: boolean }[] = [];
    for (let i = 0; i <= count; i += every) {
      const percent = this.percent(min + i * step);
      ticks.push({ percent, active: percent >= start && percent <= start + size });
    }
    if (ticks[ticks.length - 1]?.percent !== 100) {
      ticks.push({ percent: 100, active: start + size >= 100 });
    }
    return ticks;
  });

  protected readonly scale = computed(() => [
    this.format(this.bounds().min),
    this.format(this.bounds().max),
  ]);

  protected readonly describedBy = computed(() => (this.hint() ? this.hintId : null));

  private dragIndex: number | null = null;
  private onChange: (value: GestioSliderValue) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    // Les champs natifs suivent l'état, y compris quand une valeur bornée
    // ne change pas le signal (poignée poussée contre l'autre).
    afterRenderEffect(() => {
      const thumbs = this.thumbs();
      this.inputs().forEach((ref, i) => {
        const text = String(thumbs[i]);
        if (ref.nativeElement.value !== text) ref.nativeElement.value = text;
      });
    });
  }

  protected inputId(index: number): string {
    return `${this.generatedId}-${index}`;
  }

  // ---- ControlValueAccessor ----

  writeValue(value: unknown): void {
    if (typeof value === 'number' && Number.isFinite(value)) {
      this.state.set(value);
    } else if (
      Array.isArray(value) &&
      value.length === 2 &&
      value.every((v) => typeof v === 'number' && Number.isFinite(v))
    ) {
      this.state.set([value[0], value[1]]);
    } else {
      this.state.set(null);
    }
  }

  registerOnChange(fn: (value: GestioSliderValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  // ---- Interactions ----

  protected handleInput(index: number, element: HTMLInputElement): void {
    this.commit(index, Number(element.value));
    element.value = String(this.thumbs()[index]);
  }

  /** Page précédente/suivante : un dixième de l'étendue (au moins un pas). */
  protected handleKeydown(index: number, event: KeyboardEvent): void {
    if (event.key !== 'PageUp' && event.key !== 'PageDown') return;
    event.preventDefault();
    const { min, max } = this.bounds();
    const step = this.safeStep();
    const page = Math.max(step, Math.round((max - min) / 10 / step) * step);
    this.commit(index, this.thumbs()[index] + (event.key === 'PageUp' ? page : -page));
  }

  protected handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.isDisabled()) return;
    const value = this.valueAt(event.clientX);
    if (value === null) return;
    // Empêche la sélection de texte et le focus natif : la poignée est focalisée ci-dessous.
    event.preventDefault();
    const index = this.closestThumb(value);
    this.dragIndex = index;
    const target = event.currentTarget as HTMLElement | null;
    if (target?.setPointerCapture) {
      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        // Pointeur déjà relâché : le glisser s'arrête au prochain pointerup.
      }
    }
    this.commit(index, value);
    this.inputs()[index]?.nativeElement.focus({ preventScroll: true });
  }

  protected handlePointerMove(event: PointerEvent): void {
    if (this.dragIndex === null) return;
    const value = this.valueAt(event.clientX);
    if (value !== null) this.commit(this.dragIndex, value);
  }

  protected handlePointerEnd(): void {
    if (this.dragIndex === null) return;
    this.dragIndex = null;
    this.onTouched();
  }

  // ---- Calculs ----

  private commit(index: number, raw: number): void {
    const current = this.thumbs();
    const value = this.snap(raw);
    let next: GestioSliderValue;
    if (this.range()) {
      next =
        index === 0
          ? [Math.min(value, current[1]), current[1]]
          : [current[0], Math.max(value, current[0])];
    } else {
      next = value;
    }
    const nextThumbs = typeof next === 'number' ? [next] : [...next];
    if (this.state() !== null && nextThumbs.every((v, i) => v === current[i])) return;
    this.state.set(next);
    this.onChange(next);
  }

  /** Borne, aligne sur le pas (comme le champ natif) et corrige les erreurs d'arrondi. */
  private snap(value: number): number {
    const { min, max } = this.bounds();
    const step = this.safeStep();
    const precision = Math.max(decimals(step), decimals(min));
    const clamped = Math.min(Math.max(Number.isFinite(value) ? value : min, min), max);
    let snapped = min + Math.round((clamped - min) / step) * step;
    if (snapped > max + 1e-9) snapped -= step;
    return Number(snapped.toFixed(precision));
  }

  private percent(value: number): number {
    const { min, max } = this.bounds();
    return ((value - min) / (max - min)) * 100;
  }

  private format(value: number): string {
    return this.numberFormat().format(value);
  }

  /** Valeur correspondant à une abscisse écran, ou `null` si la piste n'a pas de largeur. */
  private valueAt(clientX: number): number | null {
    const element = this.track().nativeElement;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0) return null;
    let ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const view = this.document.defaultView;
    if (view && view.getComputedStyle(element).direction === 'rtl') ratio = 1 - ratio;
    const { min, max } = this.bounds();
    return min + ratio * (max - min);
  }

  /** Poignée la plus proche ; à égalité (poignées confondues), selon le côté du clic. */
  private closestThumb(value: number): number {
    const thumbs = this.thumbs();
    if (thumbs.length === 1) return 0;
    const [a, b] = thumbs;
    const da = Math.abs(value - a);
    const db = Math.abs(value - b);
    if (da !== db) return da < db ? 0 : 1;
    return value < a ? 0 : 1;
  }
}
