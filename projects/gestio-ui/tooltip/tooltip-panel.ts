import { Component, signal } from '@angular/core';

/** Bulle affichée par `gestioTooltip` (usage interne). */
@Component({
  selector: 'gestio-tooltip-panel',
  template: '{{ message() }}',
  styleUrl: './tooltip-panel.scss',
  host: {
    class: 'gestio-tooltip',
    // Le texte est déjà exposé par aria-describedby sur le déclencheur.
    'aria-hidden': 'true',
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
  },
})
export class GestioTooltipPanel {
  readonly message = signal('');
  readonly hovered = signal(false);
}
