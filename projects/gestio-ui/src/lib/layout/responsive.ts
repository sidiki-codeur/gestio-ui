import { BreakpointObserver } from '@angular/cdk/layout';
import { Service, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/** Points de rupture (largeur minimale en px), alignés sur les container queries des layouts. */
export const GESTIO_BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

export type GestioBreakpoint = keyof typeof GESTIO_BREAKPOINTS;
export type GestioBreakpointOrBase = 'base' | GestioBreakpoint;

/**
 * Valeur fixe ou valeur par point de rupture (approche mobile first : chaque
 * point hérite du précédent). Ex. `{ base: 1, md: 2, xl: 4 }`.
 */
export type GestioResponsive<T> = T | Partial<Record<GestioBreakpointOrBase, T>>;

/** Échelle d'espacement : correspond aux tokens `--gestio-space-*`. */
export type GestioSpace = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

/**
 * Signaux de largeur d'écran (`true` si la fenêtre est au moins aussi large
 * que le point de rupture). Toujours `false` côté serveur (SSR).
 *
 * ```ts
 * private readonly screen = inject(GestioBreakpoints);
 * readonly compact = computed(() => !this.screen.md());
 * ```
 */
@Service()
export class GestioBreakpoints {
  private readonly observer = inject(BreakpointObserver);

  readonly sm = this.matches(GESTIO_BREAKPOINTS.sm);
  readonly md = this.matches(GESTIO_BREAKPOINTS.md);
  readonly lg = this.matches(GESTIO_BREAKPOINTS.lg);
  readonly xl = this.matches(GESTIO_BREAKPOINTS.xl);

  /** Point de rupture courant le plus large atteint. */
  readonly current = computed<GestioBreakpointOrBase>(() => {
    if (this.xl()) return 'xl';
    if (this.lg()) return 'lg';
    if (this.md()) return 'md';
    if (this.sm()) return 'sm';
    return 'base';
  });

  private matches(minWidth: number): Signal<boolean> {
    return toSignal(
      this.observer.observe(`(min-width: ${minWidth}px)`).pipe(map((state) => state.matches)),
      { initialValue: false },
    );
  }
}
