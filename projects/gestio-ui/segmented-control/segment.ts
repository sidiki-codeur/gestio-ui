import { Component, ElementRef, booleanAttribute, computed, inject, input } from '@angular/core';
import { GestioRipple } from '@gestiolabs336/ui/ripple';
import { GESTIO_SEGMENTED_CONTROL } from './segmented-control-context';

/**
 * Segment d'un `gestio-segmented-control` (`role="radio"`).
 *
 * ```html
 * <gestio-segment value="month" label="Mois" />
 * <gestio-segment value="list" ariaLabel="Affichage en liste">
 *   <svg gestioSegmentIcon aria-hidden="true">…</svg>
 * </gestio-segment>
 * ```
 *
 * Icône : projeter un élément portant l'attribut `gestioSegmentIcon` (avant le
 * libellé). Un segment sans texte visible doit recevoir `ariaLabel`.
 */
@Component({
  selector: 'gestio-segment',
  template: `<span class="gestio-segment__icon" aria-hidden="true"
      ><ng-content select="[gestioSegmentIcon]"
    /></span>
    @if (label()) {
      <span class="gestio-segment__label">{{ label() }}</span>
    }
    <ng-content />`,
  styleUrl: './segment.scss',
  hostDirectives: [GestioRipple],
  host: {
    role: 'radio',
    '[class]': '"gestio-segment gestio-segment--" + group.size()',
    '[class.gestio-segment--checked]': 'checked()',
    '[class.gestio-segment--stretch]': 'group.fullWidth()',
    '[attr.aria-checked]': 'checked()',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.tabindex]': 'group.tabbable() === this ? 0 : -1',
    '(click)': 'group.select(this)',
  },
})
export class GestioSegment {
  protected readonly group = inject(GESTIO_SEGMENTED_CONTROL);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Valeur transmise au groupe quand le segment est choisi (à renseigner). */
  readonly value = input<unknown>();
  /** Libellé visible (sinon, contenu projeté). */
  readonly label = input<string>();
  /** Nom accessible d'un segment sans texte visible (icône seule). */
  readonly ariaLabel = input<string>();
  /** Segment non sélectionnable, ignoré par les flèches. */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly isDisabled = computed(() => this.disabled() || this.group.groupDisabled());
  readonly checked = computed(() => this.group.isSelected(this.value()));

  /** Élément hôte (usage interne). */
  get element(): HTMLElement {
    return this.host.nativeElement;
  }

  focus(): void {
    this.host.nativeElement.focus();
  }
}
