import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { ɵGESTIO_AVATAR_GROUP } from './avatar-group-host';

export type GestioAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type GestioAvatarShape = 'circle' | 'square';
export type GestioAvatarStatus = 'online' | 'away' | 'busy' | 'offline';

/** Libellés de l'avatar (internationalisation) : textes lus pour chaque statut. */
export interface GestioAvatarLabels {
  online: string;
  away: string;
  busy: string;
  offline: string;
}

export const GESTIO_AVATAR_LABELS: GestioAvatarLabels = {
  online: 'En ligne',
  away: 'Absent',
  busy: 'Occupé',
  offline: 'Hors ligne',
};

/** Teintes « subtle » des tokens, choisies de façon déterministe à partir du nom. */
const TONES = ['primary', 'info', 'success', 'warning', 'danger', 'neutral'] as const;

/** Initiales : première lettre du premier et du dernier mot (« Jean-Pierre Martin » → « JM »). */
export function gestioAvatarInitials(name: string | null | undefined, locale = 'fr-FR'): string {
  const words = (name ?? '')
    .trim()
    .split(/[\s-]+/)
    .filter((word) => /\p{L}|\p{N}/u.test(word));
  if (!words.length) return '';
  const firstLetter = (word: string) => Array.from(word.replace(/^[^\p{L}\p{N}]+/u, ''))[0] ?? '';
  const letters =
    words.length === 1 ? firstLetter(words[0]) : firstLetter(words[0]) + firstLetter(words.at(-1)!);
  return letters.toLocaleUpperCase(locale);
}

function hash(value: string): number {
  let result = 0;
  for (const char of value) result = (Math.imul(31, result) + char.codePointAt(0)!) | 0;
  return Math.abs(result);
}

/**
 * Avatar d'une personne ou d'une entité : image, à défaut initiales calculées
 * depuis `name`, à défaut icône générique.
 *
 * ```html
 * <gestio-avatar name="Claire Moreau" src="/photos/cmoreau.jpg" status="online" />
 * <gestio-avatar name="Atelier Moreau SARL" shape="square" size="lg" />
 * ```
 *
 * Si l'image ne se charge pas, l'avatar bascule automatiquement sur les
 * initiales. La couleur de fond est déduite du nom (toujours la même pour un
 * même nom). Le statut est signalé par une pastille de forme distincte et un
 * texte lu par les lecteurs d'écran.
 */
@Component({
  selector: 'gestio-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
  host: {
    class: 'gestio-avatar',
    '[class]': 'modifierClasses()',
    '[class.gestio-avatar--grouped]': '!!group',
    '[hidden]': 'hiddenInGroup()',
  },
})
export class GestioAvatar {
  protected readonly group = inject(ɵGESTIO_AVATAR_GROUP, { optional: true });

  /** Nom de la personne : texte alternatif de l'image, source des initiales et de la couleur. */
  readonly name = input<string>();
  /** URL de l'image. Sans image ou en cas d'erreur de chargement, les initiales s'affichent. */
  readonly src = input<string | null>();
  /** Taille ; dans un `gestio-avatar-group` qui fixe `size`, celle du groupe s'applique. */
  readonly size = input<GestioAvatarSize>('md');
  /** Forme : rond (personne) ou carré arrondi (organisation). */
  readonly shape = input<GestioAvatarShape>('circle');
  /** Statut de présence, signalé visuellement et pour les lecteurs d'écran. */
  readonly status = input<GestioAvatarStatus>();
  /** Surcharge partielle des libellés de statut. */
  readonly labels = input<Partial<GestioAvatarLabels>>({});
  /** Langue utilisée pour mettre les initiales en majuscules. */
  readonly locale = input('fr-FR');

  /** Remis à `false` à chaque nouvelle URL. */
  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });

  protected readonly label = computed(() => this.name()?.trim() ?? '');
  protected readonly initials = computed(() => gestioAvatarInitials(this.name(), this.locale()));
  protected readonly showImage = computed(() => !!this.src() && !this.failed());

  protected readonly statusLabel = computed(() => {
    const status = this.status();
    return status ? { ...GESTIO_AVATAR_LABELS, ...this.labels() }[status] : '';
  });

  private readonly effectiveSize = computed(() => this.group?.size() ?? this.size());

  protected readonly hiddenInGroup = computed(() => this.group?.isHidden(this) ?? false);

  protected readonly modifierClasses = computed(() => {
    const name = this.label().toLocaleLowerCase(this.locale());
    const tone = name ? TONES[hash(name) % TONES.length] : 'neutral';
    return [
      `gestio-avatar--${this.effectiveSize()}`,
      `gestio-avatar--${this.shape()}`,
      `gestio-avatar--${tone}`,
    ].join(' ');
  });

  protected onError(): void {
    this.failed.set(true);
  }
}
