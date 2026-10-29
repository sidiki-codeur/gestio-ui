import { Component, signal } from '@angular/core';
import { GestioButton } from '@gestiolabs336/ui/button';
import { GestioCheckbox } from '@gestiolabs336/ui/checkbox';
import { GestioPopoverTrigger } from '@gestiolabs336/ui/popover';
import { ApiRow, ApiTable } from '../../shared/api-table';
import { Example } from '../../shared/example';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'sc-popover-page',
  imports: [GestioPopoverTrigger, GestioButton, GestioCheckbox, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Fenêtre surgissante" eyebrow="Composants">
      La directive <code>gestioPopoverTrigger</code> ouvre un contenu interactif ancré à un bouton
      (motif ARIA « Dialog » non modal) : filtres, aperçu, formulaire rapide. Le focus entre dans la
      fenêtre, <kbd>Échap</kbd> ou un clic à l’extérieur la ferment et le focus revient au
      déclencheur.
    </sc-page-header>

    <sc-example
      heading="Filtres d’une liste de factures"
      description="Cochez des filtres puis appliquez : close() est disponible dans le contexte du template."
      [code]="filtersCode"
      stacked
    >
      <div>
        <button
          gestioButton
          variant="outline"
          [gestioPopoverTrigger]="filters"
          popoverAriaLabelledBy="sc-popover-filters-title"
          popoverAlign="start"
        >
          Filtres
          @if (activeFilters().length) {
            ({{ activeFilters().length }})
          }
        </button>
      </div>
      <ng-template #filters let-close="close">
        <div class="sc-popover-form">
          <p id="sc-popover-filters-title" class="sc-popover-form__title">Filtrer les factures</p>
          <gestio-checkbox label="En retard de paiement" [(checked)]="draft.late" />
          <gestio-checkbox label="Envoyées ce mois-ci" [(checked)]="draft.thisMonth" />
          <gestio-checkbox label="Montant supérieur à 1 000 €" [(checked)]="draft.large" />
          <div class="sc-popover-form__actions">
            <button gestioButton variant="ghost" size="sm" (click)="close()">Annuler</button>
            <button gestioButton size="sm" (click)="apply(); close()">Appliquer</button>
          </div>
        </div>
      </ng-template>
      <p class="sc-result" aria-live="polite">
        Filtres actifs : <strong>{{ activeFilters().join(', ') || 'aucun' }}</strong>
      </p>
    </sc-example>

    <sc-example
      heading="Positions et flèche"
      description="La position préférée est conservée si la place le permet, sinon le côté opposé est utilisé."
      [code]="positionsCode"
    >
      @for (position of positions; track position.value) {
        <button
          gestioButton
          variant="secondary"
          [gestioPopoverTrigger]="info"
          [popoverPosition]="position.value"
          [popoverAriaLabel]="'Aide : ' + position.label"
        >
          {{ position.label }}
        </button>
      }
      <ng-template #info>
        <p class="sc-popover-text">
          Le délai de paiement par défaut est de 30 jours fin de mois. Il peut être modifié dans les
          paramètres de facturation.
        </p>
      </ng-template>
    </sc-example>

    <sc-example
      heading="Ouverture pilotée"
      description="[(popoverOpen)] synchronise l’état ; (opened) et (closed) signalent les changements."
      [code]="controlledCode"
    >
      <button
        gestioButton
        variant="outline"
        [gestioPopoverTrigger]="contact"
        popoverAriaLabel="Contact du client"
        [popoverArrow]="false"
        [(popoverOpen)]="contactOpen"
        (opened)="log.set('opened')"
        (closed)="log.set('closed')"
      >
        Atelier Moreau SARL
      </button>
      <ng-template #contact>
        <dl class="sc-popover-contact">
          <dt>Contact</dt>
          <dd>Claire Moreau</dd>
          <dt>Téléphone</dt>
          <dd><a href="tel:+33478000000">04 78 00 00 00</a></dd>
          <dt>E-mail</dt>
          <dd><a href="mailto:compta@atelier-moreau.fr">compta&#64;atelier-moreau.fr</a></dd>
        </dl>
      </ng-template>
      <p class="sc-result" aria-live="polite">
        popoverOpen : <strong>{{ contactOpen() }}</strong> · dernier événement :
        <strong>{{ log() ?? 'aucun' }}</strong>
      </p>
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestioPopoverTrigger" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Donnez toujours un nom à la fenêtre (<code>popoverAriaLabel</code> ou
          <code>popoverAriaLabelledBy</code>). Pour une simple info-bulle non interactive, préférez
          <code>gestioTooltip</code> ; pour une liste d’actions, <code>gestioMenuTriggerFor</code>.
          Méthodes (<code>#p="gestioPopoverTrigger"</code>) : <code>open()</code>,
          <code>close()</code>, <code>toggle()</code>, <code>isOpen()</code>.
        </p>
      </div>
    </section>
  `,
  styles: `
    .sc-popover-form {
      display: flex;
      flex-direction: column;
      gap: var(--gestio-space-2);
      min-width: 16rem;
    }
    .sc-popover-form__title {
      margin: 0 0 var(--gestio-space-1);
      font-weight: var(--gestio-font-weight-semibold);
    }
    .sc-popover-form__actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--gestio-space-2);
      margin-top: var(--gestio-space-2);
    }
    .sc-popover-text {
      max-width: 16rem;
      margin: 0;
      font-size: var(--gestio-font-size-sm);
    }
    .sc-popover-contact {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--gestio-space-1) var(--gestio-space-3);
      margin: 0;
      font-size: var(--gestio-font-size-sm);
    }
    .sc-popover-contact dt {
      color: var(--gestio-color-text-muted);
    }
    .sc-popover-contact dd {
      margin: 0;
    }
  `,
})
export class PopoverPage {
  protected readonly draft = {
    late: signal(true),
    thisMonth: signal(false),
    large: signal(false),
  };
  private readonly applied = signal<string[]>(['En retard']);
  protected readonly activeFilters = this.applied.asReadonly();

  protected readonly positions = [
    { value: 'top', label: 'Haut' },
    { value: 'bottom', label: 'Bas' },
    { value: 'start', label: 'Début' },
    { value: 'end', label: 'Fin' },
  ] as const;

  protected readonly contactOpen = signal(false);
  protected readonly log = signal<'opened' | 'closed' | null>(null);

  protected apply(): void {
    const labels: string[] = [];
    if (this.draft.late()) labels.push('En retard');
    if (this.draft.thisMonth()) labels.push('Ce mois-ci');
    if (this.draft.large()) labels.push('> 1 000 €');
    this.applied.set(labels);
  }

  protected readonly filtersCode = `<button gestioButton variant="outline" [gestioPopoverTrigger]="filters"
        popoverAriaLabelledBy="filters-title" popoverAlign="start">Filtres</button>

<ng-template #filters let-close="close">
  <p id="filters-title">Filtrer les factures</p>
  <gestio-checkbox label="En retard de paiement" [(checked)]="late" />
  <gestio-checkbox label="Envoyées ce mois-ci" [(checked)]="thisMonth" />
  <button gestioButton variant="ghost" size="sm" (click)="close()">Annuler</button>
  <button gestioButton size="sm" (click)="apply(); close()">Appliquer</button>
</ng-template>`;

  protected readonly positionsCode = `<button gestioButton [gestioPopoverTrigger]="info" popoverPosition="end"
        popoverAriaLabel="Aide : délai de paiement">Fin</button>
<ng-template #info>
  <p>Le délai de paiement par défaut est de 30 jours fin de mois…</p>
</ng-template>`;

  protected readonly controlledCode = `<button gestioButton variant="outline" [gestioPopoverTrigger]="contact"
        popoverAriaLabel="Contact du client" [popoverArrow]="false"
        [(popoverOpen)]="contactOpen" (opened)="onOpened()" (closed)="onClosed()">
  Atelier Moreau SARL
</button>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'gestioPopoverTrigger',
      type: 'TemplateRef<GestioPopoverContext>',
      description: 'Contenu de la fenêtre ; contexte : let-close="close".',
    },
    {
      name: 'popoverPosition',
      type: `'top' | 'bottom' | 'start' | 'end'`,
      default: `'bottom'`,
      description: 'Côté préféré, repli automatique si la place manque.',
    },
    {
      name: 'popoverAlign',
      type: `'center' | 'start' | 'end'`,
      default: `'center'`,
      description: 'Alignement sur le déclencheur (positions top et bottom).',
    },
    {
      name: 'popoverArrow',
      type: 'boolean',
      default: 'true',
      description: 'Flèche pointant vers le déclencheur.',
    },
    {
      name: 'popoverAriaLabel',
      type: 'string',
      description: 'Nom accessible de la fenêtre.',
    },
    {
      name: 'popoverAriaLabelledBy',
      type: 'string',
      description: 'Id d’un titre du contenu servant de nom accessible.',
    },
    {
      name: 'popoverAutoFocus',
      type: `'first-tabbable' | 'dialog' | string`,
      default: `'first-tabbable'`,
      description: 'Élément focalisé à l’ouverture (ou sélecteur CSS).',
    },
    {
      name: 'popoverModal',
      type: 'boolean',
      default: 'false',
      description: 'Pose aria-modal="true".',
    },
    {
      name: 'popoverDisabled',
      type: 'boolean',
      default: 'false',
      description: 'Empêche l’ouverture.',
    },
    {
      name: 'popoverOpen',
      type: 'model<boolean>',
      default: 'false',
      description: 'État ouvert ; [(popoverOpen)].',
    },
    { name: '(opened)', type: 'void', description: 'Émis après l’ouverture.' },
    { name: '(closed)', type: 'void', description: 'Émis après la fermeture.' },
  ];
}
