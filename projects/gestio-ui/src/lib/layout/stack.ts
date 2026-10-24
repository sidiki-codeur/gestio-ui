import { Component, booleanAttribute, computed, input } from '@angular/core';
import { GestioResponsive, GestioSpace } from './responsive';
import { resolveResponsive, responsiveVars, spaceToken } from './responsive-utils';

export type GestioStackDirection = 'row' | 'column';
export type GestioStackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type GestioStackJustify = 'start' | 'center' | 'end' | 'between';

const ALIGN: Record<GestioStackAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const JUSTIFY: Record<GestioStackJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
};

/**
 * Empile ses enfants verticalement ou horizontalement, avec un espacement
 * issu des tokens. La direction et l'espacement peuvent varier selon la
 * largeur **du conteneur** (container queries) :
 *
 * ```html
 * <!-- En colonne quand c'est étroit, en ligne à partir de 768 px de large -->
 * <gestio-stack [direction]="{ base: 'column', md: 'row' }" [gap]="4">…</gestio-stack>
 * ```
 */
@Component({
  selector: 'gestio-stack',
  template: '<div class="gestio-stack__inner"><ng-content /></div>',
  styleUrl: './stack.scss',
  host: {
    class: 'gestio-stack',
    '[style]': 'vars()',
  },
})
export class GestioStack {
  readonly direction = input<GestioResponsive<GestioStackDirection>>('column');
  readonly gap = input<GestioResponsive<GestioSpace>>(4);
  /** Alignement sur l'axe secondaire. */
  readonly align = input<GestioStackAlign>('stretch');
  /** Répartition sur l'axe principal. */
  readonly justify = input<GestioStackJustify>('start');
  /** Passe à la ligne quand la place manque (direction row). */
  readonly wrap = input(false, { transform: booleanAttribute });

  protected readonly vars = computed(() => ({
    ...responsiveVars(
      '--_dir',
      resolveResponsive<GestioStackDirection>(this.direction(), 'column'),
    ),
    ...responsiveVars('--_gap', resolveResponsive<GestioSpace>(this.gap(), 4), spaceToken),
    '--_align': ALIGN[this.align()],
    '--_justify': JUSTIFY[this.justify()],
    '--_wrap': this.wrap() ? 'wrap' : 'nowrap',
  }));
}
