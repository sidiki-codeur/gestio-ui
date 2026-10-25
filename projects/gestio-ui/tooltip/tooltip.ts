import { AriaDescriber } from '@angular/cdk/a11y';
import {
  ConnectedPosition,
  OverlayRef,
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ComponentRef,
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { GestioTooltipPanel } from './tooltip-panel';

export type GestioTooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

const GAP = 6;
const TOP: ConnectedPosition = {
  originX: 'center',
  originY: 'top',
  overlayX: 'center',
  overlayY: 'bottom',
  offsetY: -GAP,
};
const BOTTOM: ConnectedPosition = {
  originX: 'center',
  originY: 'bottom',
  overlayX: 'center',
  overlayY: 'top',
  offsetY: GAP,
};
const START: ConnectedPosition = {
  originX: 'start',
  originY: 'center',
  overlayX: 'end',
  overlayY: 'center',
  offsetX: -GAP,
};
const END: ConnectedPosition = {
  originX: 'end',
  originY: 'center',
  overlayX: 'start',
  overlayY: 'center',
  offsetX: GAP,
};
const POSITIONS: Record<GestioTooltipPlacement, ConnectedPosition[]> = {
  top: [TOP, BOTTOM],
  bottom: [BOTTOM, TOP],
  start: [START, END, TOP],
  end: [END, START, TOP],
};

/** Délai avant affichage au survol (le focus clavier affiche immédiatement). */
const SHOW_DELAY = 400;
/** Délai avant masquage : laisse le temps d'amener le pointeur sur la bulle. */
const HIDE_DELAY = 150;

/**
 * Info-bulle textuelle courte, affichée au survol et au focus clavier.
 *
 * ```html
 * <button gestioButton variant="ghost" aria-label="Exporter" gestioTooltip="Exporter en CSV">…</button>
 * ```
 *
 * - Le texte est relié par `aria-describedby` : il complète le nom accessible sans le remplacer.
 * - WCAG 1.4.13 : Échap masque la bulle, le pointeur peut la survoler, elle reste
 *   affichée tant que le déclencheur est survolé ou focalisé.
 * - Ne pas y mettre d'information indispensable ni d'élément interactif.
 */
@Directive({
  selector: '[gestioTooltip]',
  exportAs: 'gestioTooltip',
  host: {
    '(mouseenter)': 'onPointerEnter()',
    '(mouseleave)': 'onPointerLeave()',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut()',
  },
})
export class GestioTooltip {
  private readonly injector = inject(Injector);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly describer = inject(AriaDescriber);
  private readonly document = inject(DOCUMENT);

  /** Texte de l'info-bulle. Vide : aucune bulle. */
  readonly message = input.required<string>({ alias: 'gestioTooltip' });
  /** Côté préféré (repli automatique si la place manque). */
  readonly placement = input<GestioTooltipPlacement>('top', { alias: 'gestioTooltipPlacement' });
  readonly disabled = input(false, {
    alias: 'gestioTooltipDisabled',
    transform: booleanAttribute,
  });

  private pointerInside = false;
  private focused = false;
  private overlayRef: OverlayRef | null = null;
  private panel: ComponentRef<GestioTooltipPanel> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly rendered = signal(false);

  private readonly onDocumentKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.panel) {
      // Échap ferme la bulle sans fermer une modale parente.
      event.stopPropagation();
      this.hide();
    }
  };

  constructor() {
    afterNextRender(() => this.rendered.set(true));

    // aria-describedby, uniquement dans le navigateur (AriaDescriber manipule le DOM).
    effect((onCleanup) => {
      const message = this.message()?.trim();
      if (!this.rendered() || !message || this.disabled()) return;
      this.describer.describe(this.element, message, 'tooltip');
      onCleanup(() => this.describer.removeDescription(this.element, message, 'tooltip'));
    });

    effect(() => {
      const message = this.message()?.trim() ?? '';
      if (!message || this.disabled()) this.hide();
      else this.panel?.instance.message.set(message);
    });

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.document.removeEventListener('keydown', this.onDocumentKeydown, true);
      this.overlayRef?.dispose();
    });
  }

  /** Affiche la bulle immédiatement. */
  show(): void {
    clearTimeout(this.timer);
    const message = this.message()?.trim();
    if (!message || this.disabled() || this.panel) return;

    // Overlay recréé à chaque affichage : la position suit toujours `placement`.
    this.overlayRef = createOverlayRef(this.injector, {
      positionStrategy: createFlexibleConnectedPositionStrategy(this.injector, this.element)
        .withPositions(POSITIONS[this.placement()])
        .withFlexibleDimensions(false)
        .withViewportMargin(8)
        .withPush(true),
      scrollStrategy: createRepositionScrollStrategy(this.injector, { scrollThrottle: 20 }),
      panelClass: 'gestio-tooltip-pane',
    });
    this.panel = this.overlayRef.attach(new ComponentPortal(GestioTooltipPanel));
    this.panel.instance.message.set(message);
    // Rendu immédiat : la bulle est positionnée avec sa taille réelle.
    this.panel.changeDetectorRef.detectChanges();
    const panelElement = this.panel.location.nativeElement as HTMLElement;
    panelElement.addEventListener('mouseleave', () => this.scheduleHide());
    this.document.addEventListener('keydown', this.onDocumentKeydown, true);
  }

  /** Masque la bulle. */
  hide(): void {
    clearTimeout(this.timer);
    if (!this.panel) return;
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.panel = null;
    this.document.removeEventListener('keydown', this.onDocumentKeydown, true);
  }

  protected onPointerEnter(): void {
    this.pointerInside = true;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.show(), SHOW_DELAY);
  }

  protected onPointerLeave(): void {
    this.pointerInside = false;
    this.scheduleHide();
  }

  protected onFocusIn(): void {
    this.focused = true;
    // Uniquement au clavier : un clic ne doit pas laisser une bulle affichée.
    if (this.element.matches(':focus-visible') || this.element.querySelector(':focus-visible')) {
      this.show();
    }
  }

  protected onFocusOut(): void {
    this.focused = false;
    this.scheduleHide();
  }

  /** Masque après un court délai, sauf si le déclencheur ou la bulle sont encore survolés/focalisés. */
  private scheduleHide(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.pointerInside || this.focused || this.panel?.instance.hovered()) return;
      this.hide();
    }, HIDE_DELAY);
  }
}
