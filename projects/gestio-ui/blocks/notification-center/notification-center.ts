import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DOCUMENT,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { GestioEmptyState } from '@gestiolabs336/ui/blocks/empty-state';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioSpinner } from '@gestiolabs336/ui/spinner';

/** Couleur sémantique de l'icône d'une notification. */
export type GestioNotificationTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Filtre de la liste : toutes les notifications ou seulement les non lues. */
export type GestioNotificationFilter = 'all' | 'unread';

/** Position préférée du panneau par rapport à la cloche. */
export type GestioNotificationCenterPlacement = 'bottom-end' | 'bottom-start';

/** Notification affichée dans le centre de notifications. */
export interface GestioNotification {
  /** Identifiant stable (suivi de la liste). */
  readonly id: string | number;
  /** Titre court (« Facture F-2026-0142 payée »). */
  readonly title: string;
  /** Détail facultatif, sous le titre. */
  readonly body?: string;
  /** Date de la notification. */
  readonly date: Date;
  /** Déjà lue. */
  readonly read: boolean;
  /** Couleur de l'icône. `neutral` par défaut. */
  readonly tone?: GestioNotificationTone;
  /** Lien de destination : la notification devient un lien `<a href>`. */
  readonly href?: string;
}

/** Libellés du centre de notifications (internationalisation). */
export interface GestioNotificationCenterLabels {
  /** Titre du panneau et nom de la cloche sans notification non lue. */
  title: string;
  /** Nom de la cloche avec une notification non lue ; `{count}` est remplacé. */
  triggerUnreadOne: string;
  /** Nom de la cloche avec plusieurs notifications non lues ; `{count}` est remplacé. */
  triggerUnreadOther: string;
  markAllRead: string;
  /** Bouton d'une notification ; `{title}` est remplacé. */
  markRead: string;
  /** Texte lu par les lecteurs d'écran devant une notification non lue. */
  unread: string;
  /** Nom du groupe de filtres. */
  filter: string;
  filterAll: string;
  filterUnread: string;
  today: string;
  earlier: string;
  empty: string;
  emptyDescription: string;
  emptyUnread: string;
  loading: string;
  close: string;
}

export const GESTIO_NOTIFICATION_CENTER_LABELS: GestioNotificationCenterLabels = {
  title: 'Notifications',
  triggerUnreadOne: 'Notifications, {count} non lue',
  triggerUnreadOther: 'Notifications, {count} non lues',
  markAllRead: 'Tout marquer comme lu',
  markRead: 'Marquer « {title} » comme lue',
  unread: 'Non lue :',
  filter: 'Filtrer les notifications',
  filterAll: 'Toutes',
  filterUnread: 'Non lues',
  today: 'Aujourd’hui',
  earlier: 'Plus tôt',
  empty: 'Aucune notification',
  emptyDescription: 'Vous êtes à jour.',
  emptyUnread: 'Aucune notification non lue',
  loading: 'Chargement des notifications',
  close: 'Fermer les notifications',
};

const OFFSET = 8;
const BELOW_END: ConnectedPosition = {
  originX: 'end',
  originY: 'bottom',
  overlayX: 'end',
  overlayY: 'top',
  offsetY: OFFSET,
};
const BELOW_START: ConnectedPosition = { ...BELOW_END, originX: 'start', overlayX: 'start' };
const ABOVE_END: ConnectedPosition = {
  originX: 'end',
  originY: 'top',
  overlayX: 'end',
  overlayY: 'bottom',
  offsetY: -OFFSET,
};
const ABOVE_START: ConnectedPosition = { ...ABOVE_END, originX: 'start', overlayX: 'start' };

const POSITIONS: Record<GestioNotificationCenterPlacement, ConnectedPosition[]> = {
  'bottom-end': [BELOW_END, BELOW_START, ABOVE_END, ABOVE_START],
  'bottom-start': [BELOW_START, BELOW_END, ABOVE_START, ABOVE_END],
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Entrée de la liste, avec ses dates formatées. */
interface NotificationEntry {
  readonly item: GestioNotification;
  readonly iso: string;
  readonly relative: string;
  readonly absolute: string;
}

interface NotificationGroup {
  readonly id: string;
  readonly heading: string;
  readonly entries: NotificationEntry[];
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Centre de notifications : une cloche avec le nombre de notifications non
 * lues, qui ouvre un panneau (`role="dialog"`) listant les notifications.
 *
 * ```html
 * <gestio-notification-center
 *   [notifications]="notifications()"
 *   (select)="ouvrir($event)"
 *   (markRead)="marquerLue($event)"
 *   (markAllRead)="toutMarquerLu()"
 * />
 * ```
 *
 * - Le nom de la cloche annonce le nombre de non lues (« Notifications, 3 non lues »).
 * - Le focus est piégé dans le panneau ; Échap ou un choix le ferme et rend le
 *   focus à la cloche.
 * - Les notifications sont groupées en « Aujourd'hui » et « Plus tôt », dans
 *   l'ordre fourni (du plus récent au plus ancien en général). Les dates
 *   relatives sont calculées par rapport à `now`.
 * - Le composant n'altère pas la liste : mettre à jour `notifications` en
 *   réponse à `markRead`, `markAllRead` et `select`.
 */
@Component({
  selector: 'gestio-notification-center',
  imports: [
    CdkOverlayOrigin,
    CdkConnectedOverlay,
    CdkTrapFocus,
    NgTemplateOutlet,
    GestioButton,
    GestioEmptyState,
    GestioSpinner,
  ],
  templateUrl: './notification-center.html',
  styleUrl: './notification-center.scss',
  host: { class: 'gestio-notification-center' },
})
export class GestioNotificationCenter {
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  /** Notifications à afficher, dans l'ordre voulu. */
  readonly notifications = input.required<readonly GestioNotification[]>();
  /** Panneau ouvert. */
  readonly open = model(false);
  /** Filtre de la liste. */
  readonly filter = model<GestioNotificationFilter>('all');
  /**
   * Instant de référence des dates relatives et du groupe « Aujourd'hui ». Par
   * défaut, l'heure de création du composant ; le fournir pour rafraîchir les
   * durées ou pour des rendus déterministes (SSR, tests).
   */
  readonly now = input<Date>(new Date());
  /** Langue des dates. */
  readonly locale = input('fr-FR');
  /** Chargement en cours : un indicateur remplace la liste. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Émet aussi `markRead` quand une notification non lue est choisie. */
  readonly markReadOnSelect = input(true, { transform: booleanAttribute });
  /** Position préférée du panneau (repli automatique si la place manque). */
  readonly placement = input<GestioNotificationCenterPlacement>('bottom-end');
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioNotificationCenterLabels>>({});

  /** Une notification doit être marquée comme lue. */
  readonly markRead = output<GestioNotification>();
  /** Toutes les notifications doivent être marquées comme lues. */
  readonly markAllRead = output<void>();
  /** Une notification a été choisie (le panneau se ferme). */
  readonly select = output<GestioNotification>();

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly baseId = gestioUniqueId('gestio-notification-center');
  protected readonly panelId = `${this.baseId}-panel`;
  protected readonly titleId = `${this.baseId}-title`;

  protected readonly text = computed<GestioNotificationCenterLabels>(() => ({
    ...GESTIO_NOTIFICATION_CENTER_LABELS,
    ...this.labels(),
  }));

  protected readonly positions = computed(() => POSITIONS[this.placement()]);

  protected readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length,
  );

  protected readonly badgeText = computed(() => {
    const count = this.unreadCount();
    return count > 99 ? '99+' : String(count);
  });

  protected readonly triggerLabel = computed(() => {
    const count = this.unreadCount();
    const text = this.text();
    if (!count) return text.title;
    const one = new Intl.PluralRules(this.locale()).select(count) === 'one';
    return interpolate(one ? text.triggerUnreadOne : text.triggerUnreadOther, {
      count: new Intl.NumberFormat(this.locale()).format(count),
    });
  });

  private readonly relativeFormat = computed(
    () => new Intl.RelativeTimeFormat(this.locale(), { numeric: 'auto' }),
  );
  private readonly absoluteFormat = computed(
    () => new Intl.DateTimeFormat(this.locale(), { dateStyle: 'long', timeStyle: 'short' }),
  );

  protected readonly groups = computed<NotificationGroup[]>(() => {
    const now = this.now();
    const unreadOnly = this.filter() === 'unread';
    const today: NotificationEntry[] = [];
    const earlier: NotificationEntry[] = [];
    for (const item of this.notifications()) {
      if (unreadOnly && item.read) continue;
      const date = item.date instanceof Date ? item.date : new Date(item.date);
      const valid = !Number.isNaN(date.getTime());
      const entry: NotificationEntry = {
        item,
        iso: valid ? date.toISOString() : '',
        relative: valid ? this.relative(date, now) : '',
        absolute: valid ? this.absoluteFormat().format(date) : '',
      };
      (valid && sameDay(date, now) ? today : earlier).push(entry);
    }
    const text = this.text();
    const groups: NotificationGroup[] = [];
    if (today.length)
      groups.push({ id: `${this.baseId}-today`, heading: text.today, entries: today });
    if (earlier.length) {
      groups.push({ id: `${this.baseId}-earlier`, heading: text.earlier, entries: earlier });
    }
    return groups;
  });

  /** Ouvre le panneau. */
  show(): void {
    this.open.set(true);
  }

  /** Ferme le panneau et rend le focus à la cloche s'il était dans le panneau. */
  hide(): void {
    if (!this.open()) return;
    const panel = this.panel()?.nativeElement;
    const active = this.document.activeElement;
    const restore = !!panel && !!active && (panel === active || panel.contains(active));
    this.open.set(false);
    if (restore) this.trigger().nativeElement.focus();
  }

  protected toggle(): void {
    if (this.open()) this.hide();
    else this.show();
  }

  protected onAttach(): void {
    // Focus initial sur le panneau : le titre est annoncé, Tab mène aux actions.
    afterNextRender(() => this.panel()?.nativeElement.focus(), { injector: this.injector });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.hide();
    }
  }

  protected onOutsideClick(): void {
    this.hide();
  }

  /** Fermeture par le CDK (navigation, destruction). */
  protected onDetach(): void {
    if (this.open()) this.open.set(false);
  }

  protected setFilter(filter: GestioNotificationFilter): void {
    this.filter.set(filter);
  }

  protected onMarkAllRead(): void {
    // Le bouton va disparaître : le focus revient au panneau.
    this.panel()?.nativeElement.focus();
    this.markAllRead.emit();
  }

  protected onMarkRead(item: GestioNotification, row: HTMLElement): void {
    // Le bouton va disparaître : le focus est déplacé avant la mise à jour de la liste.
    const action = row.querySelector<HTMLElement>('.gestio-notification-center__action');
    if (this.filter() === 'unread' || !action) this.panel()?.nativeElement.focus();
    else action.focus();
    this.markRead.emit(item);
  }

  protected onSelect(item: GestioNotification): void {
    if (!item.read && this.markReadOnSelect()) this.markRead.emit(item);
    this.select.emit(item);
    this.hide();
  }

  protected markReadLabel(item: GestioNotification): string {
    return interpolate(this.text().markRead, { title: item.title });
  }

  private relative(date: Date, now: Date): string {
    const diff = date.getTime() - now.getTime();
    const abs = Math.abs(diff);
    const format = this.relativeFormat();
    if (abs < MINUTE) return format.format(Math.round(diff / SECOND), 'second');
    if (abs < HOUR) return format.format(Math.round(diff / MINUTE), 'minute');
    if (abs < DAY) return format.format(Math.round(diff / HOUR), 'hour');
    if (abs < 7 * DAY) return format.format(Math.round(diff / DAY), 'day');
    if (abs < 30 * DAY) return format.format(Math.round(diff / (7 * DAY)), 'week');
    if (abs < 365 * DAY) return format.format(Math.round(diff / (30 * DAY)), 'month');
    return format.format(Math.round(diff / (365 * DAY)), 'year');
  }
}
