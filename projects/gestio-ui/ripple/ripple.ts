import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';

/** Durées de l'onde, en millisecondes (Material 3 : expansion puis fondu). */
const GROW_DURATION = 400;
const FADE_DURATION = 150;
const EASING = 'cubic-bezier(0.2, 0, 0, 1)';

/**
 * Onde de pression (ripple) façon Material 3.
 *
 * Inactive par défaut : elle ne s'affiche que si la propriété CSS
 * `--gestio-ripple` vaut `on` sur l'élément, ce que fait le style Material
 * (`gestio-material.css` + `data-gestio-design="material"`). Elle est aussi
 * ignorée si l'élément est désactivé (`disabled`, `aria-disabled="true"`) ou
 * si l'utilisateur a demandé moins d'animations.
 *
 * Déjà appliquée à `gestioButton`, `gestioSocialButton` et `gestioMenuItem`.
 * Sur un autre élément, il doit être positionné (`position: relative`).
 *
 * ```html
 * <div class="tuile" gestioRipple>…</div>
 * ```
 *
 * L'onde est créée par script et animée avec l'API Web Animations : aucun
 * style global n'est nécessaire. Elle reprend la couleur du texte
 * (`currentColor`) avec l'opacité `--gestio-ripple-opacity` (0,12 par défaut).
 */
@Directive({
  selector: '[gestioRipple]',
  exportAs: 'gestioRipple',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class GestioRipple {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  /** Interrompt les écouteurs des ondes en cours à la destruction. */
  private readonly listeners = new AbortController();

  /** Désactive l'onde, même en style Material. */
  readonly gestioRippleDisabled = input(false, { transform: booleanAttribute });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.listeners.abort());
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || !this.isEnabled()) return;
    this.launch(event.clientX, event.clientY);
  }

  /**
   * Lance une onde depuis un point de l'écran (coordonnées client), ou depuis
   * le centre de l'élément si aucun point n'est donné. Elle disparaît au
   * relâchement du pointeur.
   */
  launch(clientX?: number, clientY?: number): void {
    const element = this.host.nativeElement;
    if (typeof element.animate !== 'function') return;

    const rect = element.getBoundingClientRect();
    const x = clientX === undefined ? rect.width / 2 : clientX - rect.left;
    const y = clientY === undefined ? rect.height / 2 : clientY - rect.top;
    const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));

    // Conteneur qui suit la forme de l'élément et rogne l'onde.
    const container = this.document.createElement('span');
    container.className = 'gestio-ripple';
    Object.assign(container.style, {
      position: 'absolute',
      inset: '0',
      overflow: 'hidden',
      borderRadius: 'inherit',
      pointerEvents: 'none',
    });
    container.setAttribute('aria-hidden', 'true');

    const wave = this.document.createElement('span');
    Object.assign(wave.style, {
      position: 'absolute',
      left: `${x - radius}px`,
      top: `${y - radius}px`,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
      borderRadius: '50%',
      background: 'currentColor',
      opacity: 'var(--gestio-ripple-opacity, 0.12)',
    });
    container.append(wave);
    element.append(container);

    const grow = wave.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
      duration: GROW_DURATION,
      easing: EASING,
      fill: 'forwards',
    });

    const release = new AbortController();
    const signal = AbortSignal.any([release.signal, this.listeners.signal]);
    const fadeOut = () => {
      release.abort();
      grow.finished
        .catch(() => undefined)
        .then(
          () =>
            // Image clé de départ implicite : l'opacité courante de l'onde.
            wave.animate([{ opacity: 0 }], {
              duration: FADE_DURATION,
              easing: EASING,
              fill: 'forwards',
            }).finished,
        )
        .catch(() => undefined)
        .finally(() => container.remove());
    };
    for (const type of ['pointerup', 'pointercancel'] as const) {
      this.document.addEventListener(type, fadeOut, { signal });
    }
    element.addEventListener('pointerleave', fadeOut, { signal });
    this.listeners.signal.addEventListener('abort', () => container.remove(), { signal });
  }

  private isEnabled(): boolean {
    const element = this.host.nativeElement;
    if (this.gestioRippleDisabled()) return false;
    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      return false;
    }
    const view = this.document.defaultView;
    if (!view) return false;
    if (view.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    return view.getComputedStyle(element).getPropertyValue('--gestio-ripple').trim() === 'on';
  }
}
