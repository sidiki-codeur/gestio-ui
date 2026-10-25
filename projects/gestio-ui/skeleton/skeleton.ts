import { Component, computed, input, numberAttribute } from '@angular/core';

export type GestioSkeletonShape = 'text' | 'circle' | 'rect';

/**
 * Bloc de substitution affiché pendant un chargement. Purement visuel
 * (`aria-hidden`) : signaler le chargement sur le conteneur
 * (`aria-busy="true"`) ou avec un `gestio-spinner`.
 *
 * ```html
 * <div aria-busy="true">
 *   <gestio-skeleton shape="circle" width="2.5rem" />
 *   <gestio-skeleton [lines]="3" />
 * </div>
 * ```
 */
@Component({
  selector: 'gestio-skeleton',
  template: `
    @for (line of lineList(); track line) {
      <span class="gestio-skeleton__bone" [class.is-last]="$last && lineList().length > 1"></span>
    }
  `,
  styleUrl: './skeleton.scss',
  host: {
    'aria-hidden': 'true',
    '[class]': "'gestio-skeleton gestio-skeleton--' + shape()",
    '[style.--_width]': 'width() ?? null',
    '[style.--_height]': 'height() ?? null',
  },
})
export class GestioSkeleton {
  readonly shape = input<GestioSkeletonShape>('text');
  /** Largeur CSS (ex. `'12rem'`, `'60%'`). Par défaut : toute la largeur (`circle` : 2,5 rem). */
  readonly width = input<string>();
  /** Hauteur CSS. Par défaut : une ligne de texte (`rect` : 6 rem, `circle` : égale à la largeur). */
  readonly height = input<string>();
  /** Nombre de lignes (forme `text`) ; la dernière est plus courte. */
  readonly lines = input(1, { transform: numberAttribute });

  protected readonly lineList = computed(() =>
    this.shape() === 'text'
      ? Array.from({ length: Math.max(1, Math.floor(this.lines() || 1)) }, (_, i) => i)
      : [0],
  );
}
