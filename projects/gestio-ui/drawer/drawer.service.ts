import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentType, createGlobalPositionStrategy } from '@angular/cdk/overlay';
import { Injector, Service, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { ɵgestioUniqueId as gestioUniqueId } from '@gestiolabs336/ui/core';
import { GESTIO_DRAWER_HOST, GestioDrawerHost } from './drawer-host';
import {
  GESTIO_DRAWER_DATA,
  GestioDrawerPosition,
  GestioDrawerRef,
  GestioDrawerSize,
} from './drawer-ref';

export interface GestioDrawerConfig<D = unknown> {
  /** Données injectables via `GESTIO_DRAWER_DATA`. */
  data?: D;
  /** Bord d'ouverture : fin de ligne (défaut), début de ligne ou bas de l'écran. */
  position?: GestioDrawerPosition;
  /** Côtés : largeur 320 / 420 / 640 px. Bas : hauteur max. 40 / 60 / 85 % de l'écran. */
  size?: GestioDrawerSize;
  /** Fermeture par la touche Échap. `true` par défaut. */
  closeOnEscape?: boolean;
  /** Fermeture par clic sur le fond. `true` par défaut. */
  closeOnBackdropClick?: boolean;
  /**
   * Nom accessible explicite. À fournir si le contenu n'utilise pas
   * `<gestio-drawer-content heading="…">`.
   */
  ariaLabel?: string;
  /**
   * Élément focalisé à l'ouverture : premier élément focalisable (défaut),
   * conteneur (`dialog`), premier titre ou sélecteur CSS.
   * Un élément portant l'attribut `cdkFocusInitial` est prioritaire.
   */
  autoFocus?: 'first-tabbable' | 'dialog' | 'first-heading' | (string & {});
  /** Restaure le focus sur l'élément déclencheur à la fermeture. `true` par défaut. */
  restoreFocus?: boolean;
  /** Identifiant du panneau (généré par défaut). */
  id?: string;
  /** Classes supplémentaires sur le panneau de l'overlay. */
  panelClass?: string | string[];
  /** Injecteur parent du contenu. */
  injector?: Injector;
  /** Position logique du contenu dans l'arbre de composants. */
  viewContainerRef?: ViewContainerRef;
}

const SIDE_WIDTH: Record<GestioDrawerSize, string> = {
  sm: '320px',
  md: '420px',
  lg: '640px',
};

const BOTTOM_MAX_HEIGHT: Record<GestioDrawerSize, string> = {
  sm: '40dvh',
  md: '60dvh',
  lg: '85dvh',
};

/**
 * Ouvre des panneaux latéraux modaux (« drawer », « sheet ») accessibles :
 * piège et restauration du focus, blocage du défilement, fond, Échap.
 * Même socle que `GestioDialogService` (`@angular/cdk/dialog`), positionné
 * contre un bord de l'écran.
 *
 * Pour un usage déclaratif avec `[(open)]`, voir `<gestio-drawer>`.
 */
@Service()
export class GestioDrawerService {
  private readonly cdkDialog = inject(Dialog);
  private readonly injector = inject(Injector);

  /** Ouvre un composant ou un template dans un panneau. */
  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<C>,
    config: GestioDrawerConfig<D> = {},
  ): GestioDrawerRef<R> {
    const position = config.position ?? 'end';
    const size = config.size ?? 'md';
    const closeOnEscape = config.closeOnEscape ?? true;
    const closeOnBackdropClick = config.closeOnBackdropClick ?? true;
    const id = config.id ?? gestioUniqueId('gestio-drawer');
    const panelClasses = ['gestio-drawer-pane', `gestio-drawer-pane--${position}`].concat(
      config.panelClass ?? [],
    );

    const strategy = createGlobalPositionStrategy(config.injector ?? this.injector);
    if (position === 'bottom') strategy.bottom('0').left('0');
    else (position === 'start' ? strategy.start('0') : strategy.end('0')).top('0');

    const dimensions =
      position === 'bottom'
        ? { width: '100%', maxWidth: '100vw', height: 'auto', maxHeight: BOTTOM_MAX_HEIGHT[size] }
        : {
            // Laisse une bande de fond visible (et cliquable) sur petit écran.
            width: `min(${SIDE_WIDTH[size]}, calc(100vw - 2.5rem))`,
            maxWidth: '100vw',
            height: '100%',
            maxHeight: '100dvh',
          };

    let gestioRef: GestioDrawerRef<R> | undefined;

    const cdkRef: DialogRef<R, C> = this.cdkDialog.open<R, D, C>(content, {
      id,
      data: config.data,
      role: 'dialog',
      ariaModal: true,
      ariaLabel: config.ariaLabel ?? null,
      // Titre rendu par <gestio-drawer-content> (voir GestioDrawerRef.titleId).
      ariaLabelledBy: config.ariaLabel ? null : `${id}-title`,
      ariaDescribedBy: config.ariaLabel ? null : `${id}-description`,
      autoFocus: config.autoFocus ?? 'first-tabbable',
      restoreFocus: config.restoreFocus ?? true,
      // La fermeture Échap / fond est gérée ci-dessous, séparément.
      disableClose: true,
      hasBackdrop: true,
      backdropClass: 'gestio-dialog-backdrop',
      panelClass: panelClasses,
      positionStrategy: strategy,
      ...dimensions,
      injector: config.injector,
      viewContainerRef: config.viewContainerRef,
      providers: (ref) => {
        gestioRef = new GestioDrawerRef<R>(ref as DialogRef<R, unknown>, position);
        const host: GestioDrawerHost = {
          titleId: gestioRef.titleId,
          descriptionId: gestioRef.descriptionId,
          position: () => position,
          close: () => gestioRef?.close(),
        };
        return [
          { provide: GestioDrawerRef, useValue: gestioRef },
          { provide: GESTIO_DRAWER_DATA, useValue: config.data ?? null },
          { provide: GESTIO_DRAWER_HOST, useValue: host },
        ];
      },
    });

    // Le CDK appelle `providers` de façon synchrone pendant `open()`.
    const ref = gestioRef ?? new GestioDrawerRef<R>(cdkRef as DialogRef<R, unknown>, position);

    cdkRef.keydownEvents.subscribe((event) => {
      if (
        closeOnEscape &&
        event.key === 'Escape' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        ref.close();
      }
    });

    cdkRef.backdropClick.subscribe(() => {
      if (closeOnBackdropClick) ref.close();
    });

    return ref;
  }
}
