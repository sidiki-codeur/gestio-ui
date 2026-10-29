import { Component, signal } from '@angular/core';
import { GestioBadge, GestioBadgeVariant } from '@gestiolabs336/ui/badge';
import {
  GestioKanban,
  GestioKanbanCard,
  GestioKanbanColumn,
  GestioKanbanMoveEvent,
} from '@gestiolabs336/ui/blocks/kanban';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

interface Ticket {
  readonly id: string;
  readonly title: string;
  readonly customer: string;
  readonly priority: 'Haute' | 'Normale' | 'Basse';
}

const PRIORITY: Record<Ticket['priority'], GestioBadgeVariant> = {
  Haute: 'danger',
  Normale: 'info',
  Basse: 'neutral',
};

@Component({
  selector: 'sc-kanban-page',
  imports: [GestioKanban, GestioKanbanCard, GestioBadge, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Tableau Kanban" eyebrow="Blocs">
      <code>gestio-kanban</code> organise des cartes en colonnes, déplaçables à la souris, au
      toucher et au clavier (Maj + flèches ou bouton « Déplacer »), avec annonces pour les lecteurs
      d’écran et limite de travail en cours (WIP).
    </sc-page-header>

    <sc-example
      heading="Suivi des tickets du support"
      description="La colonne « En cours » est limitée à 3 tickets : au-delà, elle est signalée."
      [code]="ticketsCode"
      stacked
    >
      <gestio-kanban [(columns)]="columns" (moved)="lastMove.set(describe($event))">
        <ng-template gestioKanbanCard [gestioKanbanCardOf]="columns()" let-ticket>
          <div class="sc-ticket">
            <span class="sc-ticket__id">{{ ticket.id }}</span>
            <strong>{{ ticket.title }}</strong>
            <span class="sc-muted">{{ ticket.customer }}</span>
            <gestio-badge size="sm" [variant]="priority[ticket.priority]">
              {{ ticket.priority }}
            </gestio-badge>
          </div>
        </ng-template>
      </gestio-kanban>
      <p class="sc-result">Dernier déplacement : {{ lastMove() }}</p>
    </sc-example>

    <sc-example
      heading="Limite WIP bloquante"
      description="Avec enforceWip, une colonne pleine refuse les cartes (glisser-déposer, clavier et menu)."
      [code]="wipCode"
      stacked
    >
      <gestio-kanban [(columns)]="pipeline" enforceWip />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-kanban" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>Clavier</strong>
        <p>
          Une seule tabulation entre dans le tableau. Flèches : carte voisine ; Début/Fin : première
          ou dernière carte de la colonne ; Maj + haut/bas : réordonner ; Maj + gauche/droite :
          changer de colonne. Le bouton « Déplacer » de chaque carte offre les mêmes actions sans
          glisser (WCAG 2.5.7). Chaque déplacement est annoncé.
        </p>
      </div>
    </section>
  `,
  styles: `
    .sc-ticket {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--gestio-space-1);
    }

    .sc-ticket__id {
      color: var(--gestio-color-text-muted);
      font-family: var(--gestio-font-mono);
      font-size: var(--gestio-font-size-xs);
    }
  `,
})
export class KanbanPage {
  protected readonly priority = PRIORITY;
  protected readonly lastMove = signal('aucun');

  protected readonly columns = signal<readonly GestioKanbanColumn<Ticket>[]>([
    {
      id: 'new',
      title: 'Nouveaux',
      items: [
        {
          id: 'SUP-1042',
          title: 'Facture en double',
          customer: 'Boulangerie Martin',
          priority: 'Haute',
        },
        {
          id: 'SUP-1045',
          title: 'Export comptable vide',
          customer: 'Garage Leroy',
          priority: 'Normale',
        },
      ],
    },
    {
      id: 'doing',
      title: 'En cours',
      wipLimit: 3,
      items: [
        {
          id: 'SUP-1031',
          title: 'TVA mal calculée',
          customer: 'Cabinet Dubois',
          priority: 'Haute',
        },
        {
          id: 'SUP-1036',
          title: 'Ajout d’un utilisateur',
          customer: 'Atelier Rousseau',
          priority: 'Basse',
        },
        {
          id: 'SUP-1038',
          title: 'Relance automatique inactive',
          customer: 'Hôtel du Parc',
          priority: 'Normale',
        },
      ],
    },
    {
      id: 'waiting',
      title: 'En attente client',
      items: [
        {
          id: 'SUP-1027',
          title: 'RIB à confirmer',
          customer: 'Pharmacie Centrale',
          priority: 'Normale',
        },
      ],
    },
    { id: 'done', title: 'Résolus', items: [] },
  ]);

  protected readonly pipeline = signal<readonly GestioKanbanColumn<string>[]>([
    { id: 'quote', title: 'Devis envoyés', items: ['Devis D-210', 'Devis D-214', 'Devis D-215'] },
    { id: 'nego', title: 'Négociation', wipLimit: 2, items: ['Devis D-198', 'Devis D-203'] },
    { id: 'won', title: 'Signés', items: ['Devis D-187'] },
  ]);

  protected describe(event: GestioKanbanMoveEvent<Ticket>): string {
    return `${event.item.id} : ${event.from} → ${event.to} (position ${event.currentIndex + 1})`;
  }

  protected readonly ticketsCode = `<gestio-kanban [(columns)]="columns" (moved)="api.updateStatus($event)">
  <ng-template gestioKanbanCard [gestioKanbanCardOf]="columns()" let-ticket>
    <strong>{{ ticket.title }}</strong>
    <span>{{ ticket.customer }}</span>
  </ng-template>
</gestio-kanban>

columns = signal<readonly GestioKanbanColumn<Ticket>[]>([
  { id: 'new', title: 'Nouveaux', items: [...] },
  { id: 'doing', title: 'En cours', wipLimit: 3, items: [...] },
]);`;

  protected readonly wipCode = `<gestio-kanban [(columns)]="pipeline" enforceWip />`;

  protected readonly api: ApiRow[] = [
    {
      name: 'columns',
      type: 'readonly GestioKanbanColumn<T>[]',
      description: 'Colonnes { id, title, items, wipLimit? } ; model, liaison [(columns)].',
    },
    {
      name: 'itemLabel',
      type: '(item: T) => string',
      default: 'title ?? name ?? label',
      description: 'Nom d’une carte (annonces, bouton Déplacer, rendu par défaut).',
    },
    {
      name: 'trackBy',
      type: '(item: T) => unknown',
      default: 'identité',
      description: 'Identité d’une carte.',
    },
    {
      name: 'enforceWip',
      type: 'boolean',
      default: 'false',
      description: 'Refuse l’entrée dans une colonne pleine.',
    },
    {
      name: 'headingLevel',
      type: 'number',
      default: '3',
      description: 'Niveau de titre des colonnes.',
    },
    {
      name: 'labels',
      type: 'Partial<GestioKanbanLabels>',
      default: '{}',
      description: 'Textes (instructions, annonces, menu…).',
    },
    {
      name: '(moved)',
      type: 'GestioKanbanMoveEvent<T>',
      description: '{ item, from, to, previousIndex, currentIndex } après un déplacement.',
    },
  ];
}
