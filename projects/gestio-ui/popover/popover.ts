import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import {
  ConnectedPosition,
  ConnectionPositionPair,
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
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from '@angular/core';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GestioPopoverContext, GestioPopoverPanel, GestioPopoverPosition } from './popover-panel';

export type { GestioPopoverContext, GestioPopoverPosition } from './popover-panel';

/**
 * Élément focalisé à l'ouverture : premier élément focalisable (défaut),
 * la fenêtre elle-même (`dialog`) ou un sélecteur CSS évalué dans la fenêtre.
 * Un élément portant l'attribut `cdkFocusInitial` est prioritaire sur `first-tabbable`.
 */
/** Alignement de la fenêtre sur le déclencheur, pour les positions `top` et `bottom`. */
export type GestioPopoverAlign = 'center' | 'start' | 'end';

export type GestioPopoverAutoFocus = 'first-tabbable' | 'dialog' | (string & {});

/** Écart entre le déclencheur et la fenêtre, avec ou sans flèche (px). */
const GAP_WITH_ARROW = 10;
const GAP = 6;

function connectedPositions(
  position: GestioPopoverPosition,
  align: GestioPopoverAlign,
  gap: number,
): ConnectedPosition[] {
  const top: ConnectedPosition = {
    originX: align,
    originY: 'top',
    overlayX: align,
    overlayY: 'bottom',
    offsetY: -gap,
  };
  const bottom: ConnectedPosition = {
    originX: align,
    originY: 'bottom',
    overlayX: align,
    overlayY: 'top',
    offsetY: gap,
  };
  const start: ConnectedPosition = {
    originX: 'start',
    originY: 'center',
    overlayX: 'end',
    overlayY: 'center',
    offsetX: -gap,
  };
  const end: ConnectedPosition = {
    originX: 'end',
    originY: 'center',
    overlayX: 'start',
    overlayY: 'center',
    offsetX: gap,
  };
  // Position préférée en tête, puis replis si la place manque.
  const order: Record<GestioPopoverPosition, ConnectedPosition[]> = {
    top: [top, bottom, end, start],
    bottom: [bottom, top, end, start],
    start: [start, end, bottom, top],
    end: [end, start, bottom, top],
  };
  return order[position];
}

/** Côté logique effectivement retenu par le CDK. */
function sideOf(pair: ConnectionPositionPair): GestioPopoverPosition {
  if (pair.originY === 'top' && pair.overlayY === 'bottom') return 'top';
  if (pair.originY === 'bottom' && pair.overlayY === 'top') return 'bottom';
  return pair.originX === 'start' ? 'start' : 'end';
}

/**
 * Fenêtre surgissante non modale (motif ARIA « Dialog ») ancrée à un déclencheur,
 * pour un contenu interactif court : filtres, aperçu, formulaire rapide…
 *
 * ```html
 * <button gestioButton variant="outline" [gestioPopoverTrigger]="filtres" popoverAriaLabel="Filtres">
 *   Filtres
 * </button>
 * <ng-template #filtres let-close="close">
 *   <gestio-checkbox label="Factures en retard" />
 *   <button gestioButton size="sm" (click)="appliquer(); close()">Appliquer</button>
 * </ng-template>
 * ```
 *
 * - Le déclencheur reçoit `aria-haspopup="dialog"`, `aria-expanded` et `aria-controls`.
 * - À l'ouverture, le focus entre dans la fenêtre et y reste piégé (Tab / Maj+Tab).
 * - Échap, un clic à l'extérieur ou `close()` ferment la fenêtre ; le focus revient
 *   au déclencheur s'il était dans la fenêtre.
 * - `close` est disponible dans le contexte du template (`let-close="close"`) et sur
 *   la directive (`#pop="gestioPopoverTrigger"` puis `pop.close()`).
 */
@Directive({
  selector: '[gestioPopoverTrigger]',
  exportAs: 'gestioPopoverTrigger',
  host: {
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'popoverOpen()',
    '[attr.aria-controls]': 'popoverOpen() ? panelId : null',
    '(click)': 'toggle()',
  },
})
export class GestioPopoverTrigger {
  private readonly injector = inject(Injector);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly dir = inject(Directionality, { optional: true });

  /** Contenu de la fenêtre. */
  readonly template = input.required<TemplateRef<GestioPopoverContext>>({
    alias: 'gestioPopoverTrigger',
  });
  /** Côté préféré par rapport au déclencheur (repli automatique si la place manque). */
  readonly popoverPosition = input<GestioPopoverPosition>('bottom');
  /** Alignement pour `top` / `bottom` : centré, bord de début ou bord de fin du déclencheur. */
  readonly popoverAlign = input<GestioPopoverAlign>('center');
  /** Affiche une flèche pointant vers le déclencheur. */
  readonly popoverArrow = input(true, { transform: booleanAttribute });
  /** Nom accessible de la fenêtre (sinon, utiliser `popoverAriaLabelledBy`). */
  readonly popoverAriaLabel = input<string>();
  /** Identifiant d'un titre présent dans le contenu, utilisé comme nom accessible. */
  readonly popoverAriaLabelledBy = input<string>();
  /** Élément focalisé à l'ouverture. */
  readonly popoverAutoFocus = input<GestioPopoverAutoFocus>('first-tabbable');
  /** Pose `aria-modal="true"` (le contenu de la page est alors considéré comme inerte). */
  readonly popoverModal = input(false, { transform: booleanAttribute });
  /** Empêche l'ouverture. */
  readonly popoverDisabled = input(false, { transform: booleanAttribute });
  /** Ouvert ou fermé ; `[(popoverOpen)]`. */
  readonly popoverOpen = model(false);

  /** Émis après l'ouverture. */
  readonly opened = output<void>();
  /** Émis après la fermeture. */
  readonly closed = output<void>();

  /** Identifiant de la fenêtre (cible d'`aria-controls`). */
  readonly panelId = gestioUniqueId('gestio-popover');

  private overlayRef: OverlayRef | null = null;
  private panel: ComponentRef<GestioPopoverPanel> | null = null;
  private focusTrap: FocusTrap | null = null;

  constructor() {
    // Pilotage par `[(popoverOpen)]`.
    effect(() => {
      const open = this.popoverOpen();
      untracked(() => (open ? this.attach() : this.detach()));
    });

    // Propage les changements d'entrées à une fenêtre ouverte.
    effect(() => {
      const panel = this.panel;
      const label = this.popoverAriaLabel();
      const labelledBy = this.popoverAriaLabelledBy();
      const modal = this.popoverModal();
      if (!panel) return;
      panel.instance.ariaLabel.set(label);
      panel.instance.ariaLabelledBy.set(labelledBy);
      panel.instance.modal.set(modal);
    });

    inject(DestroyRef).onDestroy(() => this.dispose());
  }

  /** Ouvre la fenêtre. */
  open(): void {
    if (this.popoverDisabled()) return;
    this.popoverOpen.set(true);
    this.attach();
  }

  /** Ferme la fenêtre et rend le focus au déclencheur s'il était dans la fenêtre. */
  close(): void {
    this.popoverOpen.set(false);
    this.detach();
  }

  /** Ouvre ou ferme la fenêtre. */
  toggle(): void {
    if (this.popoverOpen()) this.close();
    else this.open();
  }

  /** Ouvert ou fermé. */
  isOpen(): boolean {
    return this.popoverOpen();
  }

  private attach(): void {
    if (this.overlayRef || this.popoverDisabled()) return;

    const gap = this.popoverArrow() ? GAP_WITH_ARROW : GAP;
    const strategy = createFlexibleConnectedPositionStrategy(this.injector, this.element)
      .withPositions(connectedPositions(this.popoverPosition(), this.popoverAlign(), gap))
      .withFlexibleDimensions(false)
      .withViewportMargin(8)
      .withPush(false)
      // Rendu juste après le déclencheur : reste dans le landmark et l'ordre de lecture.
      .withPopoverLocation('inline');

    const overlayRef = createOverlayRef(this.injector, {
      positionStrategy: strategy,
      scrollStrategy: createRepositionScrollStrategy(this.injector, { scrollThrottle: 20 }),
      panelClass: 'gestio-popover-pane',
    });
    this.overlayRef = overlayRef;

    const panel = overlayRef.attach(new ComponentPortal(GestioPopoverPanel));
    this.panel = panel;
    const instance = panel.instance;
    instance.id.set(this.panelId);
    instance.template.set(this.template());
    instance.context.set({ close: () => this.close() });
    instance.arrow.set(this.popoverArrow());
    instance.align.set(this.popoverAlign());
    // La flèche vise le milieu du déclencheur quand la fenêtre est alignée sur un bord.
    instance.arrowInset.set(this.element.offsetWidth / 2);
    instance.modal.set(this.popoverModal());
    instance.ariaLabel.set(this.popoverAriaLabel());
    instance.ariaLabelledBy.set(this.popoverAriaLabelledBy());
    instance.placement.set(this.physical(this.popoverPosition()));

    strategy.positionChanges.subscribe(({ connectionPair }) =>
      instance.placement.set(this.physical(sideOf(connectionPair))),
    );
    overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      }
    });
    overlayRef.outsidePointerEvents().subscribe((event) => {
      // Un clic sur le déclencheur est déjà traité par `toggle()`.
      const target = event.target as Node | null;
      if (target && this.element.contains(target)) return;
      this.close();
    });

    // Rendu immédiat : la fenêtre est positionnée avec sa taille réelle.
    panel.changeDetectorRef.detectChanges();
    const panelElement = panel.location.nativeElement as HTMLElement;
    this.focusTrap = this.focusTrapFactory.create(panelElement);
    afterNextRender(() => this.focusInitial(panelElement), { injector: this.injector });
    this.opened.emit();
  }

  private detach(): void {
    if (!this.overlayRef) return;
    const panelElement = this.panel?.location.nativeElement as HTMLElement | undefined;
    const active = this.document.activeElement;
    const focusWasInside =
      !active || active === this.document.body || !!panelElement?.contains(active);
    this.dispose();
    if (focusWasInside) this.element.focus();
    this.closed.emit();
  }

  private dispose(): void {
    this.focusTrap?.destroy();
    this.focusTrap = null;
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.panel = null;
  }

  private focusInitial(panelElement: HTMLElement): void {
    if (!this.focusTrap || !panelElement.isConnected) return;
    const autoFocus = this.popoverAutoFocus();
    if (autoFocus === 'dialog') {
      panelElement.focus();
    } else if (autoFocus === 'first-tabbable') {
      if (!this.focusTrap.focusInitialElement()) panelElement.focus();
    } else {
      const target = panelElement.querySelector<HTMLElement>(autoFocus);
      (target ?? panelElement).focus();
    }
  }

  /** `start` / `end` → gauche / droite selon le sens de lecture. */
  private physical(side: GestioPopoverPosition): 'top' | 'bottom' | 'left' | 'right' {
    if (side === 'top' || side === 'bottom') return side;
    const rtl = this.dir?.value === 'rtl';
    return (side === 'start') !== rtl ? 'left' : 'right';
  }
}
