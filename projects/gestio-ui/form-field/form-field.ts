import {
  Component,
  Directive,
  ElementRef,
  HostAttributeToken,
  InjectionToken,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { GestioSize, ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

/** Éléments qu'un `<label for>` sait nommer. */
const LABELABLE = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'METER', 'OUTPUT', 'PROGRESS']);

/** Contrat interne entre le champ et son contrôle. */
interface FormFieldContext {
  readonly controlId: () => string;
  readonly labelId: string;
  readonly hasLabel: () => boolean;
  readonly describedBy: () => string | null;
  readonly invalid: () => boolean;
  readonly required: () => boolean;
  register(control: { id: string; labelable: boolean }): void;
}

const GESTIO_FORM_FIELD = new InjectionToken<FormFieldContext>('GestioFormField');

/**
 * Enveloppe de champ : libellé, aide, message d'erreur et indicateur
 * « obligatoire » autour d'un contrôle natif (`input`, `select`, `textarea`)
 * ou de tout élément marqué `gestioFieldControl`.
 *
 * ```html
 * <gestio-form-field label="Date d'échéance" hint="Au format jj/mm/aaaa" [error]="dueError()">
 *   <input gestioFieldControl type="date" formControlName="due" />
 * </gestio-form-field>
 * ```
 *
 * Le contrôle reçoit automatiquement `id`, `aria-describedby` et `aria-invalid`.
 * Les composants Gestio (`gestio-input`, `gestio-select`…) ont déjà leur propre
 * libellé : ils n'ont pas besoin de cette enveloppe.
 */
@Component({
  selector: 'gestio-form-field',
  template: `
    @if (label()) {
      <label
        class="gestio-form-field__label"
        [id]="labelId"
        [attr.for]="labelable() ? controlId() : null"
      >
        {{ label() }}
        @if (required()) {
          <span class="gestio-form-field__required" aria-hidden="true">*</span>
        }
      </label>
    }
    <div class="gestio-form-field__control">
      <ng-content />
    </div>
    @if (hint()) {
      <p class="gestio-form-field__hint" [id]="hintId">{{ hint() }}</p>
    }
    @if (error()) {
      <p class="gestio-form-field__error" [id]="errorId">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5" />
          <path
            d="M8 4.5v4.2M8 11v.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        <span>{{ error() }}</span>
      </p>
    }
  `,
  styleUrl: './form-field.scss',
  // Styles non encapsulés (préfixés .gestio-) : ils doivent atteindre le contrôle projeté.
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: GESTIO_FORM_FIELD, useExisting: GestioFormField }],
  host: {
    class: 'gestio-form-field',
    '[class.is-invalid]': 'invalid()',
    '[class.is-sm]': "size() === 'sm'",
    '[class.is-lg]': "size() === 'lg'",
  },
})
export class GestioFormField implements FormFieldContext {
  /** Libellé visible, relié au contrôle (`for`, ou `aria-labelledby` si l'élément n'est pas étiquetable). */
  readonly label = input<string>();
  /** Texte d'aide, relié par `aria-describedby`. */
  readonly hint = input<string>();
  /** Message d'erreur. Sa présence active l'état invalide. */
  readonly error = input<string | null>();
  /** Affiche l'astérisque (la contrainte elle-même reste portée par le contrôle ou le formulaire). */
  readonly required = input(false, { transform: booleanAttribute });
  /** Hauteur des contrôles natifs. */
  readonly size = input<GestioSize>('md');

  private readonly generatedId = gestioUniqueId('gestio-form-field');
  readonly labelId = `${this.generatedId}-label`;
  protected readonly hintId = `${this.generatedId}-hint`;
  protected readonly errorId = `${this.generatedId}-error`;

  private readonly control = signal({ id: `${this.generatedId}-control`, labelable: true });
  readonly controlId = computed(() => this.control().id);
  protected readonly labelable = computed(() => this.control().labelable);

  readonly hasLabel = computed(() => !!this.label());
  readonly invalid = computed(() => !!this.error());
  readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.hintId);
    if (this.error()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });

  register(control: { id: string; labelable: boolean }): void {
    this.control.set(control);
  }
}

/**
 * Marque le contrôle d'un `gestio-form-field`. Sur un `input`, `select` ou
 * `textarea`, applique aussi le style des champs Gestio.
 */
@Directive({
  selector: '[gestioFieldControl]',
  host: {
    class: 'gestio-field-control',
    '[id]': 'id',
    '[attr.aria-labelledby]': '!labelable && field.hasLabel() ? field.labelId : null',
    '[attr.aria-describedby]': 'field.describedBy()',
    '[attr.aria-invalid]': 'field.invalid() ? "true" : null',
  },
})
export class GestioFieldControl {
  protected readonly field = inject(GESTIO_FORM_FIELD);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Un `id` posé dans le gabarit est conservé. */
  protected readonly id =
    inject(new HostAttributeToken('id'), { optional: true }) ?? this.field.controlId();
  protected readonly labelable = LABELABLE.has(this.element.tagName);

  constructor() {
    this.field.register({ id: this.id, labelable: this.labelable });
  }
}

/** `imports: [GESTIO_FORM_FIELD_IMPORTS]` */
export const GESTIO_FORM_FIELD_IMPORTS = [GestioFormField, GestioFieldControl] as const;
