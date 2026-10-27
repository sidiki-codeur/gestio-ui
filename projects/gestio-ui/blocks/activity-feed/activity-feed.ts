import {
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { GestioButton } from '@gestiolabs336/ui/button';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';

/** Couleur sémantique du repère d'un événement. */
export type GestioActivityVariant =
  'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/** Événement du flux d'activité. */
export interface GestioActivityItem {
  /** Identifiant stable (suivi de la liste). */
  readonly id: string | number;
  /** Auteur de l'action (« Claire Moreau », « Système »…). */
  readonly actor: string;
  /** Verbe ou phrase d'action (« a validé la facture »). */
  readonly action: string;
  /** Objet de l'action, mis en évidence (« F-2026-0142 »). */
  readonly target?: string;
  /** Date de l'événement : `Date`, chaîne ISO ou horodatage en millisecondes. */
  readonly date: Date | string | number;
  /** Détail facultatif affiché sous la phrase. */
  readonly description?: string;
  /** Couleur du repère. `neutral` par défaut. */
  readonly variant?: GestioActivityVariant;
}

/** Contexte du modèle personnalisé d'événement. */
export interface GestioActivityItemContext {
  $implicit: GestioActivityItem;
  /** Date relative formatée (« il y a 5 minutes »). */
  relative: string;
  /** Date complète formatée. */
  absolute: string;
}

/** Libellés du flux d'activité (internationalisation). */
export interface GestioActivityFeedLabels {
  /** Nom de la liste. */
  feed: string;
  /** Message en l'absence d'événement. */
  empty: string;
  loadMore: string;
  today: string;
  yesterday: string;
}

export const GESTIO_ACTIVITY_FEED_LABELS: GestioActivityFeedLabels = {
  feed: 'Activité récente',
  empty: 'Aucune activité pour le moment.',
  loadMore: 'Voir plus',
  today: 'Aujourd’hui',
  yesterday: 'Hier',
};

/**
 * Modèle personnalisé pour le contenu d'un événement (le repère et la date
 * restent gérés par le flux).
 *
 * ```html
 * <ng-template gestioActivityItem let-item let-relative="relative">…</ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[gestioActivityItem]' })
export class GestioActivityItemTemplate {
  readonly template = inject<TemplateRef<GestioActivityItemContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _directive: GestioActivityItemTemplate,
    context: unknown,
  ): context is GestioActivityItemContext {
    return true;
  }
}

interface FeedEntry {
  readonly item: GestioActivityItem;
  readonly iso: string;
  readonly relative: string;
  readonly absolute: string;
  readonly dayKey: string;
}

interface FeedGroup {
  readonly key: string;
  readonly id: string;
  readonly heading: string;
  readonly entries: FeedEntry[];
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Flux chronologique d'activité (journal d'audit, historique d'un dossier…).
 *
 * ```html
 * <gestio-activity-feed [items]="activite()" groupByDay [hasMore]="suite()" (loadMore)="charger()" />
 * ```
 *
 * Les événements sont affichés dans l'ordre fourni (du plus récent au plus
 * ancien en général). Avec `groupByDay`, les événements consécutifs d'un même
 * jour sont regroupés sous un intitulé (« Aujourd'hui », « Hier », date).
 */
@Component({
  selector: 'gestio-activity-feed',
  imports: [NgTemplateOutlet, GestioButton],
  templateUrl: './activity-feed.html',
  styleUrl: './activity-feed.scss',
  host: { class: 'gestio-activity-feed' },
})
export class GestioActivityFeed {
  /** Événements à afficher. */
  readonly items = input.required<readonly GestioActivityItem[]>();
  /**
   * Instant de référence des dates relatives. Par défaut, l'heure de création
   * du composant ; le fournir pour rafraîchir les durées ou pour des rendus
   * déterministes (SSR, tests).
   */
  readonly now = input<Date>(new Date());
  /** Langue des dates. */
  readonly locale = input('fr-FR');
  /** Regroupe les événements par jour. */
  readonly groupByDay = input(false, { transform: booleanAttribute });
  /** Affiche le bouton « Voir plus ». */
  readonly hasMore = input(false, { transform: booleanAttribute });
  /** Chargement de la suite en cours (bouton « Voir plus » occupé). */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Nom accessible de la liste (défaut : libellé `feed`). */
  readonly ariaLabel = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioActivityFeedLabels>>({});

  /** Demande le chargement d'événements plus anciens. */
  readonly loadMore = output<void>();

  protected readonly customTemplate = contentChild(GestioActivityItemTemplate);
  private readonly baseId = gestioUniqueId('gestio-activity-feed');

  protected readonly text = computed<GestioActivityFeedLabels>(() => ({
    ...GESTIO_ACTIVITY_FEED_LABELS,
    ...this.labels(),
  }));

  private readonly relativeFormat = computed(
    () => new Intl.RelativeTimeFormat(this.locale(), { numeric: 'auto' }),
  );
  private readonly absoluteFormat = computed(
    () => new Intl.DateTimeFormat(this.locale(), { dateStyle: 'long', timeStyle: 'short' }),
  );
  private readonly dayFormat = computed(
    () =>
      new Intl.DateTimeFormat(this.locale(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
  );

  protected readonly entries = computed<FeedEntry[]>(() =>
    this.items().map((item) => {
      const date = toDate(item.date);
      const valid = !Number.isNaN(date.getTime());
      return {
        item,
        iso: valid ? date.toISOString() : '',
        relative: valid ? this.relative(date) : '',
        absolute: valid ? this.absoluteFormat().format(date) : '',
        dayKey: valid ? dayKey(date) : '',
      };
    }),
  );

  protected readonly groups = computed<FeedGroup[]>(() => {
    const groups: FeedGroup[] = [];
    for (const entry of this.entries()) {
      const last = groups[groups.length - 1];
      if (last && last.key === entry.dayKey) {
        last.entries.push(entry);
      } else {
        groups.push({
          key: entry.dayKey,
          id: `${this.baseId}-day-${groups.length}`,
          heading: this.dayHeading(toDate(entry.item.date)),
          entries: [entry],
        });
      }
    }
    return groups;
  });

  protected context(entry: FeedEntry): GestioActivityItemContext {
    return { $implicit: entry.item, relative: entry.relative, absolute: entry.absolute };
  }

  private relative(date: Date): string {
    const diff = date.getTime() - this.now().getTime();
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

  private dayHeading(date: Date): string {
    if (Number.isNaN(date.getTime())) return '';
    const now = this.now();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const offset = Math.round((today.getTime() - day.getTime()) / DAY);
    if (offset === 0) return this.text().today;
    if (offset === 1) return this.text().yesterday;
    return this.dayFormat().format(date);
  }
}

/** Flux d'activité et directive de modèle personnalisé. */
export const GESTIO_ACTIVITY_FEED_IMPORTS = [
  GestioActivityFeed,
  GestioActivityItemTemplate,
] as const;
