import {
  Component,
  ElementRef,
  OnInit,
  booleanAttribute,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GESTIO_RADIO_GROUP } from './radio-context';

/**
 * Bouton radio d'un `gestio-radio-group`, reposant sur un
 * `<input type="radio">` natif.
 *
 * ```html
 * <gestio-radio value="transfer" label="Virement" description="Sous 2 jours ouvrés" />
 * ```
 */
@Component({
  selector: 'gestio-radio',
  template: `
    <div class="gestio-radio" [class.is-disabled]="isDisabled()">
      <label class="gestio-radio__label" [for]="id">
        <input
          #control
          type="radio"
          class="gestio-radio__input"
          [id]="id"
          [attr.name]="group.name()"
          [checked]="checked()"
          [disabled]="disabled()"
          [required]="group.required()"
          [attr.aria-describedby]="description() ? descriptionId : null"
          (change)="group.select(value())"
          (blur)="group.touch()"
        />
        <span class="gestio-radio__text">{{ label() }}<ng-content /></span>
      </label>
      @if (description()) {
        <p class="gestio-radio__description" [id]="descriptionId">{{ description() }}</p>
      }
    </div>
  `,
  styleUrl: './radio.scss',
})
export class GestioRadio implements OnInit {
  protected readonly group = inject(GESTIO_RADIO_GROUP);

  /** Valeur transmise au groupe lorsque ce radio est choisi. */
  readonly value = input.required<unknown>();
  /** Libellé ; le contenu projeté s'y ajoute. */
  readonly label = input<string>();
  /** Texte secondaire relié par `aria-describedby`. */
  readonly description = input<string>();
  /** Désactive ce seul choix. */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly id = gestioUniqueId('gestio-radio');
  protected readonly descriptionId = `${this.id}-description`;
  protected readonly checked = computed(() => this.group.isSelected(this.value()));
  protected readonly isDisabled = computed(() => this.disabled() || this.group.groupDisabled());

  private readonly control = viewChild<ElementRef<HTMLInputElement>>('control');
  private initialized = false;

  ngOnInit(): void {
    this.initialized = true;
  }

  /**
   * Écrit l'état coché dans le DOM (usage interne, appelé par le groupe) : garantit la
   * synchronisation même si la valeur liée n'a pas changé depuis le dernier rendu.
   */
  syncChecked(): void {
    // Pas encore initialisé : la liaison [checked] s'en chargera.
    const element = this.control()?.nativeElement;
    if (this.initialized && element) element.checked = this.group.isSelected(this.value());
  }
}
