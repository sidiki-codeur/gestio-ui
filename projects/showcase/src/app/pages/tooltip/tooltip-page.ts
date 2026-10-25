import { Component } from '@angular/core';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioTooltip } from '@gestiolabs336/ui/tooltip';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-tooltip-page',
  imports: [GestioTooltip, GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Info-bulle" eyebrow="Composants">
      Complément textuel court, au survol et au focus clavier. Le texte est relié par
      <code>aria-describedby</code>. Échap masque la bulle, le pointeur peut la survoler (WCAG
      1.4.13).
    </sc-page-header>

    <sc-example
      heading="Boutons icône"
      description="Le bouton garde son aria-label : la bulle le complète."
      [code]="iconCode"
    >
      <button
        gestioButton
        variant="outline"
        aria-label="Exporter"
        gestioTooltip="Exporter la liste en CSV"
      >
        <svg gestioButtonIcon viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button
        gestioButton
        variant="outline"
        aria-label="Imprimer"
        gestioTooltip="Imprimer au format A4"
        gestioTooltipPlacement="bottom"
      >
        <svg gestioButtonIcon viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            d="M4.5 6V2.5h7V6M4.5 11.5h-2v-5h11v5h-2M4.5 9.5h7v4h-7z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </sc-example>

    <sc-example heading="Positions" [code]="placementCode">
      @for (placement of placements; track placement) {
        <button
          gestioButton
          variant="secondary"
          [gestioTooltip]="'Bulle côté ' + placement"
          [gestioTooltipPlacement]="placement"
        >
          {{ placement }}
        </button>
      }
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de l’info-bulle" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Invisible sur écran tactile : n’y placez jamais une information indispensable. Un bouton
          <code>disabled</code> ne reçoit pas les événements souris ; placez la directive sur un
          élément parent.
        </p>
      </div>
    </section>
  `,
})
export class TooltipPage {
  protected readonly placements = ['top', 'bottom', 'start', 'end'] as const;

  protected readonly iconCode = `<button gestioButton variant="outline" aria-label="Exporter"
  gestioTooltip="Exporter la liste en CSV">
  <svg gestioButtonIcon aria-hidden="true">…</svg>
</button>

// imports: [GestioTooltip, GestioButton]`;

  protected readonly placementCode = `<button gestioButton gestioTooltip="Bulle côté end" gestioTooltipPlacement="end">end</button>`;

  protected readonly api: ApiRow[] = [
    { name: 'gestioTooltip', type: 'string', description: 'Texte ; vide = aucune bulle.' },
    {
      name: 'gestioTooltipPlacement',
      type: "'top' | 'bottom' | 'start' | 'end'",
      default: "'top'",
      description: 'Côté préféré, repli automatique.',
    },
    {
      name: 'gestioTooltipDisabled',
      type: 'boolean',
      default: 'false',
      description: 'Désactive la bulle et la description.',
    },
  ];
}
