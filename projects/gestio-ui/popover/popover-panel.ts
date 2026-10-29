import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, signal } from '@angular/core';

/** Côté du déclencheur où s'affiche la fenêtre. */
export type GestioPopoverPosition = 'top' | 'bottom' | 'start' | 'end';

/** Contexte du `<ng-template>` : `let-close="close"`. */
export interface GestioPopoverContext {
  /** Ferme la fenêtre et rend le focus au déclencheur. */
  close: () => void;
}

/** Fenêtre affichée par `gestioPopoverTrigger` (usage interne). */
@Component({
  selector: 'gestio-popover-panel',
  imports: [NgTemplateOutlet],
  template: `
    @if (arrow()) {
      <span class="gestio-popover__arrow" aria-hidden="true"></span>
    }
    <div class="gestio-popover__body">
      <ng-container [ngTemplateOutlet]="template()" [ngTemplateOutletContext]="context()" />
    </div>
  `,
  styleUrl: './popover-panel.scss',
  host: {
    class: 'gestio-popover',
    role: 'dialog',
    tabindex: '-1',
    '[id]': 'id()',
    '[attr.aria-modal]': 'modal() ? "true" : null',
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.aria-labelledby]': 'ariaLabelledBy() ?? null',
    '[attr.data-placement]': 'placement()',
    '[class.gestio-popover--arrow]': 'arrow()',
    '[attr.data-align]': 'align()',
    '[style.--gestio-popover-arrow-inset.px]': 'arrowInset()',
  },
})
export class GestioPopoverPanel {
  readonly id = signal('');
  readonly template = signal<TemplateRef<GestioPopoverContext> | null>(null);
  readonly context = signal<GestioPopoverContext>({ close: () => {} });
  /** Côté physique effectif (après repli et prise en compte du sens de lecture). */
  readonly placement = signal<'top' | 'bottom' | 'left' | 'right'>('bottom');
  readonly arrow = signal(true);
  readonly align = signal<'center' | 'start' | 'end'>('center');
  /** Distance entre le bord aligné et la pointe de la flèche (moitié du déclencheur). */
  readonly arrowInset = signal(0);
  readonly modal = signal(false);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
}
