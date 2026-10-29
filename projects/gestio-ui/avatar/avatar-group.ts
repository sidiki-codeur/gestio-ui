import {
  Component,
  computed,
  contentChildren,
  forwardRef,
  input,
  numberAttribute,
} from '@angular/core';
import { GestioAvatar, GestioAvatarSize } from './avatar';
import { ɵGESTIO_AVATAR_GROUP, ɵGestioAvatarGroupHost } from './avatar-group-host';

/** Libellés du groupe d'avatars (internationalisation). */
export interface GestioAvatarGroupLabels {
  /** Texte lu pour la pastille « +1 ». */
  moreOne: string;
  /** Texte lu pour la pastille « +N » ; `{count}` est remplacé. */
  more: string;
}

export const GESTIO_AVATAR_GROUP_LABELS: GestioAvatarGroupLabels = {
  moreOne: 'Et 1 autre personne',
  more: 'Et {count} autres personnes',
};

const optionalNumber = (value: unknown): number | undefined =>
  value === null || value === undefined || value === '' ? undefined : numberAttribute(value);

/**
 * Groupe d'avatars qui se chevauchent, avec pastille « +N » au-delà de `max`.
 *
 * ```html
 * <gestio-avatar-group [max]="3" size="sm" ariaLabel="Équipe projet">
 *   @for (membre of equipe(); track membre.id) {
 *     <gestio-avatar [name]="membre.nom" [src]="membre.photo" />
 *   }
 * </gestio-avatar-group>
 * ```
 *
 * Les avatars au-delà de `max` sont masqués et comptés dans la pastille, dont
 * le texte accessible est « Et N autres personnes ». `total` permet d'afficher
 * un nombre de personnes supérieur aux avatars fournis (pagination serveur).
 */
@Component({
  selector: 'gestio-avatar-group',
  template: `
    <ng-content />
    @if (extra() > 0) {
      <span class="gestio-avatar-group__more" [class]="'gestio-avatar-group__more--' + pillSize()">
        <span aria-hidden="true">+{{ extraText() }}</span>
        <span class="gestio-avatar-group__sr-only">{{ extraLabel() }}</span>
      </span>
    }
  `,
  styleUrl: './avatar-group.scss',
  providers: [{ provide: ɵGESTIO_AVATAR_GROUP, useExisting: forwardRef(() => GestioAvatarGroup) }],
  host: {
    class: 'gestio-avatar-group',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel() ?? null',
  },
})
export class GestioAvatarGroup implements ɵGestioAvatarGroupHost {
  /** Nombre maximal d'avatars affichés ; les suivants sont résumés par « +N ». */
  readonly max = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** Nombre total de personnes, si supérieur au nombre d'avatars fournis. */
  readonly total = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** Taille imposée à tous les avatars du groupe. */
  readonly size = input<GestioAvatarSize>();
  /** Nom accessible du groupe (ex. « Participants »). */
  readonly ariaLabel = input<string>();
  /** Surcharge partielle des libellés. */
  readonly labels = input<Partial<GestioAvatarGroupLabels>>({});
  /** Langue du formatage du nombre de la pastille. */
  readonly locale = input('fr-FR');

  private readonly avatars = contentChildren(GestioAvatar);

  private readonly visibleCount = computed(() => {
    const count = this.avatars().length;
    const max = this.max();
    return max === undefined || Number.isNaN(max) ? count : Math.min(count, Math.max(0, max));
  });

  protected readonly extra = computed(() =>
    Math.max(0, (this.total() ?? this.avatars().length) - this.visibleCount()),
  );

  protected readonly pillSize = computed(() => this.size() ?? 'md');

  protected readonly extraText = computed(() =>
    new Intl.NumberFormat(this.locale()).format(this.extra()),
  );

  protected readonly extraLabel = computed(() => {
    const text = { ...GESTIO_AVATAR_GROUP_LABELS, ...this.labels() };
    return this.extra() === 1 ? text.moreOne : text.more.replace('{count}', this.extraText());
  });

  /** @docs-private */
  isHidden(avatar: GestioAvatar): boolean {
    return this.avatars().indexOf(avatar) >= this.visibleCount();
  }
}
