import { Component, booleanAttribute, computed, input, numberAttribute } from '@angular/core';
import { GestioRating } from './rating';

/** Libellés de l'avis (internationalisation). */
export interface GestioReviewLabels {
  /** Mention d'achat vérifié. */
  verified: string;
}

export const GESTIO_REVIEW_LABELS: GestioReviewLabels = {
  verified: 'Achat vérifié',
};

/**
 * Avis client : auteur, date, note en étoiles, titre et commentaire projeté.
 *
 * ```html
 * <gestio-review author="Claire Moreau" date="2026-10-12" [rating]="4" heading="Très pratique">
 *   Livraison rapide, produit conforme.
 * </gestio-review>
 * ```
 *
 * Sans `avatar`, les initiales de l'auteur sont affichées.
 */
@Component({
  selector: 'gestio-review',
  imports: [GestioRating],
  template: `
    <header class="gestio-review__header">
      @if (avatar()) {
        <img class="gestio-review__avatar" [src]="avatar()" alt="" width="40" height="40" />
      } @else {
        <span class="gestio-review__avatar gestio-review__avatar--initials" aria-hidden="true">{{
          initials()
        }}</span>
      }
      <div class="gestio-review__meta">
        <p class="gestio-review__author">{{ author() }}</p>
        <p class="gestio-review__sub">
          @if (isoDate(); as iso) {
            <time [attr.datetime]="iso">{{ formattedDate() }}</time>
          }
          @if (verified()) {
            <span class="gestio-review__verified">
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M3.5 8.5l3 3 6-7" />
              </svg>
              {{ text().verified }}
            </span>
          }
        </p>
      </div>
    </header>
    <gestio-rating
      class="gestio-review__rating"
      readonly
      size="sm"
      [value]="rating()"
      [locale]="locale()"
    />
    @if (heading()) {
      <p class="gestio-review__title" role="heading" [attr.aria-level]="headingLevel()">
        {{ heading() }}
      </p>
    }
    <div class="gestio-review__body"><ng-content /></div>
  `,
  styleUrl: './review.scss',
  host: { class: 'gestio-review', role: 'article' },
})
export class GestioReview {
  /** Nom de l'auteur. */
  readonly author = input.required<string>();
  /** Note attribuée. */
  readonly rating = input.required({ transform: numberAttribute });
  /** Date de l'avis (`Date` ou chaîne ISO). */
  readonly date = input<Date | string | null>(null);
  /** Titre de l'avis. */
  readonly heading = input<string>();
  /** Niveau de titre (`aria-level`) du titre de l'avis. */
  readonly headingLevel = input(3, { transform: numberAttribute });
  /** URL de la photo de l'auteur ; sinon ses initiales. */
  readonly avatar = input<string>();
  /** Affiche la mention « Achat vérifié ». */
  readonly verified = input(false, { transform: booleanAttribute });
  /** Locale de formatage de la date. */
  readonly locale = input('fr-FR');
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioReviewLabels>>({});

  protected readonly text = computed<GestioReviewLabels>(() => ({
    ...GESTIO_REVIEW_LABELS,
    ...this.labels(),
  }));

  protected readonly initials = computed(() =>
    this.author()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join(''),
  );

  private readonly parsedDate = computed(() => {
    const raw = this.date();
    if (raw === null || raw === '') return null;
    // « AAAA-MM-JJ » est lu en heure locale (et non UTC) pour ne pas décaler le jour.
    const day = typeof raw === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw) : null;
    const date =
      raw instanceof Date
        ? raw
        : day
          ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
          : new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  });

  protected readonly isoDate = computed(() => {
    const date = this.parsedDate();
    if (!date) return null;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  });

  protected readonly formattedDate = computed(() => {
    const date = this.parsedDate();
    return date ? new Intl.DateTimeFormat(this.locale(), { dateStyle: 'long' }).format(date) : '';
  });
}
