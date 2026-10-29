import { NgTemplateOutlet } from '@angular/common';
import { Component, booleanAttribute, computed, input, model, output } from '@angular/core';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioRipple } from '@gestiolabs336/ui/ripple';

export type GestioChipVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/** Libellés de la puce (internationalisation). */
export interface GestioChipLabels {
  /** Nom du bouton de suppression ; `{label}` est remplacé par le texte de la puce. */
  remove: string;
}

export const GESTIO_CHIP_LABELS: GestioChipLabels = {
  remove: 'Retirer {label}',
};

/**
 * Puce compacte : mot-clé, filtre actif, destinataire…
 *
 * ```html
 * <gestio-chip variant="info">Facturation</gestio-chip>
 * <gestio-chip removable (removed)="retirer(tag)">{{ tag }}</gestio-chip>
 * <gestio-chip [(selected)]="enRetard">En retard</gestio-chip>
 * ```
 *
 * - `removable` ajoute un bouton nommé « Retirer {texte de la puce} » ;
 *   Suppr ou Retour arrière sur une puce de filtre émettent aussi `removed`.
 * - Dès que `selected` est lié (`true` ou `false`), la puce devient un bouton
 *   bascule (`aria-pressed`) : puce de filtre.
 */
@Component({
  selector: 'gestio-chip',
  imports: [NgTemplateOutlet, GestioRipple],
  template: `
    <ng-template #content>
      <span class="gestio-chip__label" [id]="labelId"><ng-content /></span>
    </ng-template>

    @if (toggleable()) {
      <button
        type="button"
        class="gestio-chip__toggle"
        gestioRipple
        [attr.aria-pressed]="selected() ? 'true' : 'false'"
        [disabled]="disabled()"
        (click)="toggle()"
        (keydown)="handleKeydown($event)"
      >
        <svg class="gestio-chip__check" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    } @else {
      <ng-container [ngTemplateOutlet]="content" />
    }

    @if (removable()) {
      <span hidden [id]="removeBeforeId">{{ removeParts()[0] }}</span>
      <span hidden [id]="removeAfterId">{{ removeParts()[1] }}</span>
      <button
        type="button"
        class="gestio-chip__remove"
        [attr.aria-labelledby]="removeLabelledBy()"
        [disabled]="disabled()"
        (click)="remove()"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
        </svg>
      </button>
    }
  `,
  styleUrl: './chip.scss',
  host: {
    class: 'gestio-chip',
    '[class]': 'modifierClasses()',
    '[class.is-selected]': 'selected() === true',
    '[class.is-toggle]': 'toggleable()',
    '[class.is-removable]': 'removable()',
    '[class.is-disabled]': 'disabled()',
  },
})
export class GestioChip {
  /** Couleur sémantique. */
  readonly variant = input<GestioChipVariant>('neutral');
  /** Affiche le bouton de suppression. */
  readonly removable = input(false, { transform: booleanAttribute });
  /** État d'une puce de filtre ; `undefined` (défaut) : puce non interactive. */
  readonly selected = model<boolean | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioChipLabels>>({});

  /** Émis au clic sur le bouton de suppression (ou Suppr / Retour arrière sur une puce de filtre). */
  readonly removed = output<void>();

  private readonly id = gestioUniqueId('gestio-chip');
  protected readonly labelId = `${this.id}-label`;
  protected readonly removeBeforeId = `${this.id}-remove-before`;
  protected readonly removeAfterId = `${this.id}-remove-after`;

  protected readonly toggleable = computed(() => this.selected() !== undefined);
  protected readonly modifierClasses = computed(() => `gestio-chip--${this.variant()}`);

  /** Texte avant et après `{label}` : le nom est composé par `aria-labelledby` avec le contenu projeté. */
  protected readonly removeParts = computed(() => {
    const template = { ...GESTIO_CHIP_LABELS, ...this.labels() }.remove;
    const [before, ...rest] = template.split('{label}');
    return [before.trim(), rest.join('{label}').trim()] as const;
  });

  protected readonly removeLabelledBy = computed(() => {
    const [before, after] = this.removeParts();
    return [before && this.removeBeforeId, this.labelId, after && this.removeAfterId]
      .filter(Boolean)
      .join(' ');
  });

  protected toggle(): void {
    this.selected.update((selected) => !selected);
  }

  protected remove(): void {
    if (this.disabled()) return;
    this.removed.emit();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (this.removable() && (event.key === 'Delete' || event.key === 'Backspace')) {
      event.preventDefault();
      this.remove();
    }
  }
}
