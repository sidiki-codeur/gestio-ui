import { Component, computed, signal } from '@angular/core';
import {
  GestioNotification,
  GestioNotificationCenter,
} from '@gestiolabs336/ui/blocks/notification-center';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ApiRow, ApiTable } from '../../../shared/api-table';
import { Example } from '../../../shared/example';
import { PageHeader } from '../../../shared/page-header';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function sample(now: Date): GestioNotification[] {
  const at = (offset: number) => new Date(now.getTime() - offset);
  return [
    {
      id: 1,
      title: 'Facture F-2026-0142 payée',
      body: 'Atelier Moreau a réglé 1 250,00 € par virement.',
      date: at(4 * MINUTE),
      read: false,
      tone: 'success',
    },
    {
      id: 2,
      title: 'Stock bas : cartouches d’encre A4',
      body: 'Il reste 3 unités en entrepôt (seuil : 10).',
      date: at(52 * MINUTE),
      read: false,
      tone: 'warning',
      href: '#stock',
    },
    {
      id: 3,
      title: 'Échec de la synchronisation bancaire',
      body: 'La connexion à la Banque du Nord a expiré.',
      date: at(2 * HOUR),
      read: false,
      tone: 'danger',
    },
    {
      id: 4,
      title: 'Claire Moreau vous a mentionné',
      body: '« Peux-tu valider le devis D-0388 ? »',
      date: at(DAY + 3 * HOUR),
      read: true,
      tone: 'info',
    },
    {
      id: 5,
      title: 'Export comptable terminé',
      date: at(3 * DAY),
      read: true,
    },
  ];
}

@Component({
  selector: 'sc-notification-center-page',
  imports: [GestioNotificationCenter, GestioButton, Example, ApiTable, PageHeader],
  template: `
    <sc-page-header heading="Centre de notifications" eyebrow="Blocs">
      <code>gestio-notification-center</code> réunit une cloche avec le nombre de notifications non
      lues et un panneau de notifications : groupes « Aujourd’hui » et « Plus tôt », dates
      relatives, filtre des non lues, marquage comme lu.
    </sc-page-header>

    <sc-example
      heading="Barre d’application"
      description="Le composant n’altère pas la liste : l’application met à jour notifications en réponse aux sorties."
      [code]="basicCode"
      stacked
    >
      <div class="nc-appbar">
        <strong>Gestio Compta</strong>
        <gestio-notification-center
          [notifications]="notifications()"
          [now]="now"
          [loading]="loading()"
          (markRead)="markRead($event)"
          (markAllRead)="markAllRead()"
          (select)="lastSelected.set($event.title)"
        />
      </div>
      <p class="sc-muted" aria-live="polite">
        @if (lastSelected()) {
          Notification ouverte : {{ lastSelected() }}
        }
      </p>
      <div class="sc-row">
        <button gestioButton variant="outline" size="sm" (click)="push()">
          Simuler une notification
        </button>
        <button gestioButton variant="outline" size="sm" (click)="loading.set(!loading())">
          {{ loading() ? 'Arrêter le chargement' : 'Simuler un chargement' }}
        </button>
        <button gestioButton variant="ghost" size="sm" (click)="reset()">Réinitialiser</button>
      </div>
      <p>{{ unread() }} non lue(s) sur {{ notifications().length }}.</p>
    </sc-example>

    <sc-example
      heading="Libellés et position"
      description="Textes traduits avec labels et locale, panneau aligné à gauche."
      [code]="labelsCode"
    >
      <gestio-notification-center
        [notifications]="notifications()"
        [now]="now"
        locale="en-GB"
        placement="bottom-start"
        [labels]="english"
        (markRead)="markRead($event)"
        (markAllRead)="markAllRead()"
      />
    </sc-example>

    <section class="sc-section" aria-labelledby="api">
      <h2 id="api">Paramètres</h2>
      <sc-api-table caption="Entrées de gestio-notification-center" [rows]="api" />
      <sc-api-table caption="Sorties de gestio-notification-center" [rows]="outputs" />
      <div class="sc-note" role="note">
        <strong>À savoir</strong>
        <p>
          La cloche annonce le nombre de non lues dans son nom (« Notifications, 3 non lues ») ; la
          pastille est décorative. Le panneau est un dialogue : le focus y est piégé, Échap, le
          bouton de fermeture ou le choix d’une notification le ferment et rendent le focus à la
          cloche. Fournir <code>now</code> pour rafraîchir les durées relatives.
        </p>
      </div>
    </section>
  `,
  styles: `
    .nc-appbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      box-sizing: border-box;
      padding: var(--gestio-space-2) var(--gestio-space-4);
      border: var(--gestio-border-width) solid var(--gestio-color-border);
      border-radius: var(--gestio-radius-lg);
      background: var(--gestio-color-surface);
    }
  `,
})
export class NotificationCenterPage {
  protected readonly now = new Date();
  protected readonly notifications = signal<GestioNotification[]>(sample(this.now));
  protected readonly loading = signal(false);
  protected readonly lastSelected = signal('');
  protected readonly unread = computed(() => this.notifications().filter((n) => !n.read).length);
  private nextId = 100;

  protected readonly english = {
    title: 'Notifications',
    triggerUnreadOne: 'Notifications, {count} unread',
    triggerUnreadOther: 'Notifications, {count} unread',
    markAllRead: 'Mark all as read',
    markRead: 'Mark “{title}” as read',
    unread: 'Unread:',
    filter: 'Filter notifications',
    filterAll: 'All',
    filterUnread: 'Unread',
    today: 'Today',
    earlier: 'Earlier',
    empty: 'No notifications',
    emptyDescription: 'You’re all caught up.',
    emptyUnread: 'No unread notifications',
    loading: 'Loading notifications',
    close: 'Close notifications',
  };

  protected markRead(item: GestioNotification): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
    );
  }

  protected markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  protected push(): void {
    const id = this.nextId++;
    this.notifications.update((list) => [
      {
        id,
        title: `Nouvelle commande C-${id}`,
        body: 'Boulangerie Petit a passé une commande de 340,00 €.',
        date: new Date(this.now.getTime() - 30_000),
        read: false,
        tone: 'info',
      },
      ...list,
    ]);
  }

  protected reset(): void {
    this.notifications.set(sample(this.now));
    this.lastSelected.set('');
  }

  protected readonly basicCode = `// imports: [GestioNotificationCenter]
notifications = signal<GestioNotification[]>([
  { id: 1, title: 'Facture F-2026-0142 payée', body: 'Atelier Moreau a réglé 1 250,00 €.',
    date: new Date('2026-10-28T13:55:00'), read: false, tone: 'success' },
  { id: 2, title: 'Stock bas : cartouches A4', date: new Date('2026-10-28T09:00:00'),
    read: false, tone: 'warning', href: '/stock' },
]);

<gestio-notification-center
  [notifications]="notifications()"
  [loading]="chargement()"
  (markRead)="marquerLue($event)"
  (markAllRead)="toutMarquerLu()"
  (select)="ouvrir($event)"
/>`;

  protected readonly labelsCode = `<gestio-notification-center
  [notifications]="notifications()"
  locale="en-GB"
  placement="bottom-start"
  [labels]="{ title: 'Notifications', triggerUnreadOther: 'Notifications, {count} unread', … }"
/>`;

  protected readonly api: ApiRow[] = [
    {
      name: 'notifications',
      type: 'readonly GestioNotification[]',
      description:
        'Notifications { id, title, body?, date, read, tone?, href? }, dans l’ordre voulu (obligatoire).',
    },
    { name: 'open', type: 'boolean (model)', default: 'false', description: 'Panneau ouvert.' },
    {
      name: 'filter',
      type: `'all' | 'unread' (model)`,
      default: `'all'`,
      description: 'Filtre de la liste.',
    },
    {
      name: 'now',
      type: 'Date',
      default: 'création du composant',
      description: 'Référence des dates relatives et du groupe « Aujourd’hui ».',
    },
    { name: 'locale', type: 'string', default: `'fr-FR'`, description: 'Langue des dates.' },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Indicateur de chargement à la place de la liste.',
    },
    {
      name: 'markReadOnSelect',
      type: 'boolean',
      default: 'true',
      description: 'Émet aussi markRead au choix d’une notification non lue.',
    },
    {
      name: 'placement',
      type: `'bottom-end' | 'bottom-start'`,
      default: `'bottom-end'`,
      description: 'Position préférée du panneau.',
    },
    {
      name: 'labels',
      type: 'Partial<GestioNotificationCenterLabels>',
      default: '{}',
      description: 'Textes du panneau et nom de la cloche.',
    },
  ];

  protected readonly outputs: ApiRow[] = [
    { name: 'markRead', type: 'GestioNotification', description: 'Marquer une notification lue.' },
    { name: 'markAllRead', type: 'void', description: 'Tout marquer comme lu.' },
    {
      name: 'select',
      type: 'GestioNotification',
      description: 'Notification choisie ; le panneau se ferme.',
    },
    { name: 'openChange', type: 'boolean', description: 'Ouverture ou fermeture du panneau.' },
    { name: 'filterChange', type: `'all' | 'unread'`, description: 'Changement de filtre.' },
  ];
}
