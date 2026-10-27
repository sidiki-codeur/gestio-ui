import { Component, signal } from '@angular/core';
import {
  GESTIO_ACTIVITY_FEED_IMPORTS,
  GestioActivityItem,
} from '@gestiolabs336/ui/blocks/activity-feed';
import { GestioBadge } from '@gestiolabs336/ui/badge';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Construit des événements datés relativement à `now`. */
function sampleItems(now: number): GestioActivityItem[] {
  return [
    {
      id: 1,
      actor: 'Claire Moreau',
      action: 'a validé la facture',
      target: 'F-2026-0142',
      date: now - 4 * 60_000,
      variant: 'success',
    },
    {
      id: 2,
      actor: 'Système',
      action: 'a envoyé une relance à',
      target: 'Atelier Moreau SARL',
      date: now - 2 * HOUR,
      description: 'Deuxième relance automatique — échéance dépassée de 15 jours.',
      variant: 'warning',
    },
    {
      id: 3,
      actor: 'Hugo Martin',
      action: 'a créé le client',
      target: 'Boulangerie Petit',
      date: now - DAY - 3 * HOUR,
      variant: 'primary',
    },
    {
      id: 4,
      actor: 'Hugo Martin',
      action: 'a modifié les conditions de paiement de',
      target: 'Boulangerie Petit',
      date: now - DAY - 4 * HOUR,
    },
    {
      id: 5,
      actor: 'Inès Garnier',
      action: 'a annulé le devis',
      target: 'D-2026-0087',
      date: now - 4 * DAY,
      variant: 'danger',
    },
  ];
}

function olderItems(now: number): GestioActivityItem[] {
  return [
    {
      id: 6,
      actor: 'Inès Garnier',
      action: 'a importé',
      target: '214 contacts',
      date: now - 9 * DAY,
      variant: 'info',
    },
    {
      id: 7,
      actor: 'Claire Moreau',
      action: 'a invité',
      target: 'Hugo Martin',
      date: now - 12 * DAY,
    },
  ];
}

@Component({
  selector: 'sc-activity-feed-page',
  imports: [GESTIO_ACTIVITY_FEED_IMPORTS, GestioBadge, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Flux d’activité" eyebrow="Blocs">
      <code>gestio-activity-feed</code> affiche un historique chronologique : journal d’audit, suivi
      d’un dossier client, activité d’une équipe. Les dates relatives utilisent
      <code>Intl.RelativeTimeFormat</code>.
    </sc-page-header>

    <sc-example
      heading="Regroupé par jour, avec chargement de la suite"
      description="Les événements consécutifs d’un même jour sont regroupés. « Voir plus » ajoute des événements plus anciens."
      [code]="groupedCode"
      stacked
    >
      <gestio-activity-feed
        ariaLabel="Activité du compte"
        groupByDay
        [items]="items()"
        [now]="now"
        [hasMore]="hasMore()"
        [loading]="loadingMore()"
        (loadMore)="loadMore()"
      />
    </sc-example>

    <sc-example
      heading="Modèle personnalisé"
      description="Un ng-template gestioActivityItem remplace la phrase ; le repère et la date restent gérés par le flux."
      [code]="customCode"
      stacked
    >
      <gestio-activity-feed ariaLabel="Historique de la facture" [items]="invoiceItems" [now]="now">
        <ng-template gestioActivityItem let-item>
          <p style="margin: 0">
            {{ item.action }}
            @if (item.target) {
              <gestio-badge size="sm" [variant]="item.variant ?? 'neutral'">{{
                item.target
              }}</gestio-badge>
            }
          </p>
          <p class="sc-muted" style="margin: 0">par {{ item.actor }}</p>
        </ng-template>
      </gestio-activity-feed>
    </sc-example>

    <sc-example heading="État vide" [code]="emptyCode">
      <gestio-activity-feed [items]="[]" />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées et sorties de gestio-activity-feed" [rows]="api" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          Les durées sont calculées par rapport à <code>now</code>, figé par défaut à la création du
          composant. Pour qu’elles évoluent, passez un signal rafraîchi périodiquement. Les
          événements ne sont pas triés : fournissez-les dans l’ordre d’affichage.
        </p>
      </div>
    </section>
  `,
})
export class ActivityFeedPage {
  protected readonly now = new Date();
  protected readonly items = signal(sampleItems(this.now.getTime()));
  protected readonly hasMore = signal(true);
  protected readonly loadingMore = signal(false);

  protected readonly invoiceItems: GestioActivityItem[] = [
    {
      id: 'paid',
      actor: 'Stripe',
      action: 'Paiement reçu',
      target: 'Payée',
      date: this.now.getTime() - 20 * 60_000,
      variant: 'success',
    },
    {
      id: 'sent',
      actor: 'Claire Moreau',
      action: 'Facture envoyée',
      target: 'Envoyée',
      date: this.now.getTime() - 3 * DAY,
      variant: 'info',
    },
    {
      id: 'created',
      actor: 'Claire Moreau',
      action: 'Facture créée',
      target: 'Brouillon',
      date: this.now.getTime() - 3 * DAY - HOUR,
    },
  ];

  protected loadMore(): void {
    this.loadingMore.set(true);
    setTimeout(() => {
      this.items.update((items) => [...items, ...olderItems(this.now.getTime())]);
      this.loadingMore.set(false);
      this.hasMore.set(false);
    }, 800);
  }

  protected readonly groupedCode = `<gestio-activity-feed
  ariaLabel="Activité du compte"
  groupByDay
  [items]="activite()"
  [hasMore]="suite()"
  [loading]="chargement()"
  (loadMore)="chargerPlus()"
/>

activite = signal<GestioActivityItem[]>([
  { id: 1, actor: 'Claire Moreau', action: 'a validé la facture', target: 'F-2026-0142',
    date: '2026-10-26T13:55:00Z', variant: 'success' },
  …
]);`;

  protected readonly customCode = `<gestio-activity-feed [items]="historique()">
  <ng-template gestioActivityItem let-item>
    <p>{{ item.action }} <gestio-badge size="sm">{{ item.target }}</gestio-badge></p>
    <p>par {{ item.actor }}</p>
  </ng-template>
</gestio-activity-feed>`;

  protected readonly emptyCode = `<gestio-activity-feed [items]="[]" />`;

  protected readonly api: ApiRow[] = [
    {
      name: 'items',
      type: 'readonly GestioActivityItem[]',
      description:
        'Événements { id, actor, action, target?, date, description?, variant? } (obligatoire).',
    },
    {
      name: 'now',
      type: 'Date',
      default: 'création du composant',
      description: 'Instant de référence des dates relatives.',
    },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Langue des dates.' },
    {
      name: 'groupByDay',
      type: 'boolean',
      default: 'false',
      description: 'Regroupe par jour (Aujourd’hui, Hier, date).',
    },
    {
      name: 'hasMore',
      type: 'boolean',
      default: 'false',
      description: 'Affiche le bouton « Voir plus ».',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Bouton « Voir plus » en chargement.',
    },
    { name: 'ariaLabel', type: 'string', description: 'Nom de la liste.' },
    {
      name: 'labels',
      type: 'Partial<GestioActivityFeedLabels>',
      default: '{}',
      description: 'Libellés (feed, empty, loadMore, today, yesterday).',
    },
    { name: '(loadMore)', type: 'void', description: 'Demande d’événements plus anciens.' },
  ];
}
